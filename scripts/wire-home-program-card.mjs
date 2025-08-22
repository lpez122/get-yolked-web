import fs from 'fs';import path from 'path';
const root=process.cwd();let patched=false;
function walk(d){for(const n of fs.readdirSync(d)){if(['node_modules','.git','.expo'].includes(n))continue;const p=path.join(d,n);const st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(js|jsx|ts|tsx)$/.test(n))tryPatch(p)}}
function rel(from,to){const r=path.relative(path.dirname(from),to).replace(/\\/g,'/');return r.startsWith('.')?r:'./'+r}
function tryPatch(f){
  if(patched)return;
  let s=fs.readFileSync(f,'utf8');
  if(!/export\s+default\s+function\s+Home|function\s+HomeScreen|name=['"]Home['"]/.test(s))return;
  const comp=path.join(root,'components','HomeProgramCard.js');
  if(!s.includes("HomeProgramCard")) s=s.replace(/(^import .*;[\r\n]+)/m, m=>m+`import HomeProgramCard from '${rel(f,comp)}';\n`);
  if(!/<HomeProgramCard\s*\/>/.test(s)){
    const rx=/<Text[^>]*>\s*Today\s*<\/Text>/i;
    if(rx.test(s)) s=s.replace(rx, m=>m+"\n      <HomeProgramCard/>");
    else s=s.replace(/return\s*\(\s*<([A-Za-z0-9_]+)[^>]*>/m, m=>m+"\n      <HomeProgramCard/>");
  }
  fs.writeFileSync(f,s);patched=true;console.log('patched',path.relative(root,f));
}
walk(path.join(root,'screens'));
if(!patched)console.log('no suitable Home screen found');
