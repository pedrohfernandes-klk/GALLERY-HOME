import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PASSPORT_ACTS,
  PASSPORT_VERSION,
  createPassportState,
  isPassportStamped,
  passportEvidenceLine,
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
  state = recordPassportEvent(state, {
    kind:'interaction',action:'attended',capability:'attention',room:'gallery',roomLabel:'Workshop Hall',
    type:'artwork',id:'hall:work-1',label:'Untitled 01',eventId:'visit-10-0-interaction-hall-work-1',at:10,
  });
  state = recordPassportEvent(state, {
    kind:'interaction',action:'consulted',capability:'research',room:'thinking',roomLabel:'Thinking Room',
    type:'screen',id:'thinking:research-desk',label:'Research Desk',eventId:'visit-20-1-interaction-thinking-research-desk',at:20,
  });
  state = recordPassportEvent(state, {
    kind:'interaction',action:'activated',capability:'projection',room:'studio',roomLabel:'The Studio',
    type:'screen',id:'studio:mixing-desk',label:'Mixing Desk',eventId:'visit-30-2-interaction-studio-mixing-desk',at:30,
  });
  state = recordPassportEvent(state, {
    kind:'interaction',action:'spoke',capability:'guidance',room:'outdoor',roomLabel:'The Grove',
    type:'guide',id:'grove:guide',label:'Grove Guide',eventId:'visit-40-3-interaction-grove-guide',at:40,
  });
  state = recordPassportEvent(state, {
    kind:'arrival',action:'returned',capability:'return',room:'hood',roomLabel:'Headquarters',
    id:'headquarters:arrival',label:'Headquarters',eventId:'visit-50-4-arrival-headquarters-arrival',at:50,
  });

  assert.deepEqual(Object.keys(state.stamps), [
    'threshold', 'search', 'projection', 'outside', 'return',
  ]);
  assert.deepEqual(state.stamps.search,{
    at:20,
    eventId:'visit-20-1-interaction-thinking-research-desk',
    legacy:false,
    evidence:{
      action:'consulted',capability:'research',room:'thinking',roomLabel:'Thinking Room',
      type:'screen',id:'thinking:research-desk',label:'Research Desk',
    },
  });
  assert.equal(passportEvidenceLine(state,'search'),'SEARCH — Consulted Research Desk, Thinking Room.');
  assert.deepEqual(passportProgress(state), { completed: 5, total: 5, percent: 100 });
});

test('mere arrival does not award interaction acts', () => {
  let state = createPassportState();
  state = recordPassportEvent(state, { kind: 'arrival', room: 'thinking' });
  state = recordPassportEvent(state, { kind: 'arrival', room: 'studio' });
  state = recordPassportEvent(state, { kind: 'arrival', room: 'outdoor' });

  assert.deepEqual(state.stamps, {});
});

test('unrelated interactions do not award room acts', () => {
  let state = createPassportState();
  state = recordPassportEvent(state, { kind: 'interaction', room: 'thinking', type: 'portal' });
  state = recordPassportEvent(state, { kind: 'interaction', room: 'theatre', type: 'seat' });
  state = recordPassportEvent(state, { kind: 'interaction', room: 'outdoor', type: 'seat' });
  assert.deepEqual(state.stamps, {});
});

test('entry and empty Headquarters arrival do not create false evidence', () => {
  let state=createPassportState();
  state=recordPassportEvent(state,{kind:'enter',room:'gallery'},10);
  state=recordPassportEvent(state,{kind:'arrival',room:'hood'},20);
  assert.deepEqual(state.stamps,{});
});

test('first qualifying evidence wins and later use cannot rewrite the stamp', () => {
  let state=createPassportState();
  const first={
    kind:'interaction',action:'consulted',capability:'research',room:'thinking',
    id:'thinking:research-desk',label:'Research Desk',eventId:'event:first',at:10,
  };
  const later={...first,id:'maps:archive-table',label:'Archive Table',eventId:'event:later',at:20};
  state=recordPassportEvent(state,first);
  state=recordPassportEvent(state,later);
  assert.equal(state.stamps.search.eventId,'event:first');
  assert.equal(state.stamps.search.evidence.label,'Research Desk');
  assert.equal(isPassportStamped(state.stamps.search),true);
});

test('passport restores legacy timestamps as truthful fallback evidence', () => {
  const restored = createPassportState(JSON.stringify({
    version: 1,
    stamps: { threshold: 10, search: 20, nonsense: 30 },
  }));
  assert.equal(restored.version,PASSPORT_VERSION);
  assert.deepEqual(restored.stamps, {
    threshold:{at:10,eventId:null,legacy:true,evidence:null},
    search:{at:20,eventId:null,legacy:true,evidence:null},
  });
  assert.equal(passportEvidenceLine(restored,'search'),'SEARCH — Legacy stamp; detailed evidence unavailable.');
  assert.equal(passportEvidenceLine(restored,'outside'),'OUTSIDE — Not yet stamped.');
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

test('idle build queue continues after a failed room and reports it at the end', async () => {
  const scheduled = [];
  const built = [];
  let settledErrors = null;
  const done = runIdleBuildQueue([
    { id: 'venue', build: () => built.push('venue') },
    { id: 'lab', build: () => { throw new Error('lab failed'); } },
    { id: 'studio', build: () => built.push('studio') },
  ], {
    schedule: callback => scheduled.push(callback),
    onDone: errors => { settledErrors = errors; },
  });

  while (scheduled.length) scheduled.shift()();
  await assert.rejects(done, /lab failed/);
  assert.deepEqual(built, ['venue', 'studio']);
  assert.equal(settledErrors.length, 1);
  assert.equal(settledErrors[0].task.id, 'lab');
});

test('idle build queue survives a failing error reporter', async () => {
  const scheduled = [];
  const built = [];
  const done = runIdleBuildQueue([
    { id: 'venue', build: () => built.push('venue') },
    { id: 'lab', build: () => { throw new Error('lab failed'); } },
    { id: 'studio', build: () => built.push('studio') },
  ], {
    schedule: callback => scheduled.push(callback),
    onError: () => { throw new Error('reporter failed'); },
  });

  while (scheduled.length) scheduled.shift()();
  await assert.rejects(done, /lab failed.*reporter failed/);
  assert.deepEqual(built, ['venue', 'studio']);
});

test('idle build queue survives a failing scheduler', async () => {
  const scheduled = [];
  const built = [];
  let calls = 0;
  const done = runIdleBuildQueue([
    { id: 'venue', build: () => built.push('venue') },
    { id: 'lab', build: () => built.push('lab') },
    { id: 'studio', build: () => built.push('studio') },
  ], {
    schedule: callback => {
      calls += 1;
      if (calls === 2) throw new Error('schedule failed');
      scheduled.push(callback);
    },
  });

  while (scheduled.length) scheduled.shift()();
  await assert.rejects(done, /schedule failed/);
  assert.deepEqual(built, ['venue', 'lab', 'studio']);
});

test('scheduler errors after a synchronous callback still reject without duplicate builds', async () => {
  const built = [];
  const done = runIdleBuildQueue([
    { id: 'venue', build: () => built.push('venue') },
  ], {
    schedule: callback => {
      callback();
      throw new Error('schedule failed after callback');
    },
  });

  await assert.rejects(done, /schedule failed after callback/);
  assert.deepEqual(built, ['venue']);
});

test('finalisation cannot erase recorded build failures', async () => {
  const scheduled = [];
  const done = runIdleBuildQueue([
    { id: 'lab', build: () => { throw new Error('lab failed'); } },
  ], {
    schedule: callback => scheduled.push(callback),
    onDone: errors => { errors.length = 0; },
  });

  while (scheduled.length) scheduled.shift()();
  await assert.rejects(done, /lab failed/);
});
