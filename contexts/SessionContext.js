import React,{createContext,useContext,useMemo,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSettings} from './SettingsContext';
const Ctx=createContext(null);
export function estimateCalories(sets,durationSec,settings){
  const wkg=settings.weightKg||75;
  const rpes=(sets||[]).map(s=>typeof s?.rpe==='number'?s.rpe:null).filter(x=>x!==null);
  const avgRPE=rpes.length?rpes.reduce((a,b)=>a+b,0)/rpes.length:5;
  const MET=Math.max(3,Math.min(6,3+3*(avgRPE/10)));
  const kcalPerMin=MET*3.5*wkg/200;
  const minutes=Math.max(1,durationSec/60);
  return Math.round(kcalPerMin*minutes);
}
export function SessionProvider({children}){
  const {settings}=useSettings();
  const [current,setCurrent]=useState(null);
  const [sheetVisible,setSheetVisible]=useState(false);
  const startSession=(payload)=>{const startAt=Date.now(); setCurrent({id:String(startAt),startAt,sets:[],...payload}); setSheetVisible(true);};
  const endSession=async(finalize)=>{ if(!current) return null; const endAt=Date.now();
    const durationSec=Math.max(1,Math.round((endAt-current.startAt)/1000));
    const sets=finalize?.sets??current.sets??[];
    const calories=estimateCalories(sets,durationSec,settings);
    const out={...current,...finalize,endAt,durationSec,calories};
    try{const key='calories_history_v1'; const prev=JSON.parse(await AsyncStorage.getItem(key)||'[]');
      prev.push({date:new Date(endAt).toISOString(),calories,durationSec,programName:out.programName||'',week:out.week||1,day:out.day||1});
      await AsyncStorage.setItem(key,JSON.stringify(prev));}catch{}
    setCurrent(null); setSheetVisible(false); return out; };
  const value=useMemo(()=>({current,startSession,endSession,sheetVisible,setSheetVisible}),[current,sheetVisible,settings]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useSession(){return useContext(Ctx);}
