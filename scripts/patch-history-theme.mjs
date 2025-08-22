import fs from 'fs';import path from 'path';
const root=process.cwd();let historyFiles=[];
(function walk(d){for(const n of fs.readdirSync(d)){if(['node_modules','.expo','.git'].includes(n))continue;const p=path.join(d,n);const st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(js|jsx|ts|tsx)$/.test(n)&&/History/i.test(n))historyFiles.push(p);}})(path.join(root,'screens'));
function relTheme(f){const r=path.relative(path.dirname(f),path.join(root,'constants','theme.js')).replace(/\\/g,'/');return r.startsWith('.')?r:'./'+r;}
if(historyFiles.length===0){console.log('no history screen found');process.exit(0)}
for(const f of historyFiles){
  let s=fs.readFileSync(f,'utf8');const before=s;
  if(!/from ['"]\.\.\/constants\/theme['"]/.test(s)){const imports=[...s.matchAll(/^import .*;$/gm)];const idx=imports.length?imports[imports.length-1].index+imports[imports.length-1][0].length:0;s=s.slice(0,idx)+`\nimport { theme } from '${relTheme(f)}';\n`+s.slice(idx);}
  s=s.replace(/backgroundColor\s*:\s*['"]#0[Ee]0[Ee]10['"]/g,'backgroundColor:theme.bg');
  s=s.replace(/backgroundColor\s*:\s*['"]#121A24['"]/g,'backgroundColor:theme.card');
  s=s.replace(/backgroundColor\s*:\s*['"]#0[Ee]1822['"]/g,'backgroundColor:theme.surface');
  s=s.replace(/color\s*:\s*['"]#?[Ff]{3,6}['"]/g,'color:theme.text');
  s=s.replace(/color\s*:\s*['"]#E6F2FF['"]/g,'color:theme.text');
  s=s.replace(/color\s*:\s*['"]#8FA3B8['"]/g,'color:theme.textDim');
  s=s.replace(/borderColor\s*:\s*['"]#1B2733['"]/g,'borderColor:theme.border');
  s=s.replace(/primary:\s*['"]#[0-9A-Fa-f]{3,8}['"]/g,"primary:theme.accent");
  if(s!==before){fs.writeFileSync(f,s);console.log('themed:',path.relative(root,f));}
}
console.log('done');
