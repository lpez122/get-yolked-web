import fs from 'fs';
const p='./App.js';
if(!fs.existsSync(p))process.exit(0);
let s=fs.readFileSync(p,'utf8'), changed=false;
if(!s.includes("ProgramProgressProvider")){
  s=s.replace(/(^import .*;[\r\n]+)/m, m=>m+"import { ProgramProgressProvider } from './contexts/ProgramProgressContext';\n"); changed=true;
}
if(/return\s*\(\s*<ProgramProgressProvider>/.test(s)==false){
  if(/return\s*\(\s*<WorkoutSessionProvider>/.test(s)){
    s=s.replace(/return\s*\(\s*<WorkoutSessionProvider>/, "return (\n    <ProgramProgressProvider>\n      <WorkoutSessionProvider>"); changed=true;
    s=s.replace(/<\/WorkoutSessionProvider>\s*\)\s*;?\s*$/m, "</WorkoutSessionProvider>\n    </ProgramProgressProvider>\n  );"); 
  } else if(/return\s*\(\s*<SafeAreaProvider>/.test(s)){
    s=s.replace(/return\s*\(\s*<SafeAreaProvider>/, "return (\n    <ProgramProgressProvider>\n      <SafeAreaProvider>"); changed=true;
    s=s.replace(/<\/SafeAreaProvider>\s*\)\s*;?\s*$/m, "</SafeAreaProvider>\n    </ProgramProgressProvider>\n  );");
  } else if(/return\s*\(\s*<NavigationContainer/.test(s)){
    s=s.replace(/return\s*\(\s*<NavigationContainer/, "return (\n    <ProgramProgressProvider>\n      <NavigationContainer"); changed=true;
    s=s.replace(/<\/NavigationContainer>\s*\)\s*;?\s*$/m, "</NavigationContainer>\n    </ProgramProgressProvider>\n  );");
  }
}
if(changed){fs.writeFileSync(p,s);console.log('wrapped App with ProgramProgressProvider')}else{console.log('no change')}
