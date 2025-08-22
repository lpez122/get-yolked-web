import fs from 'fs';import path from 'path';
const root=process.cwd();let target=null;
(function walk(d){for(const n of fs.readdirSync(d)){if(['node_modules','.expo','.git'].includes(n))continue;const p=path.join(d,n);const st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(js|jsx|ts|tsx)$/.test(n)&&/Exercises/i.test(n)){const t=fs.readFileSync(p,'utf8');if(/export\s+default\s+function/i.test(t)||/function\s+Exercises/i.test(t)){target=p;break;}}}})(path.join(root,'screens'));
if(!target){console.log('no exercises screen');process.exit(0);}
let s=fs.readFileSync(target,'utf8');
if(!s.includes("registerExercisesProvider")){s=s.replace(/(^import .*;[\r\n]+)/m,(m)=>m+"import { registerExercisesProvider } from '../utils/exerciseSource';\n");}
if(!/registerExercisesProvider\(\(\)\s*=>\s*exercises\)/.test(s)){s=s.replace(/export\s+default\s+function\s+[A-Za-z0-9_]+\s*\([^\)]*\)\s*\{/,m=>m+"\n  try { registerExercisesProvider(()=>exercises); } catch(e) {}\n");}
fs.writeFileSync(target,s);console.log('provider:',path.relative(root,target));
