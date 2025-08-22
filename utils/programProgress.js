import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPreset, getNextPointer } from '../data/ProgramPresets';
const KEY='program_progress_v1';
async function getState(){try{const raw=await AsyncStorage.getItem(KEY);return raw?JSON.parse(raw):{}}catch{return{}}}
async function setState(state){await AsyncStorage.setItem(KEY,JSON.stringify(state))}
export async function ensureActiveProgram(programName,startWeek=1,startDay=1){
  const s=await getState();
  if(!s.active||(programName&&s.active.programName!==programName)){
    s.active={programName:programName||s.active?.programName||'Get Yolked 4.0',pointer:{week:startWeek,day:startDay},lastCompleted:null};
    await setState(s);
  }
  return s.active;
}
export async function markCompleteAndAdvance({programName,week,day}){
  const s=await getState();
  if(!s.active){s.active={programName:programName||'Get Yolked 4.0',pointer:{week,day},lastCompleted:null}}
  if(programName&&s.active.programName!==programName){s.active={programName,pointer:{week,day},lastCompleted:null}}
  s.active.lastCompleted={week,day,completedAt:Date.now()};
  const next=getNextPointer(s.active.programName,week,day);
  s.active.pointer={week:next.week,day:next.day};
  await setState(s);
  return s.active.pointer;
}
export async function getNextUp(){
  const s=await getState();
  if(!s.active) return null;
  const {programName,pointer}=s.active;
  const preset=getPreset(programName,pointer.week,pointer.day)||{exercises:[]};
  const items=(preset.exercises||[]).map(e=>({name:e.name,sets:e.sets??3,reps:e.reps??10}));
  return {programName,week:pointer.week,day:pointer.day,items,plan:preset};
}
export async function clearProgress(){await setState({})}
