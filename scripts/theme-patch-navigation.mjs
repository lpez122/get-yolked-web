import fs from 'fs';import path from 'path';
const root=process.cwd();const files=[];
(function walk(d){for(const n of fs.readdirSync(d)){if(['node_modules','.expo','.git'].includes(n))continue;const p=path.join(d,n);const st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(js|jsx|ts|tsx)$/.test(n)){const t=fs.readFileSync(p,'utf8');if(t.includes('NavigationContainer'))files.push(p);}}})(root);
function rel(file){const r=path.relative(path.dirname(file),path.join(root,'constants','theme.js')).replace(/\\/g,'/');return r.startsWith('.')?r:'./'+r;}
for(const f of files){let s=fs.readFileSync(f,'utf8');const before=s;const imp=`import { navTheme } from '${rel(f)}';`;if(!s.includes('navTheme')){const imports=[...s.matchAll(/^import .*;$/gm)];const idx=imports.length?imports[imports.length-1].index+imports[imports.length-1][0].length:0;s=s.slice(0,idx)+'\n'+imp+'\n'+s.slice(idx);}s=s.replace(/<NavigationContainer(?![^>]*theme=)/g,'<NavigationContainer theme={navTheme}');if(s!==before){fs.writeFileSync(f,s);console.log('nav theme:',path.relative(root,f));}}
console.log('done');
