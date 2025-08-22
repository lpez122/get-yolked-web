import fs from 'fs';
const p = './App.js';
if (!fs.existsSync(p)) { process.exit(1); }
let s = fs.readFileSync(p,'utf8');
if (!s.includes("components/HeaderBar")) {
  s = s.replace(/import[\s\S]+?from\s+['"]\.\/constants\/theme['"];?/, m => m + "\nimport HeaderBar from './components/HeaderBar';");
}
s = s.replace(/<Header\s+title=\{route\.name\}\s*\/>/g, "<HeaderBar title={route.name} />");
s = s.replace(/<Header\s+title=\{route\.name\}\s*>/g, "<HeaderBar title={route.name}>");
s = s.replace(/header\s*:\s*\(\)\s*=>\s*<Header[\s\S]*?\/>/g, "header: () => <HeaderBar title={route.name} />");
fs.writeFileSync(p,s);
console.log('Patched App.js to use HeaderBar');
