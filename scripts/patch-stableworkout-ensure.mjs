import fs from 'fs';
const p='./screens/StableWorkout.js';
if(!fs.existsSync(p))process.exit(0);
let s=fs.readFileSync(p,'utf8');
if(!s.includes('ensureCurrentOnStart'))process.exit(0);
s=s.replace(/setExercises\(norm\);\s*try\{\s*await\s*ensureCurrentOnStart\(\{\s*programId:p\.programId,[\s\S]*?day\s*\}\);\s*\}\s*catch\(e\)\s*\{\s*\}\s*/m,
"setExercises(norm); if(p.mode==='program'&&p.programId){ try{ await ensureCurrentOnStart({ programId:p.programId, programName:pName, week, day }); }catch(e){} } ");
fs.writeFileSync(p,s);
console.log('ok');
