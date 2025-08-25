import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
const Ctx=createContext(null); const KEY='settings_v1';

const genId = ()=> 'u_' + Math.random().toString(36).slice(2,9) + '_' + Date.now().toString(36);

export function SettingsProvider({children}){
  // include `username` in settings; `id` will be derived from username when available
  const [settings,setSettings]=useState(()=>({
    id: genId(),
    username: '',
    units:'lb',
    name: '',
    email:'',
    profileImageUri:'',
    weightKg:75,
    heightCm:175,
    bodyFatPct:18,
    age:30
  }));

  useEffect(()=>{
    (async()=>{
      try{
        const v=await AsyncStorage.getItem(KEY);
        if(v){
          const parsed = JSON.parse(v);
          // merge parsed over current to preserve the generated id (avoid id flip on first render)
          setSettings(prev => {
            const merged = { ...prev, ...parsed };
            // if a username is provided in persisted settings, use it as the stable id
            if (merged.username) {
              merged.id = String(merged.username);
            } else {
              if(!merged.id) merged.id = prev.id || genId();
            }
            return merged;
          });
        }
      }catch{}
    })();
  },[]);

  useEffect(()=>{
    (async()=>{ try{ await AsyncStorage.setItem(KEY,JSON.stringify(settings)); }catch{} })();
  },[settings]);

  // when username is updated, reflect that into settings.id so other code can continue using settings.id
  const update=(patch)=>setSettings(s=>{
    const next = {...s, ...patch};
    if (patch && typeof patch.username === 'string') {
      next.id = String(patch.username);
    }
    return next;
  });
  return <Ctx.Provider value={{settings,update}}>{children}</Ctx.Provider>;
}
export function useSettings(){return useContext(Ctx);}
export function toKg(units,v){return units==='kg'?v:v*0.45359237;}
