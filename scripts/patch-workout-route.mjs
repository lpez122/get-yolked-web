import fs from 'fs';
const p = './App.js';
let s = fs.readFileSync(p, 'utf8');

if (!s.includes("import WorkoutScreen from './screens/WorkoutScreen'")) {
  const imports = [...s.matchAll(/^import .*?;$/gm)];
  const i = imports.length ? imports[imports.length - 1].index + imports[imports.length - 1][0].length : 0;
  s = s.slice(0, i) + "\nimport WorkoutScreen from './screens/WorkoutScreen';\n" + s.slice(i);
}

if (!/name=['"]Workout['"]/.test(s)) {
  s = s.replace(/<\/Tab\.Navigator>/, `  <Tab.Screen name="Workout" component={WorkoutScreen} options={{ tabBarButton: () => null, headerShown: false }} />
    </Tab.Navigator>`);
}

fs.writeFileSync(p, s);
console.log('OK: App.js patched (hidden Workout route added)');
