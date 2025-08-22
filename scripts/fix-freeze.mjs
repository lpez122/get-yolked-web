import fs from 'fs';
const p = './components/WorkoutView.js';
let s = fs.readFileSync(p, 'utf8');
let changed = false;

// 1) Remove the bad import (or you could swap to @react-navigation/native; it's unused now)
s = s.replace(/import\s*\{\s*useRoute\s*\}\s*from\s*['"]-navigation\/native['"];\s*\n/, '');
if (s !== fs.readFileSync(p, 'utf8')) changed = true;

// 2) Remove the invalid top-level hook call: "const __ROUTE__ = useRoute();"
s = s.replace(/\n\s*const\s+__ROUTE__\s*=\s*useRoute\(\)\s*;?\s*\n/, '\n');
if (s !== fs.readFileSync(p, 'utf8')) changed = true;

// 3) Remove the module-scope React.useEffect hack that references __ROUTE__/startNow
s = s.replace(/try\{\s*if\(typeof React!=='undefined'\)\{\s*const \{useEffect\}=React;[\s\S]*?\}\s*\}\s*catch\(e\)\{\}\s*/m, '');
if (s !== fs.readFileSync(p, 'utf8')) changed = true;

if (changed) {
  fs.writeFileSync(p, s);
  console.log('✔ Patched components/WorkoutView.js');
} else {
  console.log('ℹ No changes needed');
}
