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

test('visitor passport is visible and records entry, interactions and arrivals', () => {
  assert.match(html, /id="passportProgress"/);
  assert.match(html, /id="passportResetBtn"/);
  assert.match(html, /recordPassportEvidence\(\{kind:'enter'/);
  assert.match(html, /recordPassportEvidence\(\{kind:'interaction'/);
  assert.match(html, /recordPassportEvidence\(\{kind:'arrival'/);
});

test('visitor orientation state is imported, persisted and fed by real visit events', () => {
  assert.match(html, /from ['"]\.\/assets\/js\/workshop-visit\.js['"]/);
  assert.match(html, /const VISIT_STORAGE_KEY = 'workshop:visit-v1'/);
  assert.match(html, /recordVisitEvidence\(\{kind:'enter',room:'gallery'/);
  assert.match(html, /recordVisitEvidence\(\{kind:'move',room:currentRoom/);
  assert.match(html, /recordVisitEvidence\(\{kind:'target',room:item\.room/);
  assert.match(html, /recordVisitEvidence\(\{kind:'interaction',room:item\.room/);
  assert.match(html, /recordVisitEvidence\(\{kind:'arrival',room/);
  assert.match(html, /recordVisitEvidence\(\{kind:'rooms-opened',room:currentRoom/);
  assert.match(html, /localStorage\.setItem\(VISIT_STORAGE_KEY/);
  assert.match(html, /localStorage\.removeItem\(VISIT_STORAGE_KEY/);
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

test('known runtime regressions remain removed', () => {
  assert.doesNotMatch(html, /color:\['0xc94145','0xe9c856','0xe7d8ca'\]/);
  const animateBlock = html.slice(html.indexOf('function animate(){'), html.indexOf("document.addEventListener('visibilitychange'"));
  assert.equal((animateBlock.match(/updateHallWindow\(dt\)/g) || []).length, 0,
    'animate does not duplicate the hall-window update already performed by updateWorld');
});
