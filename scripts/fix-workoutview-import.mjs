import fs from 'fs';
const p = './components/WorkoutView.js';
let s = fs.readFileSync(p, 'utf8');
if (s.includes("from '-navigation/native'")) {
  s = s.replace("from '-navigation/native'", "from '@react-navigation/native'");
  fs.writeFileSync(p, s);
  console.log('✔ Fixed: components/WorkoutView.js import path');
} else {
  console.log('ℹ No change: import already correct');
}
