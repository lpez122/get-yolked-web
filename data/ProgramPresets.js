export const DAYS_PER_WEEK = { 'Get Yolked 4.0': 4 };

export function getNextPointer(programName, week, day) {
  const dpw = DAYS_PER_WEEK[programName] ?? 4;
  if (day < dpw) return { week, day: day + 1 };
  return { week: week + 1, day: 1 };
}

export function getPreset(programName, week, day) {
  return {
    exercises: [
      { name: 'Lying Side Lateral Raise', sets: 3, reps: 10 },
      { name: 'Bicep Curl (Dumbbell)',    sets: 3, reps: 10 }
    ]
  };
}
