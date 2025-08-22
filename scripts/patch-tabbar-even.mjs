import fs from 'fs';

const p = './App.js';
if (!fs.existsSync(p)) {
  console.error('App.js not found');
  process.exit(1);
}
let s = fs.readFileSync(p, 'utf8');

// 1) Ensure every tab item gets equal width
if (!/tabBarItemStyle\s*:/.test(s)) {
  s = s.replace(
    /screenOptions=\(\{\s*route\s*\}\)\s*=>\s*\(\{/,
    'screenOptions={({route})=>({ tabBarItemStyle:{flex:1}, '
  );
}

// 2) Remove indenting on the bar itself and keep spacing tidy
s = s.replace(/tabBarStyle\s*:\s*\{([^}]*)\}/, (m, inner) => {
  let updated = inner;

  if (!/paddingHorizontal\s*:/.test(updated)) {
    updated = updated.replace(/\s*$/, ',paddingHorizontal:0');
  }
  if (!/justifyContent\s*:/.test(updated)) {
    updated = updated.replace(/\s*$/, ',justifyContent:"space-between"');
  }
  return `tabBarStyle:{${updated}}`;
});

fs.writeFileSync(p, s);
console.log('✓ Bottom tab bar patched for even spacing');
