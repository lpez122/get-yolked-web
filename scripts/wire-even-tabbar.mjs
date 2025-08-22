import fs from 'fs';
const p = './App.js';
if (!fs.existsSync(p)) process.exit(0);
let s = fs.readFileSync(p,'utf8');

if (!s.includes("import EvenTabBar from './components/EvenTabBar'")) {
  s = s.replace(/import\s+\{?\s*theme\s*\}?\s+from\s+'\.\/constants\/theme';?/, m => m + "\nimport EvenTabBar from './components/EvenTabBar';");
}

if (!/tabBar=\{.*EvenTabBar/.test(s)) {
  s = s.replace(/<Tab\.Navigator(?![^>]*tabBar=)/, "<Tab.Navigator tabBar={props => <EvenTabBar {...props} />} ");
}

s = s.replace(
  /<Tab\.Screen\s+name=["']Workout["'][\s\S]*?\/>/,
  '<Tab.Screen name="Workout" component={StableWorkout} options={{ tabBarButton: () => null, tabBarItemStyle:{display:"none"}, tabBarIcon:() => null, tabBarLabel:"", headerShown:false }} />'
);

fs.writeFileSync(p,s);
console.log('OK: App wired to EvenTabBar + Workout tab hidden');
