import fs from 'fs';

const file = './components/WorkoutView.js';
let src = fs.readFileSync(file, 'utf8');

let changed = false;

// 1) Fix the import path
if (src.includes("from '-navigation/native'")) {
  src = src.replace("from '-navigation/native'", "from '@react-navigation/native'");
  changed = true;
}

// 2) Remove the invalid top-level hook call
//    e.g., "const __ROUTE__ = useRoute();" outside any component
src = src.replace(/\n\s*const\s+__ROUTE__\s*=\s*useRoute\(\)\s*;?\s*\n/, '\n');
if (src !== fs.readFileSync(file, 'utf8')) changed = true;

if (changed) {
  fs.writeFileSync(file, src);
  console.log('✔ Patched components/WorkoutView.js');
} else {
  console.log('ℹ No changes needed in components/WorkoutView.js');
}
