export const PASSPORT_VERSION = 2;
export const PASSPORT_ACTS = Object.freeze([
  { id: 'threshold', label: 'Threshold', detail: 'Enter and look closely.', guidance: 'look closely and use a work in the Hall' },
  { id: 'search', label: 'Search', detail: 'Use a thinking, archive, map or laboratory tool.', guidance: 'use a thinking, archive, map or laboratory tool' },
  { id: 'projection', label: 'Projection', detail: 'Activate a screen, studio tool or garden machine.', guidance: 'activate a screen, Studio tool or Garden machine' },
  { id: 'outside', label: 'Outside', detail: 'Meet something in the Grove.', guidance: 'meet the guide in the Grove' },
  { id: 'return', label: 'Return', detail: 'Reach Headquarters carrying the record of the visit.', guidance: 'reach Headquarters carrying the record of the visit' },
]);

const ACT_IDS = new Set(PASSPORT_ACTS.map(act => act.id));
const SEARCH_INTERACTIONS = new Map([
  ['thinking', new Set(['screen', 'archive'])],
  ['maps', new Set(['archive'])],
  ['lab', new Set(['screen', 'switch'])],
]);
const PROJECTION_ROOMS = new Set(['theatre', 'studio', 'maze', 'night']);
const PROJECTION_INTERACTIONS = new Set(['screen', 'maker']);
const CAPABILITY_ACT = new Map([
  ['attention', 'threshold'],
  ['research', 'search'], ['archive', 'search'], ['map', 'search'], ['laboratory', 'search'],
  ['projection', 'projection'], ['studio', 'projection'], ['making', 'projection'],
  ['guidance', 'outside'],
]);

function nonNegativeNumber(value) {
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function boundedText(value, max) {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  return clean && clean.length <= max ? clean : null;
}

function evidenceSnapshot(event = {}) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) return null;
  const evidence = {};
  for (const [key, max] of Object.entries({
    action:48, capability:64, room:48, roomLabel:80, type:48, id:160, label:160,
  })) {
    const value = boundedText(event[key], max);
    if (value) evidence[key] = value;
  }
  return Object.keys(evidence).length ? evidence : null;
}

function normalizeStamp(value) {
  const numericAt = nonNegativeNumber(value);
  if (numericAt !== null) return { at:numericAt, eventId:null, legacy:true, evidence:null };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const at = nonNegativeNumber(value.at);
  if (at === null) return null;
  const eventId = boundedText(value.eventId, 180);
  const evidence = evidenceSnapshot(value.evidence);
  const legacy = value.legacy === true || !eventId || !evidence;
  return { at, eventId:eventId || null, legacy, evidence:legacy ? null : evidence };
}

export function isPassportStamped(value) {
  return normalizeStamp(value) !== null;
}

export function createPassportState(raw = null) {
  let source = raw;
  if (typeof raw === 'string') {
    try { source = JSON.parse(raw); } catch { source = null; }
  }

  const stamps = {};
  if (source && (source.version === 1 || source.version === PASSPORT_VERSION) && source.stamps && typeof source.stamps === 'object') {
    PASSPORT_ACTS.forEach(({ id }) => {
      const stamp = normalizeStamp(source.stamps[id]);
      if (stamp) stamps[id] = stamp;
    });
  }

  return { version: PASSPORT_VERSION, stamps };
}

function actsForEvent(event = {}, state = createPassportState()) {
  const acts = [];
  const room = String(event.room || '');
  if (event.kind === 'interaction') {
    const capabilityAct = CAPABILITY_ACT.get(event.capability);
    if (capabilityAct) acts.push(capabilityAct);
    if (room === 'gallery' && event.type === 'artwork') acts.push('threshold');
    if (SEARCH_INTERACTIONS.get(room)?.has(event.type)) acts.push('search');
    if (PROJECTION_ROOMS.has(room) && PROJECTION_INTERACTIONS.has(event.type)) acts.push('projection');
    if (room === 'outdoor' && event.type === 'guide') acts.push('outside');
  }
  const carriesRecord = Object.keys(state.stamps).some(id => id !== 'return' && isPassportStamped(state.stamps[id]));
  if (event.kind === 'arrival' && (room === 'hood' || room.startsWith('hood-')) && carriesRecord) acts.push('return');
  return acts;
}

function stampFromEvent(event, now) {
  const at = nonNegativeNumber(event.at) ?? nonNegativeNumber(now);
  if (at === null) return null;
  const eventId = boundedText(event.eventId, 180);
  const evidence = evidenceSnapshot(event);
  const legacy = !eventId || !evidence;
  return { at, eventId:eventId || null, legacy, evidence:legacy ? null : evidence };
}

export function recordPassportEvent(state, event, now = Date.now()) {
  const current = createPassportState(state);
  const additions = new Set(actsForEvent(event, current).filter(id => ACT_IDS.has(id)));
  if (!additions.size) return current;
  const stamp = stampFromEvent(event, now);
  if (!stamp) return current;

  const stamps = {};
  PASSPORT_ACTS.forEach(({ id }) => {
    if (isPassportStamped(current.stamps[id])) stamps[id] = current.stamps[id];
    else if (additions.has(id)) stamps[id] = stamp;
  });
  return { version: PASSPORT_VERSION, stamps };
}

export function passportEvidenceLine(state, actId) {
  const current = createPassportState(state);
  const act = PASSPORT_ACTS.find(item => item.id === actId);
  const heading = (act?.label || boundedText(actId, 32) || 'Act').toUpperCase();
  const stamp = current.stamps[actId];
  if (!stamp) return `${heading} — Not yet stamped.`;
  if (stamp.legacy || !stamp.evidence) return `${heading} — Legacy stamp; detailed evidence unavailable.`;
  const evidence = stamp.evidence;
  const action = evidence.action ? evidence.action[0].toUpperCase() + evidence.action.slice(1) : 'Recorded';
  const object = evidence.label || evidence.id || evidence.type || 'evidence';
  const room = evidence.roomLabel || evidence.room;
  return `${heading} — ${action} ${object}${room ? `, ${room}` : ''}.`;
}

export function passportProgress(state) {
  const current = createPassportState(state);
  const completed = PASSPORT_ACTS.filter(({ id }) => isPassportStamped(current.stamps[id])).length;
  const total = PASSPORT_ACTS.length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}

function defaultSchedule(callback) {
  if (typeof globalThis.requestIdleCallback === 'function') {
    return globalThis.requestIdleCallback(callback, { timeout: 120 });
  }
  return globalThis.setTimeout(callback, 0);
}

export function runIdleBuildQueue(tasks, options = {}) {
  const queue = Array.from(tasks || []);
  const schedule = options.schedule || defaultSchedule;
  const onTask = typeof options.onTask === 'function' ? options.onTask : () => {};

  return new Promise((resolve, reject) => {
    let index = 0;
    let settled = false;
    let scheduling = 0;
    let finishPending = false;
    const errors = [];
    const record = (task, error) => errors.push({ task, error });
    const finish = () => {
      if (settled) return;
      if (scheduling) {
        finishPending = true;
        return;
      }
      settled = true;
      finishPending = false;
      try {
        if (typeof options.onDone === 'function') options.onDone(errors.slice());
      } catch (error) {
        record(null, error);
      }
      if (errors.length) {
        const message = errors.map(({ task, error }) => `${task?.id || 'finalisation'}: ${error?.message || error}`).join('; ');
        reject(new AggregateError(errors.map(entry => entry.error), message));
      } else resolve();
    };
    let step;
    const scheduleStep = () => {
      let started = false;
      const scheduledStep = () => {
        if (started || settled) return;
        started = true;
        step();
      };
      scheduling += 1;
      try {
        schedule(scheduledStep);
      } catch (error) {
        record(queue[index] || null, error);
        scheduledStep();
      } finally {
        scheduling -= 1;
        if (!scheduling && finishPending) finish();
      }
    };
    step = () => {
      if (settled) return;
      if (index >= queue.length) {
        finish();
        return;
      }

      const task = queue[index++];
      let built = false;
      try {
        task.build();
        built = true;
      } catch (error) {
        record(task, error);
        if (typeof options.onError === 'function') {
          try {
            options.onError(task, error, index, queue.length);
          } catch (reporterError) {
            record(task, reporterError);
          }
        }
      }
      if (built) {
        try {
          onTask(task.id, index, queue.length);
        } catch (error) {
          record(task, error);
        }
      }

      if (index >= queue.length) finish();
      else scheduleStep();
    };

    if (!queue.length) finish();
    else scheduleStep();
  });
}
