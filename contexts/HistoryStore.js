import AsyncStorage from '@react-native-async-storage/async-storage';

// Canonical key for all workout sessions
export const KEY = 'workouts_history_v1';
// Legacy key that existed elsewhere in the repo
const LEGACY_KEY = 'workout_history_v1';

async function readArray(key) {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? JSON.parse(v) : [];
  } catch {
    return [];
  }
}

async function writeArray(key, arr) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(arr));
    console.log(`[HistoryStore] writeArray -> key="${key}" count=${Array.isArray(arr) ? arr.length : 0}`);
  } catch {}
}

// One-time migration: if legacy key has data, merge into unified KEY and remove legacy
export async function migrateLegacyHistory() {
  try {
    const legacy = await readArray(LEGACY_KEY);
    if (legacy && legacy.length) console.log(`[HistoryStore] migrateLegacyHistory found legacy count=${legacy.length}`);
    if (!legacy.length) return;
    const current = await readArray(KEY);
    const merged = [...current, ...legacy];
    await writeArray(KEY, merged);
    await AsyncStorage.removeItem(LEGACY_KEY);
    console.log(`[HistoryStore] migrateLegacyHistory merged -> newCount=${merged.length} (removed legacy key)`);
  } catch (e) {
    console.error('[HistoryStore] migrateLegacyHistory error', e);
  }
}

// Append a completed workout session
export async function appendWorkoutSession(session) {
  await migrateLegacyHistory();
  const arr = await readArray(KEY);
  // normalize session: ensure id + date (YYYY-MM-DD)
  const genId = () => 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  const sess = { ...session };
  if (!sess.id) sess.id = genId();
  if (!sess.date) {
    if (sess.dateISO) sess.date = String(sess.dateISO).slice(0, 10);
    else if (sess.endedAt) sess.date = new Date(Number(sess.endedAt)).toISOString().slice(0, 10);
    else sess.date = new Date().toISOString().slice(0, 10);
  }
  arr.push(session);
  await writeArray(KEY, arr);
  console.log('[HistoryStore] appendWorkoutSession', { id: sess.id, date: sess.date, totalAfterAppend: arr.length });
}

// Back-compat alias used elsewhere
export async function addHistoryEntry(session) {
  return appendWorkoutSession(session);
}

// Read the full history array
export async function getHistory() {
  await migrateLegacyHistory();
  return await readArray(KEY);
}

// Clear all history
export async function clearHistory() {
  try {
    await AsyncStorage.removeItem(KEY);
    console.log('[HistoryStore] clearHistory -> removed key', KEY);
  } catch {}
}

// Used to prefill last weight/reps for an exercise in UI
// Supports sessions that stored either ex.rows[] or ex.sets[]
export async function getLastForExercise(name) {
  const arr = await getHistory();
  const target = (name || '').toLowerCase();

  for (let i = arr.length - 1; i >= 0; i--) {
    const s = arr[i];
    const exercises = Array.isArray(s?.exercises) ? s.exercises : [];

    for (const ex of exercises) {
      const exName = (ex?.name || '').toLowerCase();
      if (exName !== target) continue;

      // Prefer rows[] format
      const rows = Array.isArray(ex?.rows) ? ex.rows : null;
      if (rows && rows.length) {
        const done = rows.filter(r => r && r.done);
        if (done.length) {
          const last = done[done.length - 1];
          return {
            weight: typeof last.weight === 'number' ? last.weight : Number(last.weight) || 0,
            reps: typeof last.reps === 'number' ? last.reps : Number(last.reps) || 0,
            units: s.units || 'lb'
          };
        }
      }

      // Fallback to sets[] format
      const sets = Array.isArray(ex?.sets) ? ex.sets : null;
      if (sets && sets.length) {
        const done = sets.filter(x => x && x.done);
        if (done.length) {
          const last = done[done.length - 1];
          return {
            weight: typeof last.weight === 'number' ? last.weight : Number(last.weight) || 0,
            reps: typeof last.reps === 'number' ? last.reps : Number(last.reps) || 0,
            units: s.units || 'lb'
          };
        }
      }
    }
  }
  return null;
}

// Debug helper: prints count & sample
export async function debugHistoryCount() {
  try {
    const arr = await readArray(KEY);
    console.log('[HistoryStore] debugHistoryCount', { key: KEY, count: arr.length, sample: arr.slice(-3) });
    return arr.length;
  } catch (e) {
    console.error('[HistoryStore] debugHistoryCount error', e);
    return 0;
  }
}
