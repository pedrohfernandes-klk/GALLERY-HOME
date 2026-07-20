export const PASSPORT_ACTS = Object.freeze([
  { id: 'threshold', label: 'Threshold', detail: 'Enter and look closely.' },
  { id: 'search', label: 'Search', detail: 'Use a thinking, archive, map or laboratory tool.' },
  { id: 'projection', label: 'Projection', detail: 'Activate a screen, studio tool or garden machine.' },
  { id: 'outside', label: 'Outside', detail: 'Meet something in the Grove.' },
  { id: 'return', label: 'Return', detail: 'Reach Headquarters carrying the record of the visit.' },
]);

const ACT_IDS = new Set(PASSPORT_ACTS.map(act => act.id));
const SEARCH_ROOMS = new Set(['tunnel', 'thinking', 'maps', 'lab', 'spark']);
const PROJECTION_ROOMS = new Set(['theatre', 'studio', 'maze', 'night']);

export function createPassportState(raw = null) {
  let source = raw;
  if (typeof raw === 'string') {
    try { source = JSON.parse(raw); } catch { source = null; }
  }

  const stamps = {};
  if (source && source.version === 1 && source.stamps && typeof source.stamps === 'object') {
    PASSPORT_ACTS.forEach(({ id }) => {
      const value = source.stamps[id];
      if (Number.isFinite(value) && value >= 0) stamps[id] = value;
    });
  }

  return { version: 1, stamps };
}

function actsForEvent(event = {}) {
  const acts = [];
  const room = String(event.room || '');
  if (event.kind === 'enter') acts.push('threshold');
  if (event.kind === 'interaction') {
    if (room === 'gallery' && event.type === 'artwork') acts.push('threshold');
    if (SEARCH_ROOMS.has(room)) acts.push('search');
    if (PROJECTION_ROOMS.has(room)) acts.push('projection');
    if (room === 'outdoor') acts.push('outside');
  }
  if (event.kind === 'arrival' && (room === 'hood' || room.startsWith('hood-'))) acts.push('return');
  return acts;
}

export function recordPassportEvent(state, event, now = Date.now()) {
  const current = createPassportState(state);
  const additions = new Set(actsForEvent(event).filter(id => ACT_IDS.has(id)));
  if (!additions.size) return current;

  const stamps = {};
  PASSPORT_ACTS.forEach(({ id }) => {
    if (Number.isFinite(current.stamps[id])) stamps[id] = current.stamps[id];
    else if (additions.has(id)) stamps[id] = now;
  });
  return { version: 1, stamps };
}

export function passportProgress(state) {
  const current = createPassportState(state);
  const completed = PASSPORT_ACTS.filter(({ id }) => Number.isFinite(current.stamps[id])).length;
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
    const finish = () => {
      try {
        if (typeof options.onDone === 'function') options.onDone();
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    const step = () => {
      if (index >= queue.length) {
        finish();
        return;
      }

      const task = queue[index++];
      try {
        task.build();
        onTask(task.id, index, queue.length);
      } catch (error) {
        reject(error);
        return;
      }

      if (index >= queue.length) {
        finish();
      } else {
        schedule(step);
      }
    };

    if (!queue.length) {
      finish();
    } else {
      schedule(step);
    }
  });
}
