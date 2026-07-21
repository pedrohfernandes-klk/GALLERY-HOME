import test from 'node:test';
import assert from 'node:assert/strict';

import {
  VISIT_VERSION,
  createResetVisitState,
  createVisitGuidanceScheduler,
  createVisitState,
  journeyGuidance,
  normalizeVisitEvent,
  recordVisitEvent,
  visitOrientationStatus,
} from '../assets/js/workshop-visit.js';

test('visit state starts empty and normalized', () => {
  assert.deepEqual(createVisitState(), {
    version: VISIT_VERSION,
    enteredAt: null,
    firstMoveAt: null,
    firstLookAt: null,
    firstInteractionAt: null,
    roomsOpenedAt: null,
    rooms: {},
    events: [],
    nextEventSequence: 0,
  });
});

test('visit state restores valid fields and rejects malformed or unknown versions', () => {
  const restored = createVisitState(JSON.stringify({
    version: VISIT_VERSION,
    enteredAt: 10,
    firstMoveAt: 20,
    firstLookAt: 30,
    firstInteractionAt: 40,
    roomsOpenedAt: 50,
    rooms: { gallery: 10, thinking: 60, bogus: -3 },
    events: [
      { kind: 'interaction', action: 'consulted', capability: 'research', room: 'thinking', roomLabel: 'Thinking Room', type: 'screen', id: 'thinking:research', label: 'Research Desk', source: 'world', at: 40 },
      { kind: 'unknown', room: 'gallery', at: 12 },
    ],
  }));

  assert.equal(restored.enteredAt, 10);
  assert.deepEqual(restored.rooms, { gallery: 10, thinking: 60 });
  assert.deepEqual(restored.events, [
    {
      kind: 'interaction', action: 'consulted', capability: 'research', room: 'thinking',
      roomLabel: 'Thinking Room', type: 'screen', id: 'thinking:research', label: 'Research Desk',
      source: 'world', at: 40, eventId: 'visit-40-0-interaction-thinking-research',
    },
  ]);
  assert.equal(restored.nextEventSequence, 2);
  assert.deepEqual(createVisitState('{bad json'), createVisitState());
  assert.deepEqual(createVisitState({ version: 999, enteredAt: 10 }), createVisitState());
});

test('visit v1 data migrates without losing orientation or event history', () => {
  const migrated=createVisitState({
    version:1,
    enteredAt:10,
    firstMoveAt:20,
    rooms:{gallery:10},
    events:[
      {kind:'enter',room:'gallery',at:10},
      {kind:'move',room:'gallery',at:20},
    ],
  });
  assert.equal(migrated.version,VISIT_VERSION);
  assert.equal(migrated.enteredAt,10);
  assert.equal(migrated.firstMoveAt,20);
  assert.deepEqual(migrated.rooms,{gallery:10});
  assert.deepEqual(migrated.events.map(event=>({
    eventId:event.eventId,kind:event.kind,action:event.action,source:event.source,
  })),[
    {eventId:'visit-10-0-enter-gallery',kind:'enter',action:'entered',source:'world'},
    {eventId:'visit-20-1-move-gallery',kind:'move',action:'moved',source:'world'},
  ]);
  assert.equal(migrated.nextEventSequence,2);
});

test('semantic events are normalized to bounded primitive evidence', () => {
  assert.deepEqual(normalizeVisitEvent({
    kind:'interaction',action:'consulted',capability:'research',room:'thinking',
    roomLabel:' Thinking Room ',type:'screen',id:'thinking:research-desk',
    label:' Research Desk ',source:'world',at:40,
  },null,7),{
    kind:'interaction',action:'consulted',room:'thinking',type:'screen',
    id:'thinking:research-desk',capability:'research',label:'Research Desk',
    roomLabel:'Thinking Room',source:'world',at:40,
    eventId:'visit-40-7-interaction-thinking-research-desk',
  });
  const normalized=normalizeVisitEvent({
    kind:'interaction',action:'invented',source:'remote',label:'x'.repeat(200),at:5,
  },null,0);
  assert.equal(normalized.action,'used');
  assert.equal(normalized.source,'world');
  assert.equal('label' in normalized,false);
  assert.equal(normalizeVisitEvent({kind:'unknown',at:1}),null);
});

test('semantic event IDs remain stable after persistence and distinguish same-time events', () => {
  let state=createVisitState();
  state=recordVisitEvent(state,{kind:'interaction',room:'studio',id:'studio:desk'},100);
  state=recordVisitEvent(state,{kind:'interaction',room:'studio',id:'studio:desk'},100);
  assert.notEqual(state.events[0].eventId,state.events[1].eventId);
  assert.equal(state.nextEventSequence,2);
  assert.deepEqual(createVisitState(JSON.stringify(state)),state);
});

test('visit events advance first-use orientation without overwriting first evidence', () => {
  let state = createVisitState();
  state = recordVisitEvent(state, { kind: 'enter', room: 'gallery' }, 10);
  state = recordVisitEvent(state, { kind: 'move', room: 'gallery' }, 20);
  state = recordVisitEvent(state, { kind: 'target', room: 'gallery', type: 'artwork', id: 'hall:work-1' }, 30);
  state = recordVisitEvent(state, { kind: 'interaction', room: 'gallery', type: 'artwork', id: 'hall:work-1' }, 40);
  state = recordVisitEvent(state, { kind: 'move', room: 'gallery' }, 90);

  assert.equal(state.enteredAt, 10);
  assert.equal(state.firstMoveAt, 20);
  assert.equal(state.firstLookAt, 30);
  assert.equal(state.firstInteractionAt, 40);
  assert.equal(state.events.length, 5);
});

test('arrival and Rooms events complete the contextual orientation sequence', () => {
  let state = createVisitState();
  assert.equal(visitOrientationStatus(state), 'before-entry');

  state = recordVisitEvent(state, { kind: 'enter', room: 'gallery' }, 10);
  assert.equal(visitOrientationStatus(state), 'move');

  state = recordVisitEvent(state, { kind: 'move', room: 'gallery' }, 20);
  assert.equal(visitOrientationStatus(state), 'look');

  state = recordVisitEvent(state, { kind: 'target', room: 'gallery', type: 'artwork' }, 30);
  assert.equal(visitOrientationStatus(state), 'interact');

  state = recordVisitEvent(state, { kind: 'interaction', room: 'gallery', type: 'artwork' }, 40);
  assert.equal(visitOrientationStatus(state), 'explore');

  state = recordVisitEvent(state, { kind: 'arrival', room: 'thinking' }, 50);
  assert.equal(visitOrientationStatus(state), 'rooms');

  state = recordVisitEvent(state, { kind: 'rooms-opened', room: 'thinking' }, 60);
  assert.equal(visitOrientationStatus(state), 'complete');
  assert.deepEqual(state.rooms, { gallery: 10, thinking: 50 });
});

test('visit history is bounded and unknown events are ignored', () => {
  let state = createVisitState();
  state = recordVisitEvent(state, { kind: 'unknown', room: 'gallery' }, 1);
  assert.equal(state.events.length, 0);

  for (let index = 0; index < 320; index += 1) {
    state = recordVisitEvent(state, { kind: 'move', room: 'gallery', id: `move-${index}` }, index + 1);
  }
  assert.equal(state.events.length, 300);
  assert.equal(state.events[0].id, 'move-20');
  assert.equal(state.events.at(-1).id, 'move-319');
});

test('an in-world reset begins a fresh entered visit while an entry-screen reset stays empty', () => {
  const inside=createResetVisitState({inside:true,room:'gallery',now:500});
  assert.equal(inside.enteredAt,500);
  assert.deepEqual(inside.rooms,{gallery:500});
  assert.deepEqual(inside.events,[{
    kind:'enter',action:'entered',room:'gallery',source:'world',at:500,
    eventId:'visit-500-0-enter-gallery',
  }]);
  assert.deepEqual(createResetVisitState({inside:false,room:'gallery',now:500}),createVisitState());
});

test('guidance scheduler replaces stale timers and revalidates status before showing', () => {
  let serial=0;
  let status='rooms';
  const callbacks=new Map();
  const cleared=[];
  const shown=[];
  const scheduler=createVisitGuidanceScheduler({
    setTimer(fn){const id=++serial;callbacks.set(id,fn);return id;},
    clearTimer(id){cleared.push(id);callbacks.delete(id);},
    getStatus:()=>status,
    show:(id,payload)=>shown.push({id,payload}),
  });

  const first=scheduler.schedule('visit-rooms',{delay:900,status:'rooms',payload:'first'});
  const stale=callbacks.get(first);
  const second=scheduler.schedule('visit-rooms',{delay:900,status:'rooms',payload:'second'});
  assert.deepEqual(cleared,[first]);
  assert.equal(scheduler.has('visit-rooms'),true);
  stale();
  assert.deepEqual(shown,[],'a replaced callback cannot show stale guidance');
  status='complete';
  callbacks.get(second)();
  assert.deepEqual(shown,[],'status is checked again when the timer fires');

  status='rooms';
  const third=scheduler.schedule('visit-rooms',{status:'rooms',payload:'third'});
  callbacks.get(third)();
  assert.deepEqual(shown,[{id:'visit-rooms',payload:'third'}]);
  assert.equal(scheduler.has('visit-rooms'),false);
});

test('guidance scheduler cancellation prevents pending callbacks after reset', () => {
  let serial=0;
  const callbacks=new Map();
  const shown=[];
  const scheduler=createVisitGuidanceScheduler({
    setTimer(fn){const id=++serial;callbacks.set(id,fn);return id;},
    clearTimer(){},
    getStatus:()=> 'interact',
    show:id=>shown.push(id),
  });
  const interaction=scheduler.schedule('visit-interaction',{status:'interact'});
  const rooms=scheduler.schedule('visit-rooms',{status:'rooms'});
  scheduler.cancelAll();
  callbacks.get(interaction)();
  callbacks.get(rooms)();
  assert.deepEqual(shown,[]);
  assert.equal(scheduler.has('visit-interaction'),false);
  assert.equal(scheduler.has('visit-rooms'),false);
});

test('journey guidance names the current act and first unstamped meaningful action', () => {
  const acts = [
    { id: 'threshold', label: 'Threshold', guidance: 'look closely in the Hall' },
    { id: 'search', label: 'Search', guidance: 'use a thinking, map or laboratory tool' },
    { id: 'projection', label: 'Projection', guidance: 'activate a screen or making tool' },
  ];

  assert.deepEqual(journeyGuidance('threshold', acts, { threshold: 10 }), {
    currentId: 'threshold',
    nextId: 'search',
    text: 'Threshold is stamped; Search continues when you use a thinking, map or laboratory tool.',
  });
  assert.deepEqual(journeyGuidance('projection', acts, { threshold: 10 }), {
    currentId: 'projection',
    nextId: 'search',
    text: 'Projection is current; Search continues when you use a thinking, map or laboratory tool.',
  });
});

test('journey guidance recognizes evidence-bearing passport stamps',()=>{
  const guidance=journeyGuidance('threshold',[
    {id:'threshold',label:'Threshold',guidance:'look closely'},
    {id:'search',label:'Search',guidance:'use a research tool'},
  ],{
    threshold:{at:10,eventId:'event:threshold',legacy:false,evidence:{action:'attended'}},
  });
  assert.equal(guidance.nextId,'search');
  assert.match(guidance.text,/Threshold is stamped/);
});

test('journey guidance remains quiet when every act is stamped', () => {
  const acts = [
    { id: 'threshold', label: 'Threshold', guidance: 'look closely' },
    { id: 'return', label: 'Return', guidance: 'reach Headquarters' },
  ];
  assert.deepEqual(journeyGuidance('return', acts, { threshold: 1, return: 2 }), {
    currentId: 'return',
    nextId: null,
    text: 'Return is stamped; all acts are complete, so continue without instruction.',
  });
});
