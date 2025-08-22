import fs from 'fs';

const p = './App.js';
if (!fs.existsSync(p)) {
  console.error('App.js not found at project root.');
  process.exit(1);
}
let s = fs.readFileSync(p, 'utf8');

if (!s.includes("import WorkoutSmoke from './screens/WorkoutSmoke'")) {
  const imports = [...s.matchAll(/^import .*;$/gm)];
  const idx = imports.length ? imports[imports.length-1].index + imports[imports.length-1][0].length : 0;
  s = s.slice(0, idx) + "\nimport WorkoutSmoke from './screens/WorkoutSmoke';\n" + s.slice(idx);
}

const rx = /(<\s*(?:Tab|Stack)\.Screen\b[^>]*\bname\s*=\s*['"]Workout['"][^>]*\bcomponent\s*=\s*)\{?([A-Za-z0-9_$.]+)\}?/m;
if (rx.test(s)) {
  s = s.replace(rx, '$1{WorkoutSmoke}');
} else {
  if (s.includes('</Tab.Navigator>')) {
    s = s.replace(
      /<\/Tab\.Navigator>/,
      `  <Tab.Screen name="Workout" component={WorkoutSmoke} options={{ tabBarButton: () => null, headerShown: false }} />\n</Tab.Navigator>`
    );
  } else if (s.includes('</Stack.Navigator>')) {
    s = s.replace(
      /<\/Stack\.Navigator>/,
      `  <Stack.Screen name="Workout" component={WorkoutSmoke} options={{ presentation:'modal', animation:'slide_from_bottom', headerShown:false }} />\n</Stack.Navigator>`
    );
  } else {
    console.error('Could not find a Tab.Navigator or Stack.Navigator to add Workout route.');
    process.exit(1);
  }
}

fs.writeFileSync(p, s);
console.log('✔ Routed Workout → WorkoutSmoke');
