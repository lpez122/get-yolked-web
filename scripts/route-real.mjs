import fs from 'fs';
const p = './App.js';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(
  /(<Tab\.Screen\s+name=['"]Workout['"][\s\S]*?component=)\{?WorkoutSmoke\}?/,
  '$1{WorkoutScreen}'
);
fs.writeFileSync(p, s);
console.log('✔ Routed Workout → WorkoutScreen (real)');
