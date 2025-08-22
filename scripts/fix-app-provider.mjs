import fs from 'fs';

const p = './App.js';
if (!fs.existsSync(p)) { console.log('App.js not found'); process.exit(1); }
let s = fs.readFileSync(p, 'utf8');

let lines = s.split('\n');

// drop the bogus import and any duplicate ProgramProgressProvider imports
lines = lines.filter(l => !/import\s*\{\s*ProgramProgressProvider\s*\}\s*from\s*'\.\/import "react-native-gesture-handler";'/.test(l));
lines = lines.filter(l => !/import\s*\{\s*ProgramProgressProvider\s*\}\s*from\s*['"][^'"]*ProgramProgressContext[^'"]*['"]\s*;?\s*$/.test(l));

// ensure gesture-handler is present at the very top
if (!lines.some(l => /^import\s*['"]react-native-gesture-handler['"]\s*;?\s*$/.test(l))) {
  lines.unshift(`import 'react-native-gesture-handler';`);
}

// add exactly one correct ProgramProgressProvider import right after the last import
let lastImportIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (/^import\s.*;?\s*$/.test(lines[i])) lastImportIdx = i;
}
lines.splice(lastImportIdx + 1, 0, `import { ProgramProgressProvider } from './contexts/ProgramProgressContext';`);

s = lines.join('\n');

// remove ALL existing ProgramProgressProvider JSX tags
s = s.replace(/<\s*ProgramProgressProvider\s*>/g, '');
s = s.replace(/<\/\s*ProgramProgressProvider\s*>/g, '');

// wrap the top-level return once
const ret = 'return (';
const retIdx = s.indexOf(ret);
if (retIdx >= 0) {
  const afterRetIdx = retIdx + ret.length;
  s = s.slice(0, afterRetIdx) + '\n    <ProgramProgressProvider>\n      ' + s.slice(afterRetIdx);
  const closeIdx = s.indexOf(');', afterRetIdx + 10);
  if (closeIdx >= 0) {
    s = s.slice(0, closeIdx) + '\n    </ProgramProgressProvider>\n  ' + s.slice(closeIdx);
  }
}

fs.writeFileSync(p, s);
console.log('fixed App.js');
