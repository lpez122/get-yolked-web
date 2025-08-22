const fs = require('fs');

const file = './App.js';
if (!fs.existsSync(file)) { console.error('App.js not found'); process.exit(1); }
let s = fs.readFileSync(file, 'utf8');

function rm(pattern) { s = s.replace(pattern, ''); }

// drop the bogus import line that got inserted earlier
rm(/.*from '\.\/import "react-native-gesture-handler";.*\n?/g);

// drop any existing ProgramProgressProvider imports (we'll add one cleanly)
rm(/^\s*import\s*\{\s*ProgramProgressProvider\s*\}\s*from\s*['"][^'"]*ProgramProgressContext[^'"]*['"]\s*;?\s*$/gm);

// ensure gesture-handler import at top
if (!/^import\s+['"]react-native-gesture-handler['"]\s*;?\s*$/m.test(s)) {
  s = `import 'react-native-gesture-handler';\n` + s;
}

// add the correct ProgramProgressProvider import after the last import
const importMatches = [...s.matchAll(/^import .*;?\s*$/gm)];
const lastImportEnd = importMatches.length ? importMatches[importMatches.length - 1].index + importMatches[importMatches.length - 1][0].length : 0;
s = s.slice(0, lastImportEnd) + `\nimport { ProgramProgressProvider } from './contexts/ProgramProgressContext';\n` + s.slice(lastImportEnd);

// remove any stray <ProgramProgressProvider> tags that were inserted in random components
s = s.replace(/<\s*ProgramProgressProvider\s*>/g, '');
s = s.replace(/<\/\s*ProgramProgressProvider\s*>/g, '');

// wrap the NavigationContainer once
const openIdx = s.indexOf('<NavigationContainer');
if (openIdx !== -1) {
  s = s.slice(0, openIdx) + `<ProgramProgressProvider>\n      ` + s.slice(openIdx);
  const closeIdx = s.lastIndexOf('</NavigationContainer>');
  if (closeIdx !== -1) {
    s = s.slice(0, closeIdx + '</NavigationContainer>'.length) + `\n    </ProgramProgressProvider>` + s.slice(closeIdx + '</NavigationContainer>'.length);
  }
} else {
  // fallback: wrap the outermost return
  const retIdx = s.indexOf('return (');
  if (retIdx !== -1) {
    const after = retIdx + 'return ('.length;
    s = s.slice(0, after) + `\n    <ProgramProgressProvider>\n      ` + s.slice(after);
    const lastClose = s.lastIndexOf(');');
    if (lastClose !== -1) {
      s = s.slice(0, lastClose) + `\n    </ProgramProgressProvider>\n  ` + s.slice(lastClose);
    }
  }
}

fs.writeFileSync(file, s);
console.log('App.js repaired');
