import fs from 'fs';
const p = './App.js';
if (!fs.existsSync(p)) process.exit(1);
let s = fs.readFileSync(p, 'utf8');

if (!s.includes("import EvenTabBar from './components/EvenTabBar'")) {
  if (/import\s+\{\s*theme\s*\}\s+from\s+'\.\/constants\/theme';?/.test(s)) {
    s = s.replace(/import\s+\{\s*theme\s*\}\s+from\s+'\.\/constants\/theme';?/, m => m + "\nimport EvenTabBar from './components/EvenTabBar';");
  } else {
    s = "import EvenTabBar from './components/EvenTabBar';\n" + s;
  }
}

if (!/tabBar=\{.*EvenTabBar/.test(s)) {
  s = s.replace(/<Tab\.Navigator(?![^>]*tabBar=)/, "<Tab.Navigator tabBar={props => <EvenTabBar {...props} />} ");
}

fs.writeFileSync(p, s);
console.log('OK: custom EvenTabBar applied');
