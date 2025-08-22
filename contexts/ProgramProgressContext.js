import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureActiveProgram, markCompleteAndAdvance, getNextUp } from '../utils/programProgress';
import { normalizePointer,getSavedProgramById } from '../utils/pointer';
const Ctx=createContext(null);
function hasDay(plan,wk,dy){return plan&&plan[wk]&&Array.isArray(plan[wk][dy])&&(plan[wk][dy].length>0)}
export function ProgramProgressProvider({children}){
  const [current,setCurrent]=useState(null);
  async function load(){
    const ptr=await normalizePointer();
    if(ptr){
      const prog=await getSavedProgramById(ptr.programId);
      if(prog){setCurrent({origin:'saved',programId:prog.id,programName:prog.name||'Program',week:ptr.week,day:ptr.day,status:'ready'});return}
    }
    const n=await getNextUp().catch(()=>null);
    if(n&&n.programName){setCurrent({origin:'preset',programName:n.programName,week:n.week,day:n.day,status:'ready'});return}
    setCurrent(null);
  }
  async function begin({programId,programName,week,day,status}){
    if(programId){
      await AsyncStorage.setItem('current_program_v1',JSON.stringify({programId,week,day}));
      await AsyncStorage.removeItem('program_progress_v1');
      const prog=await getSavedProgramById(programId);
      setCurrent({origin:'saved',programId,programName:prog?.name||programName||'Program',week,day,status:status||'in_progress'});
      return;
    }
    if(programName){
      await ensureActiveProgram(programName,week,day);
      setCurrent({origin:'preset',programName,week,day,status:status||'in_progress'});
    }
  }
  async function stop(){await AsyncStorage.removeItem('current_program_v1');await AsyncStorage.removeItem('program_progress_v1');setCurrent(null)}
  async function advance(){
    const cur=current;if(!cur){await load();return}
    if(cur.origin==='preset'){
      try{await markCompleteAndAdvance({programName:cur.programName,week:cur.week,day:cur.day})}catch(e){}
      const n=await getNextUp().catch(()=>null);
      if(n&&n.programName){setCurrent({origin:'preset',programName:n.programName,week:n.week,day:n.day,status:'ready'});return}
      setCurrent(null);return;
    }
    if(cur.origin==='saved'){
      const prog=await getSavedProgramById(cur.programId);
      if(!prog||!prog.plan){await stop();return}
      let w=Number(cur.week||1),d=Number(cur.day||1);
      let nw=w,nd=d+1;
      if(hasDay(prog.plan,nw,nd)){await AsyncStorage.setItem('current_program_v1',JSON.stringify({programId:cur.programId,week:nw,day:nd}));setCurrent({origin:'saved',programId:cur.programId,programName:cur.programName,week:nw,day:nd,status:'ready'});return}
      nw=w+1;nd=1;
      const days=prog.plan[nw]?Object.keys(prog.plan[nw]).map(Number).sort((a,b)=>a-b):[];
      if(days.length){nd=days[0];await AsyncStorage.setItem('current_program_v1',JSON.stringify({programId:cur.programId,week:nw,day:nd}));setCurrent({origin:'saved',programId:cur.programId,programName:cur.programName,week:nw,day:nd,status:'ready'});return}
      await stop();
    }
  }
  const value=useMemo(()=>({current,begin,stop,advance,refresh:load}),[current]);
  useEffect(()=>{load()},[]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useProgramProgress(){const v=useContext(Ctx);return v||{current:null,begin:async()=>{},stop:async()=>{},advance:async()=>{},refresh:async()=>{}}}
