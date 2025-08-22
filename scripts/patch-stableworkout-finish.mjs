import fs from 'fs';
const p='./screens/StableWorkout.js';
if(!fs.existsSync(p)){console.log('missing',p);process.exit(0)}
let s=fs.readFileSync(p,'utf8');let changed=false;
if(!/from 'react-native'\);?/.test(s)){}
if(!/Alert/.test(s)) s=s.replace(/from 'react-native'\)?;?/,"from 'react-native';");
if(!/Alert/.test(s)) s=s.replace(/import\s*\{\s*View,Text,StyleSheet,Pressable,FlatList,TextInput,Modal\s*\}\s*from\s*'react-native';/, "import {View,Text,StyleSheet,Pressable,FlatList,TextInput,Modal,Alert} from 'react-native';");
if(!/addHistoryEntry/.test(s)) s="import { addHistoryEntry } from '../utils/history';\n"+s;
s=s.replace(/async function finish\([\s\S]*?\)\s*\{[\s\S]*?\}\n/, m=>{
return `async function finish(){
const summary={programName,startedAt:Date.now()-Math.round(elapsed)*1000,endedAt:Date.now(),durationSec:Math.round(elapsed),exercises};
try{await endSession({durationSec:summary.durationSec,exercises,programName});}catch(e){}
try{await addHistoryEntry(summary);}catch(e){}
try{Alert.alert('Great job','You finished your workout!');}catch(e){try{alert('Great job! You finished your workout!');}catch(e2){}}
setRunning(false);setElapsed(0);setExercises([]);setProgramName('');
nav.goBack();
}
`
});
fs.writeFileSync(p,s);console.log('patched StableWorkout finish');
