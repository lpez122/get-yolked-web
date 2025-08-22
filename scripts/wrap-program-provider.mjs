import fs from 'fs';import path from 'path';
const root=process.cwd();
function addImport(s,imp){if(s.includes(imp))return s;const m=[...s.matchAll(/^import .*;$/gm)];const i=m.length?m[m.length-1].index+m[m.length-1][0].length:0;return s.slice(0,i)+`\n${imp}\n`+s.slice(i)}
function wrapReturnJSX(s,openTag,closeTag){
  if(new RegExp(`<${openTag}[> ]`).test(s))return s;
  const rx=/return\s*\(\s*<([\s\S]*?)$/m;const m=s.match(rx);if(!m)return s;
  s=s.replace(/return\s*\(\s*</,`return (\n    <${openTag}>\n      <`); 
  s=s.replace(/<\/([A-Za-z0-9_]+)>\s*\)\s*;?\s*$/m,`</$1>\n    </${openTag}>\n  );`);
  return s;
}
function tryPatch(file,mode){
  if(!fs.existsSync(file))return false;let s=fs.readFileSync(file,'utf8');const before=s;
  s=addImport(s,`import { ProgramProgressProvider } from '${path.relative(path.dirname(file),path.join(root,'contexts','ProgramProgressContext.js')).replace(/\\/g,'/').replace(/^\w/,m=>m=='.'?m:'./'+s)}';`);
  if(mode==='nav'){ s=s.replace(/<NavigationContainer([^>]*)>/,`<ProgramProgressProvider>\n      <NavigationContainer$1>`); s=s.replace(/<\/NavigationContainer>\s*<\/?[^>]*>?/m, m=>`</NavigationContainer>\n      </ProgramProgressProvider>\n`+m.replace(/[\s\S]*/,'') ) }
  else s=wrapReturnJSX(s,'ProgramProgressProvider');
  if(s!==before){fs.writeFileSync(file,s);console.log('wrapped',path.relative(root,file));return true}
  return false
}
let done=false;
const appJS=path.join(root,'App.js');
const appTS=path.join(root,'App.tsx');
const layoutJS=path.join(root,'app','_layout.js');
const layoutTS=path.join(root,'app','_layout.tsx');
const rootNav=path.join(root,'navigation','RootNavigator.js');
done = tryPatch(appJS,'wrap') || tryPatch(appTS,'wrap') || tryPatch(layoutJS,'wrap') || tryPatch(layoutTS,'wrap') || tryPatch(rootNav,'nav');
if(!done)console.log('no root file patched');
