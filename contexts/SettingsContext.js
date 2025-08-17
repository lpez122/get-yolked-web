import React,{createContext,useContext,useEffect,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
const Ctx=createContext(null); const KEY='settings_v1';
export function SettingsProvider({children}){
  const [settings,setSettings]=useState({units:'lb',name:'',email:'',profileImageUri:'',weightKg:75,heightCm:175,bodyFatPct:18});
  useEffect(()=>{(async()=>{try{const v=await AsyncStorage.getItem(KEY); if(v) setSettings(JSON.parse(v));}catch{}})();},[]);
  useEffect(()=>{AsyncStorage.setItem(KEY,JSON.stringify(settings));},[settings]);
  const update=(patch)=>setSettings(s=>({...s,...patch}));
  return <Ctx.Provider value={{settings,update}}>{children}</Ctx.Provider>;
}
export function useSettings(){return useContext(Ctx);}
export function toKg(units,v){return units==='kg'?v:v*0.45359237;}
