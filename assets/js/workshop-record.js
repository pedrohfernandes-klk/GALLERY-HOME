import { passportProgress, recordPassportEvent } from './workshop-foundation.js';
import { createVisitState, recordVisitEvent, visitOrientationStatus } from './workshop-visit.js';

export function recordWorkshopEventState(state = {}, event = {}, now = Date.now()) {
  const visitState = createVisitState(state.visitState);
  const passportState = state.passportState;
  const nextVisitState = recordVisitEvent(visitState, event, now);
  const accepted = nextVisitState.nextEventSequence > visitState.nextEventSequence;
  if (!accepted) {
    return {
      visitState,
      passportState,
      event: null,
      accepted: false,
      stamped: false,
      status: visitOrientationStatus(visitState),
    };
  }

  const normalizedEvent = nextVisitState.events.at(-1);
  const before = passportProgress(passportState).completed;
  const nextPassportState = recordPassportEvent(passportState, normalizedEvent, normalizedEvent.at);
  const after = passportProgress(nextPassportState).completed;
  return {
    visitState: nextVisitState,
    passportState: nextPassportState,
    event: normalizedEvent,
    accepted: true,
    stamped: after > before,
    status: visitOrientationStatus(nextVisitState),
  };
}
