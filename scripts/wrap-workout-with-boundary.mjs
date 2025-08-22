import fs from 'fs';
const p = './screens/WorkoutScreen.js';
let s = fs.readFileSync(p, 'utf8');

if (!s.includes("from '../components/DevErrorBoundary'")) {
  s = s.replace(/(^import .*;[\r\n]+)/m, (m)=> m + "import DevErrorBoundary from '../components/DevErrorBoundary';\n");
}

// wrap <WorkoutSheet>...</WorkoutSheet> with <DevErrorBoundary>...</DevErrorBoundary>
s = s.replace(
  /return\s*\(\s*<View[\s\S]*?<WorkoutSheet\b([\s\S]*?)<\/WorkoutSheet>\s*<\/View>\s*\);/m,
  (m) => m.replace(
    /<WorkoutSheet([\s\S]*?)<\/WorkoutSheet>/m,
    (n) => `<DevErrorBoundary>\n${n}\n</DevErrorBoundary>`
  )
);

fs.writeFileSync(p, s);
console.log('✔ Wrapped WorkoutScreen with DevErrorBoundary');
