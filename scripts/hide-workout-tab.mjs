import fs from 'fs';
const p = './components/EvenTabBar.js';
if (!fs.existsSync(p)) { console.error('EvenTabBar.js not found'); process.exit(1); }
let s = fs.readFileSync(p,'utf8');

if (!/visibleRoutes\s*=/.test(s)) {
  s = s.replace(
    /return\s*\(\s*<View[^>]*>\s*\{/,
    match => {
      const inject =
`const visibleRoutes = state.routes.filter(r => {
  const desc = descriptors[r.key] || {};
  const opts = desc.options || {};
  const hiddenByFlag = opts.tabBarVisible === false ||
    (opts.tabBarItemStyle && opts.tabBarItemStyle.display === 'none') ||
    opts.tabBarButton === null;
  const hiddenByName = r.name === 'Workout';
  return !(hiddenByFlag || hiddenByName);
});
return (
  <View`;
      return match.replace(/<View/, inject);
    }
  );

  // Replace the old map over state.routes with visibleRoutes
  s = s.replace(/state\.routes\.map\(/g, 'visibleRoutes.map(');
}

fs.writeFileSync(p,s);
console.log('✓ EvenTabBar now hides the Workout tab');
