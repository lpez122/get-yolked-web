import fs from 'fs';
const p='./screens/StableWorkout.js';
if(!fs.existsSync(p)){process.exit(0)}
let s=fs.readFileSync(p,'utf8');
if(!s.includes("from '../utils/programSession'")) s="import { ensureCurrentOnStart, advanceCurrentProgram } from '../utils/programSession';\n"+s;
if(!/ensureCurrentOnStart\(/.test(s)){
  s=s.replace(/setExercises\(norm\);/, "setExercises(norm); try{ await ensureCurrentOnStart({ programId:p.programId, programName:pName, week, day }); }catch(e){}");
}
if(!/advanceCurrentProgram\(\)/.test(s)){
  s=s.replace(/try\{await addHistoryEntry\(summary\);\}catch\(e\)\{\}/, "try{await addHistoryEntry(summary);}catch(e){} try{await advanceCurrentProgram();}catch(e){}");
}
fs.writeFileSync(p,s);
console.log('ok');
