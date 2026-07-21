import test from 'node:test';
import assert from 'node:assert/strict';

import { createPassportState } from '../assets/js/workshop-foundation.js';
import { createVisitState } from '../assets/js/workshop-visit.js';
import { recordWorkshopEventState } from '../assets/js/workshop-record.js';

test('one normalized event advances visit and passport with the same stable evidence reference',()=>{
  const initial={visitState:createVisitState(),passportState:createPassportState()};
  const result=recordWorkshopEventState(initial,{
    kind:'interaction',action:'consulted',capability:'research',room:'thinking',
    roomLabel:'Thinking Room',type:'screen',id:'thinking:research-desk',label:'Research Desk',source:'world',
  },20);

  assert.equal(result.accepted,true);
  assert.equal(result.stamped,true);
  assert.equal(result.event.eventId,'visit-20-0-interaction-thinking-research-desk');
  assert.equal(result.visitState.events.at(-1),result.event);
  assert.equal(result.passportState.stamps.search.eventId,result.event.eventId);
  assert.equal(result.passportState.stamps.search.at,result.event.at);
});

test('invalid events cannot advance either reducer',()=>{
  const initial={visitState:createVisitState(),passportState:createPassportState()};
  const result=recordWorkshopEventState(initial,{kind:'invented',room:'thinking'},20);
  assert.equal(result.accepted,false);
  assert.equal(result.event,null);
  assert.deepEqual(result.visitState,initial.visitState);
  assert.deepEqual(result.passportState,initial.passportState);
});

test('return evidence requires an existing record and uses the normalized arrival event',()=>{
  let state={visitState:createVisitState(),passportState:createPassportState()};
  state=recordWorkshopEventState(state,{
    kind:'interaction',action:'attended',capability:'attention',room:'gallery',type:'artwork',
    id:'hall:work-1',label:'Untitled 01',source:'world',
  },10);
  state=recordWorkshopEventState(state,{
    kind:'arrival',action:'returned',capability:'return',room:'hood',roomLabel:'Headquarters',
    id:'headquarters:arrival',label:'Headquarters',source:'world',
  },30);
  assert.equal(state.passportState.stamps.return.eventId,state.event.eventId);
  assert.equal(state.passportState.stamps.return.evidence.action,'returned');
});
