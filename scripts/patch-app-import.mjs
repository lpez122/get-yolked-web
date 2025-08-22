import fs from 'fs';
const f='./App.js';
let s=fs.readFileSync(f,'utf8');
if(!s.includes("import './utils/patchStorage'")){
  const idx=s.indexOf('\n');
  s=s.slice(0,idx+1)+"import './utils/patchStorage';\n"+s.slice(idx+1);
}
fs.writeFileSync(f,s);
console.log('App.js patched');
