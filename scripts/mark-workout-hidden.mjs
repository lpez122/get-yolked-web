import fs from 'fs';
const p = './App.js';
if (!fs.existsSync(p)) process.exit(0);
let s = fs.readFileSync(p,'utf8');

// Find the Tab.Screen for Workout and ensure we pass hide options
s = s.replace(
  /<Tab\.Screen\s+name=["']Workout["'][\s\S]*?\/>/,
  '<Tab.Screen name="Workout" component={StableWorkout} options={{ tabBarButton: () => null, tabBarItemStyle:{display:"none"}, tabBarIcon:() => null, tabBarLabel:"", headerShown:false }} />'
);

fs.writeFileSync(p,s);
console.log('✓ App.js marks Workout tab hidden');
