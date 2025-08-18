import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'workouts_history_v1';

export async function appendWorkoutSession(session) {
  const arr = JSON.parse(await AsyncStorage.getItem(KEY) || '[]');
  arr.push(session);
  await AsyncStorage.setItem(KEY, JSON.stringify(arr));
}

export async function getLastForExercise(name) {
  const arr = JSON.parse(await AsyncStorage.getItem(KEY) || '[]');
  for (let i = arr.length - 1; i >= 0; i--) {
    const s = arr[i];
    for (const ex of s.exercises || []) {
      if ((ex.name || '').toLowerCase() === (name || '').toLowerCase()) {
        const done = (ex.sets || []).filter(x => x.done);
        if (done.length) {
          const last = done[done.length - 1];
          return { weight: last.weight ?? 0, reps: last.reps ?? 0, units: s.units || 'lb' };
        }
      }
    }
  }
  return null;
}
