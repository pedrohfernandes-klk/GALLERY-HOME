export const VISIT_VERSION = 2;
export const VISIT_EVENT_LIMIT = 300;

const EVENT_KINDS = new Set(['enter', 'move', 'target', 'interaction', 'arrival', 'rooms-opened']);
const EVENT_ACTIONS = new Set([
  'entered', 'moved', 'attended', 'used', 'arrived', 'opened',
  'consulted', 'activated', 'created', 'saved', 'spoke', 'returned', 'started',
]);
const EVENT_SOURCES = new Set(['world', 'rooms', 'archive', 'notes']);
const DEFAULT_ACTION = Object.freeze({
  enter: 'entered', move: 'moved', target: 'attended', interaction: 'used',
  arrival: 'arrived', 'rooms-opened': 'opened',
});
const STATE_TIMESTAMPS = ['enteredAt', 'firstMoveAt', 'firstLookAt', 'firstInteractionAt', 'roomsOpenedAt'];

function timestamp(value) {
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function token(value, max = 120) {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  return clean && clean.length <= max ? clean : null;
}

function roomToken(value) {
  const room = token(value, 48);
  return room && /^[a-z0-9-]+$/i.test(room) && !['__proto__', 'prototype', 'constructor'].includes(room)
    ? room
    : null;
}

function eventIdToken(value) {
  const id = token(value, 180);
  return id && /^[a-z0-9:._-]+$/i.test(id) ? id : null;
}

function evidenceSlug(event) {
  return String(event.id || event.room || event.kind || 'event')
    .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'event';
}

export function normalizeVisitEvent(event, fallbackAt = null, sequence = 0) {
  if (!event || !EVENT_KINDS.has(event.kind)) return null;
  const at = timestamp(event.at) ?? timestamp(fallbackAt);
  if (at === null) return null;
  const ordinal = Number.isSafeInteger(sequence) && sequence >= 0 ? sequence : 0;
  const normalized = {
    kind: event.kind,
    action: EVENT_ACTIONS.has(event.action) ? event.action : DEFAULT_ACTION[event.kind],
  };
  const room = roomToken(event.room);
  const type = token(event.type, 48);
  const id = token(event.id, 160);
  const capability = token(event.capability, 64);
  const label = token(event.label, 160);
  const roomLabel = token(event.roomLabel, 80);
  if (room) normalized.room = room;
  if (type) normalized.type = type;
  if (id) normalized.id = id;
  if (capability) normalized.capability = capability;
  if (label) normalized.label = label;
  if (roomLabel) normalized.roomLabel = roomLabel;
  normalized.source = EVENT_SOURCES.has(event.source)
    ? event.source
    : event.kind === 'rooms-opened' ? 'rooms' : 'world';
  normalized.at = at;
  normalized.eventId = eventIdToken(event.eventId)
    || `visit-${at}-${ordinal}-${event.kind}-${evidenceSlug(event)}`;
  return normalized;
}

function freshState() {
  return {
    version: VISIT_VERSION,
    enteredAt: null,
    firstMoveAt: null,
    firstLookAt: null,
    firstInteractionAt: null,
    roomsOpenedAt: null,
    rooms: {},
    events: [],
    nextEventSequence: 0,
  };
}

export function createVisitState(raw = null) {
  let source = raw;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      return freshState();
    }
  }
  const supportedVersion = source?.version === 1 || source?.version === VISIT_VERSION;
  if (!source || typeof source !== 'object' || Array.isArray(source) || !supportedVersion) {
    return freshState();
  }

  const state = freshState();
  for (const key of STATE_TIMESTAMPS) state[key] = timestamp(source[key]);

  if (source.rooms && typeof source.rooms === 'object' && !Array.isArray(source.rooms)) {
    for (const [key, value] of Object.entries(source.rooms)) {
      const room = roomToken(key);
      const at = timestamp(value);
      if (room && at !== null) state.rooms[room] = at;
    }
  }

  if (Array.isArray(source.events)) {
    state.events = source.events
      .map((event, sequence) => normalizeVisitEvent(event, null, sequence))
      .filter(Boolean)
      .slice(-VISIT_EVENT_LIMIT);
    const restoredSequence = Number.isSafeInteger(source.nextEventSequence) && source.nextEventSequence >= 0
      ? source.nextEventSequence
      : 0;
    state.nextEventSequence = Math.max(source.events.length, restoredSequence);
  }
  return state;
}

export function recordVisitEvent(state, event, now = Date.now()) {
  const current = createVisitState(state);
  const normalized = normalizeVisitEvent(event, now, current.nextEventSequence);
  if (!normalized) return current;

  const next = {
    ...current,
    rooms: { ...current.rooms },
    events: [...current.events, normalized].slice(-VISIT_EVENT_LIMIT),
    nextEventSequence: current.nextEventSequence + 1,
  };
  const at = normalized.at;
  if (normalized.kind === 'enter' && next.enteredAt === null) next.enteredAt = at;
  if (normalized.kind === 'move' && next.firstMoveAt === null) next.firstMoveAt = at;
  if (normalized.kind === 'target' && next.firstLookAt === null) next.firstLookAt = at;
  if (normalized.kind === 'interaction' && next.firstInteractionAt === null) next.firstInteractionAt = at;
  if (normalized.kind === 'rooms-opened' && next.roomsOpenedAt === null) next.roomsOpenedAt = at;
  if ((normalized.kind === 'enter' || normalized.kind === 'arrival') && normalized.room && next.rooms[normalized.room] === undefined) {
    next.rooms[normalized.room] = at;
  }
  return next;
}

export function createResetVisitState({ inside = false, room = null, now = Date.now() } = {}) {
  const fresh = freshState();
  return inside
    ? recordVisitEvent(fresh, { kind: 'enter', room }, now)
    : fresh;
}

export function createVisitGuidanceScheduler({
  setTimer = globalThis.setTimeout,
  clearTimer = globalThis.clearTimeout,
  getStatus = () => null,
  show = () => {},
} = {}) {
  const pending = new Map();

  function cancel(id) {
    if (!pending.has(id)) return false;
    clearTimer(pending.get(id));
    pending.delete(id);
    return true;
  }

  function schedule(id, { delay = 0, status = null, payload = null } = {}) {
    cancel(id);
    let handle = null;
    const run = () => {
      if (pending.get(id) !== handle) return;
      pending.delete(id);
      if (status === null || getStatus() === status) show(id, payload);
    };
    handle = setTimer(run, delay);
    pending.set(id, handle);
    return handle;
  }

  function cancelAll() {
    for (const id of [...pending.keys()]) cancel(id);
  }

  return {
    schedule,
    cancel,
    cancelAll,
    has: id => pending.has(id),
  };
}

export function visitOrientationStatus(state) {
  const current = createVisitState(state);
  if (current.enteredAt === null) return 'before-entry';
  if (current.firstMoveAt === null) return 'move';
  if (current.firstLookAt === null) return 'look';
  if (current.firstInteractionAt === null) return 'interact';
  if (Object.keys(current.rooms).length < 2) return 'explore';
  if (current.roomsOpenedAt === null) return 'rooms';
  return 'complete';
}

export function journeyGuidance(currentId, acts = [], stamps = {}) {
  const isStamped=value=>Number.isFinite(value) || (!!value && typeof value==='object' && Number.isFinite(value.at));
  const ordered = Array.from(acts || []).filter(act=>act && typeof act.id==='string' && typeof act.label==='string');
  const current = ordered.find(act=>act.id===currentId) || ordered[0] || { id:'threshold', label:'Threshold' };
  const next = ordered.find(act=>!isStamped(stamps?.[act.id])) || null;
  const currentStamped = isStamped(stamps?.[current.id]);
  if(!next){
    return {
      currentId:current.id,
      nextId:null,
      text:`${current.label} is ${currentStamped?'stamped':'current'}; all acts are complete, so continue without instruction.`,
    };
  }
  const guidance=String(next.guidance || next.detail || 'continue the visit').replace(/[.!?]+$/,'');
  const text=next.id===current.id
    ? `${current.label} is current; ${guidance}.`
    : `${current.label} is ${currentStamped?'stamped':'current'}; ${next.label} continues when you ${guidance}.`;
  return {currentId:current.id,nextId:next.id,text};
}
