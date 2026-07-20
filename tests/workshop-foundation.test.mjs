import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PASSPORT_ACTS,
  createPassportState,
  recordPassportEvent,
  passportProgress,
  runIdleBuildQueue,
} from '../assets/js/workshop-foundation.js';

test('passport starts with five unstamped acts', () => {
  const state = createPassportState();
  assert.deepEqual(PASSPORT_ACTS.map(act => act.id), [
    'threshold', 'search', 'projection', 'outside', 'return',
  ]);
  assert.deepEqual(state.stamps, {});
  assert.deepEqual(passportProgress(state), { completed: 0, total: 5, percent: 0 });
});

test('passport records the five kinds of meaningful evidence', () => {
  let state = createPassportState();
  state = recordPassportEvent(state, { kind: 'enter' });
  state = recordPassportEvent(state, { kind: 'interaction', room: 'thinking', type: 'research' });
  state = recordPassportEvent(state, { kind: 'interaction', room: 'studio', type: 'screen' });
  state = recordPassportEvent(state, { kind: 'interaction', room: 'outdoor', type: 'guide' });
  state = recordPassportEvent(state, { kind: 'arrival', room: 'hood' });

  assert.deepEqual(Object.keys(state.stamps), [
    'threshold', 'search', 'projection', 'outside', 'return',
  ]);
  assert.deepEqual(passportProgress(state), { completed: 5, total: 5, percent: 100 });
});

test('mere arrival does not award interaction acts', () => {
  let state = createPassportState();
  state = recordPassportEvent(state, { kind: 'arrival', room: 'thinking' });
  state = recordPassportEvent(state, { kind: 'arrival', room: 'studio' });
  state = recordPassportEvent(state, { kind: 'arrival', room: 'outdoor' });

  assert.deepEqual(state.stamps, {});
});

test('passport restores valid saved progress and rejects malformed data', () => {
  const restored = createPassportState(JSON.stringify({
    version: 1,
    stamps: { threshold: 10, search: 20, nonsense: 30 },
  }));
  assert.deepEqual(restored.stamps, { threshold: 10, search: 20 });
  assert.deepEqual(createPassportState('{bad json').stamps, {});
});

test('idle build queue yields between ordered construction tasks', async () => {
  const scheduled = [];
  const built = [];
  const done = runIdleBuildQueue([
    { id: 'venue', build: () => built.push('venue') },
    { id: 'studio', build: () => built.push('studio') },
    { id: 'hood', build: () => built.push('hood') },
  ], {
    schedule: callback => scheduled.push(callback),
  });

  assert.deepEqual(built, []);
  assert.equal(scheduled.length, 1);

  scheduled.shift()();
  assert.deepEqual(built, ['venue']);
  assert.equal(scheduled.length, 1);

  scheduled.shift()();
  assert.deepEqual(built, ['venue', 'studio']);
  assert.equal(scheduled.length, 1);

  scheduled.shift()();
  await done;
  assert.deepEqual(built, ['venue', 'studio', 'hood']);
});

test('idle build queue rejects when finalisation fails', async () => {
  const scheduled = [];
  const done = runIdleBuildQueue([
    { id: 'venue', build: () => {} },
  ], {
    schedule: callback => scheduled.push(callback),
    onDone: () => { throw new Error('tuning failed'); },
  });

  scheduled.shift()();
  await assert.rejects(done, /tuning failed/);
});
