import fs from 'fs';

const p = './components/WorkoutView.js';
if (!fs.existsSync(p)) { console.error('Missing:', p); process.exit(1); }
let s = fs.readFileSync(p, 'utf8');
let changed = false;

// 1) Fix any bad import path for useRoute (typo in some copies)
s = s.replace(/from\s*['"]-navigation\/native['"]/g, "from '@react-navigation/native'");

// 2) Remove any top-level "const __ROUTE__ = useRoute()" (hook at module scope)
s = s.replace(/\n\s*const\s+__ROUTE__\s*=\s*useRoute\(\)\s*;?\s*\n/g, '\n');

// 3) Remove module-scope hook hacks that call React.useEffect outside a component
//    Pattern: try{ if(typeof React!=='undefined'){ const {useEffect}=React; useEffect(()=>{...},[]); } }catch(e){}
s = s.replace(/try\s*\{\s*if\s*\(\s*typeof\s+React\s*!==\s*['"]undefined['"]\s*\)\s*\{\s*const\s*\{\s*useEffect\s*\}\s*=\s*React;\s*useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?\}\s*,\s*\[\s*\]\s*\);\s*\}\s*\}\s*catch\s*\(\s*e\s*\)\s*\{\s*\}\s*/m, '');

// 4) Extra guard: remove any "React.useEffect(()=>{...})" used at top level
s = s.replace(/React\.useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?\}\s*,\s*\[\s*\]\s*\)\s*;?/m, '');

if (s !== fs.readFileSync(p, 'utf8')) { fs.writeFileSync(p, s); changed = true; }

console.log(changed ? 'patched: WorkoutView.js' : 'no change: WorkoutView.js');
