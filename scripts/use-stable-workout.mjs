import fs from 'fs';
const p='./App.js';let s=fs.readFileSync(p,'utf8');
if(!s.includes("import StableWorkout from './screens/StableWorkout'")){const imports=[...s.matchAll(/^import .*;$/gm)];const idx=imports.length?imports[imports.length-1].index+imports[imports.length-1][0].length:0;s=s.slice(0,idx)+"\nimport StableWorkout from './screens/StableWorkout';\n"+s.slice(idx);}
s=s.replace(/(<\s*(?:Tab|Stack)\.Screen\b[^>]*\bname\s*=\s*['"]Workout['"][\s\S]*?component=)\{?WorkoutSmoke\}?/m,'$1{StableWorkout}');
s=s.replace(/(<\s*(?:Tab|Stack)\.Screen\b[^>]*\bname\s*=\s*['"]Workout['"][\s\S]*?component=)\{?WorkoutScreen\}?/m,'$1{StableWorkout}');
fs.writeFileSync(p,s);console.log('ok');
