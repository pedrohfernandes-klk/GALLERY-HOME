import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('workshop imports and runs the progressive foundation', () => {
  assert.match(html, /from ['"]\.\/assets\/js\/workshop-foundation\.js['"]/);
  assert.match(html, /runIdleBuildQueue\s*\(/);
  assert.match(html, /window\.__workshopMetrics/);
});

test('entry is enabled before the deferred room queue finishes', () => {
  const ready = html.indexOf('markEntryReady();');
  const queue = html.indexOf('runIdleBuildQueue(');
  assert.ok(ready > -1, 'entry-ready marker exists');
  assert.ok(queue > -1, 'deferred queue exists');
  assert.ok(ready < queue, 'entry is made available before deferred construction starts');
  assert.doesNotMatch(html.slice(ready, queue), /\banimate\(\)/,
    'the full animation loop does not compete with background construction behind the opaque poster');
  const opening = html.slice(html.indexOf('function beginPosterOpen(){'), html.indexOf('function makeGridTexture'));
  assert.match(opening, /ensureAnimationStarted\(\)/,
    'animation begins on demand when the visitor enters');
  assert.match(html, /if\(!placeBuildReady\(place\)\)/,
    'fast travel blocks distant destinations until their geometry exists');
  assert.match(html, /if\(!roomBuildReady\(portal\.room\)\)/,
    'physical portals block destinations until their geometry exists');
});

test('visitor passport consumes the same normalized evidence as the visit ledger', () => {
  assert.match(html, /id="passportProgress"/);
  assert.match(html, /id="passportResetBtn"/);
  assert.match(html, /from ['"]\.\/assets\/js\/workshop-record\.js['"]/);
  assert.match(html, /recordWorkshopEventState\s*\(/);
  assert.match(html, /recordWorkshopEvidence\(\{kind:'interaction'/);
  assert.match(html, /recordWorkshopEvidence\(\{kind:'arrival'/);
  assert.doesNotMatch(html, /recordPassportEvidence\(\{kind:/,
    'raw events cannot bypass the normalized ledger');
});

test('Passport stamps expose truthful evidence without a permanent activity feed',()=>{
  assert.match(html,/id="passportEvidence"/);
  assert.match(html,/passportEvidenceLine\(passportState,passportEvidenceAct\)/);
  assert.match(html,/journeyBeat\[data-beat\]/);
  assert.match(html,/beat\.addEventListener\('click',selectEvidence\)/);
  assert.match(html,/beat\.addEventListener\('focus',selectEvidence\)/);
  assert.doesNotMatch(html,/class="activityFeed"/);
});

test('visitor orientation state is imported, persisted and fed by real visit events', () => {
  assert.match(html, /from ['"]\.\/assets\/js\/workshop-visit\.js['"]/);
  assert.match(html, /const VISIT_STORAGE_KEY = 'workshop:visit-v1'/);
  assert.match(html, /recordWorkshopEvidence\(\{kind:'enter'/);
  assert.match(html, /recordWorkshopEvidence\(\{kind:'move'/);
  assert.match(html, /recordWorkshopEvidence\(\{kind:'target'/);
  assert.match(html, /recordWorkshopEvidence\(\{kind:'interaction'/);
  assert.match(html, /recordWorkshopEvidence\(\{kind:'arrival'/);
  assert.match(html, /recordWorkshopEvidence\(\{kind:'rooms-opened'/);
  assert.match(html, /localStorage\.setItem\(VISIT_STORAGE_KEY/);
  assert.match(html, /localStorage\.removeItem\(VISIT_STORAGE_KEY/);
});

test('successful interactions carry stable authored evidence and physical portals record arrival',()=>{
  assert.match(html,/action: cfg\.action \|\| 'used'/);
  assert.match(html,/capability: cfg\.capability \|\| null/);
  assert.match(html,/if\(outcome===false\) return false/,
    'failed uses cannot create evidence');
  assert.match(html,/id:screen\.id \|\| stableInteractionId/);
  assert.match(html,/id:hotspot\.id \|\| stableInteractionId/);
  assert.match(html,/id:entry\.data\?\.id \|\| stableInteractionId/);
  const travel=html.slice(html.indexOf('function travelTo(portal)'),html.indexOf('function goTo('));
  assert.match(travel,/recordWorkshopEvidence\(\{kind:'arrival'/,
    'walking through a physical portal records the destination');
});

test('first-use guidance is contextual, paint-safe, delayed and dismissible', () => {
  assert.match(html, /queueVisitGuidanceAfterPaint\('visit-move'/);
  assert.match(html, /dismissVisitGuidance\('visit-move'\)/,
    'movement immediately dismisses its first-use hint');
  assert.match(html, /requestAnimationFrame\(\(\)=>requestAnimationFrame/,
    'cold-load guidance waits for a real paint before starting its lifetime');
  assert.match(html, /visitGuidanceScheduler\.schedule\('visit-interaction'/);
  assert.match(html, /visitGuidanceScheduler\.schedule\('visit-rooms'/);
  assert.match(html, /visitGuidanceScheduler\.cancelAll\(\)/,
    'new visits cancel every callback from the previous visit');
  assert.match(html, /if\(item\)[\s\S]*?scheduleInteractionGuidance\(\)/,
    'restored first-look evidence still schedules interaction guidance');
  assert.match(html, /dismissVisitGuidance\('visit-interaction'\)/);
  assert.match(html, /item\.hintText && visitState\.firstInteractionAt!==null/,
    'object-specific teaching waits until basic interaction has been learned');
});

test('Rooms distinguishes current, stamped and next acts with situational guidance', () => {
  assert.match(html, /journeyGuidance/);
  assert.match(html, /id="journeyGuidance"/);
  assert.match(html, /classList\.toggle\('active'/);
  assert.match(html, /classList\.toggle\('next'/);
  assert.match(html, /classList\.toggle\('available'/);
  assert.match(html, /guidanceEl\.textContent=guidance\.text/);
  const map = html.indexOf('id="journeyMap"');
  const guidance = html.indexOf('id="journeyGuidance"');
  const passport = html.indexOf('class="passportSummary"');
  assert.ok(map < guidance && guidance < passport,
    'situational guidance sits directly beneath the narrative map');
});

test('Research Desk link synchronisation is non-recursive and maintains the wider-web URL', () => {
  const start = html.indexOf('function syncResearchExternalLinks(){');
  const end = html.indexOf('function stripHtmlSnippet', start);
  const sync = html.slice(start, end);
  assert.ok(start > -1 && end > start, 'Research link synchronisation exists');
  assert.doesNotMatch(sync, /syncResearchExternalLinks\(\);/,
    'link synchronisation must not recursively invoke itself');
  assert.match(sync, /researchOpenLink\.href\s*=\s*researchOpenUrl\(q\)/,
    'the wider-web link follows the active query');
  assert.match(sync, /researchGoogleSearchLink\.href\s*=\s*researchGoogleUrl\(q\)/,
    'the Google-search link follows the active query');
});

test('world movement and shortcuts do not conflict with focused interface controls', () => {
  const start = html.indexOf("const moveKeySet = new Set(['w','a'");
  const end = html.indexOf("window.addEventListener('keyup'", start);
  const input = html.slice(start, end);
  assert.ok(start > -1 && end > start, 'global keyboard handler exists');
  assert.match(input, /interactiveTarget/,
    'interactive browser controls are recognised before world shortcuts run');
  assert.match(input, /if\(\(typingTarget\s*\|\|\s*interactiveTarget\).*return;/,
    'focused controls retain native keyboard behaviour');
  assert.doesNotMatch(input, /if\(k==='a'\) openArchive/,
    'A remains exclusively a left-strafe key');
  assert.match(input, /if\(k==='o'\) openArchive\('rooms'\)/,
    'Archive uses a non-conflicting O shortcut');
  assert.match(html, /<code>O<\/code>: Archive/,
    'Help documents the non-conflicting Archive shortcut');
});

test('blocking overlays share focus lifecycle and background isolation', () => {
  assert.match(html, /function openAccessibleDialog\(/);
  assert.match(html, /function closeAccessibleDialog\(/);
  assert.match(html, /app\.inert\s*=\s*true/,
    'opening a dialog makes the background inert');
  assert.match(html, /document\.addEventListener\('keydown',\s*handleAccessibleDialogKeydown/,
    'the helper traps Tab and handles Escape centrally');
  assert.match(html, /openAccessibleDialog\(panel/, 'Grove uses the shared dialog helper');
  assert.match(html, /openAccessibleDialog\(hoodLiftPanel|openAccessibleDialog\(panel/, 'lift uses the shared dialog helper');
  assert.match(html, /openAccessibleDialog\(panel,\{initialFocus:panel\.querySelector\('\[data-act="close"\]'\),onEscape:closeGardenMaker\}/,
    'Garden desk moves focus to its close control and supports Escape');
  assert.match(html, /openAccessibleDialog\(panel,\{initialFocus:frame,onEscape:closeStudioMaker\}\)/,
    'Studio desk moves focus into its desk and supports Escape');
  assert.match(html, /iframe:not\(\[tabindex="-1"\]\)/,
    'the projection iframe participates in the dialog focus sequence');
  assert.match(html, /openAccessibleDialog\(\$\('playOverlay'\)/,
    'projection player uses the shared dialog helper');
});

test('known runtime regressions remain removed', () => {
  assert.doesNotMatch(html, /color:\['0xc94145','0xe9c856','0xe7d8ca'\]/);
  const animateBlock = html.slice(html.indexOf('function animate(){'), html.indexOf("document.addEventListener('visibilitychange'"));
  assert.equal((animateBlock.match(/updateHallWindow\(dt\)/g) || []).length, 0,
    'animate does not duplicate the hall-window update already performed by updateWorld');
});
