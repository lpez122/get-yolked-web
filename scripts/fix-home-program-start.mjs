import fs from 'fs';
const p = './components/HomeProgramCard.js';
if (!fs.existsSync(p)) process.exit(1);
let s = fs.readFileSync(p, 'utf8');

const re = /function\s+start\s*\(\)\s*\{[\s\S]*?\}/m;
s = s.replace(re, `
function start(){
  const a = active || {};
  const w = Number(a.currentWeek || 1);
  const d = Number(a.currentDay || 1);
  nav.navigate('Workout', {
    mode: 'program',
    programId: a.id,
    programName: a.name,
    week: w,
    day: d
  });
}
`.trim());

fs.writeFileSync(p, s);
console.log('OK');
