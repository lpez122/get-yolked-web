import fs from 'fs';

const file = './App.js';
if (!fs.existsSync(file)) { console.error('App.js not found'); process.exit(1); }
let s = fs.readFileSync(file, 'utf8');

// 1) Remove the garbage line and any broken import referencing it
s = s.replace(/.*from '\.\/import "react-native-gesture-handler";.*\n?/g, '');
s = s.replace(/^\s*ontexts\/ProgramProgressContext\.js';\s*$/gm, '');

// 2) Deduplicate imports (keep the first occurrence)
const lines = s.split('\n');
const seen = new Set();
const importLines = [];
const bodyLines = [];
for (const line of lines) {
  if (/^\s*import\b/.test(line)) {
    if (!seen.has(line.trim())) {
      seen.add(line.trim());
      importLines.push(line);
    }
  } else {
    bodyLines.push(line);
  }
}

// 3) Guarantee exactly one gesture-handler import at top
const gh = `import "react-native-gesture-handler";`;
const hasGH = importLines.some(l => l.replace(/'/g,'"').trim() === gh);
const filteredImports = importLines.filter(l => l.replace(/'/g,'"').trim() !== gh);
const importsFinal = [gh, ...filteredImports];

// 4) Ensure exactly one ProgramProgressProvider import
const ppp = `import { ProgramProgressProvider } from './contexts/ProgramProgressContext';`;
const withoutPPP = importsFinal.filter(l => !/ProgramProgressProvider/.test(l));
withoutPPP.push(ppp);

// 5) Rebuild source with clean imports
s = withoutPPP.join('\n') + '\n' + bodyLines.join('\n');

// 6) Remove any stray ProgramProgressProvider JSX tags
s = s.replace(/<\s*ProgramProgressProvider\s*>/g, '');
s = s.replace(/<\/\s*ProgramProgressProvider\s*>/g, '');

// 7) Wrap NavigationContainer once with ProgramProgressProvider
const openIdx = s.indexOf('<NavigationContainer');
if (openIdx !== -1) {
  const before = s.slice(0, openIdx);
  const afterOpen = s.slice(openIdx);
  const closeIdx = afterOpen.indexOf('</NavigationContainer>');
  if (closeIdx !== -1) {
    const navCloseEnd = closeIdx + '</NavigationContainer>'.length;
    const navBlock = afterOpen.slice(0, navCloseEnd);
    const rest = afterOpen.slice(navCloseEnd);
    s = `${before}<ProgramProgressProvider>\n${navBlock}\n</ProgramProgressProvider>${rest}`;
  }
} else {
  // fallback: wrap the outermost return
  const rIdx = s.indexOf('return (');
  if (rIdx !== -1) {
    const afterR = rIdx + 'return ('.length;
    s = s.slice(0, afterR) + `\n  <ProgramProgressProvider>\n  ` + s.slice(afterR);
    const endIdx = s.lastIndexOf(');');
    if (endIdx !== -1) {
      s = s.slice(0, endIdx) + `\n  </ProgramProgressProvider>\n` + s.slice(endIdx);
    }
  }
}

// 8) Save
fs.writeFileSync(file, s);
console.log('App.js cleaned and wrapped.');
