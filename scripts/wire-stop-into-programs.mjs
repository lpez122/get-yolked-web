import fs from 'fs';import path from 'path';
const root=process.cwd();let target=null;
(function walk(d){for(const n of fs.readdirSync(d)){if(['node_modules','.expo','.git'].includes(n))continue;const p=path.join(d,n);const st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(js|jsx|ts|tsx)$/.test(n)&&/Program/i.test(n)){const t=fs.readFileSync(p,'utf8');if(/export\s+default\s+function/i.test(t)||/function\s+Programs?/i.test(t)){target=p;break;}}}})(path.join(root,'screens'));
if(!target){console.log('no Programs screen found');process.exit(0)}
let s=fs.readFileSync(target,'utf8');
if(!s.includes("import StopCurrentProgramButton from '../components/StopCurrentProgramButton'")){
  s=s.replace(/(^import .*;[\r\n]+)/m,(m)=>m+"import StopCurrentProgramButton from '../components/StopCurrentProgramButton';\n");
}
if(!/StopCurrentProgramButton/.test(s)){
  s=s.replace(/return\s*\(\s*<View([^>]*)>/, (m,attrs)=>`return(<View${attrs}><StopCurrentProgramButton/>`);
}
fs.writeFileSync(target,s);
console.log('wired:',path.relative(root,target));
