import fs from 'fs';
const p='./App.js';
if(!fs.existsSync(p)){console.log('App.js not found');process.exit(1)}
let s=fs.readFileSync(p,'utf8');
let lines=s.split('\n');
lines=lines.filter(l=>!l.includes(`from './import "react-native-gesture-handler";`));
lines=lines.filter(l=>!/^import\s*\{\s*ProgramProgressProvider\s*\}\s*from\s*['"][^'"]*ProgramProgressContext[^'"]*['"]\s*;?\s*$/.test(l));
if(!lines.some(l=>/^import\s*['"]react-native-gesture-handler['"]\s*;?\s*$/.test(l))){
  lines.unshift(`import 'react-native-gesture-handler';`);
}
s=lines.join('\n');
if(!/from '\.\/contexts\/ProgramProgressContext'/.test(s)){
  const imports=[...s.matchAll(/^import .*;?\s*$/gm)];
  const idx=imports.length?imports[imports.length-1].index+imports[imports.length-1][0].length:0;
  s=s.slice(0,idx)+`\nimport { ProgramProgressProvider } from './contexts/ProgramProgressContext';\n`+s.slice(idx);
}
s=s.replace(/<\s*ProgramProgressProvider\s*>/g,'').replace(/<\/\s*ProgramProgressProvider\s*>/g,'');
const marker='return (';
const i=s.indexOf(marker);
if(i>=0){
  const j=i+marker.length;
  s=s.slice(0,j)+`\n    <ProgramProgressProvider>\n`+s.slice(j);
  const k=s.lastIndexOf(');');
  if(k>j){ s=s.slice(0,k)+`\n    </ProgramProgressProvider>\n  `+s.slice(k); }
}
fs.writeFileSync(p,s);
console.log('App.js cleaned');
