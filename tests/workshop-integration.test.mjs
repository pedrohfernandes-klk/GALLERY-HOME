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

test('known runtime regressions remain removed', () => {
  assert.doesNotMatch(html, /color:\['0xc94145','0xe9c856','0xe7d8ca'\]/);
  const animateBlock = html.slice(html.indexOf('function animate(){'), html.indexOf("document.addEventListener('visibilitychange'"));
  assert.equal((animateBlock.match(/updateHallWindow\(dt\)/g) || []).length, 0,
    'animate does not duplicate the hall-window update already performed by updateWorld');
});
