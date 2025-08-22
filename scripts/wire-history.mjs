import fs from 'fs';
const p='./App.js';if(!fs.existsSync(p)){console.log('missing App.js');process.exit(0)}
let s=fs.readFileSync(p,'utf8');
if(!s.includes("import HistoryFallback from './screens/HistoryFallback'")){const imports=[...s.matchAll(/^import .*;$/gm)];const idx=imports.length?imports[imports.length-1].index+imports[imports.length-1][0].length:0;s=s.slice(0,idx)+"\nimport HistoryFallback from './screens/HistoryFallback';\n"+s.slice(idx);}
if(/name\s*=\s*['"]History['"]/.test(s))s=s.replace(/(<\s*(?:Tab|Stack)\.Screen\b[^>]*\bname\s*=\s*['"]History['"][\s\S]*?component=)\{?([A-Za-z0-9_$.]+)\}?/m,'$1{HistoryFallback}');
fs.writeFileSync(p,s);console.log('wired History');
