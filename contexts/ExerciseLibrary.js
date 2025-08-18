import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY='exercise_library_v1';
const Ctx=createContext(null);
function normStr(x){return String(x||'').trim();}
function normArr(a){return (Array.isArray(a)?a:[a]).filter(Boolean).map(normStr);}
export function ExerciseLibraryProvider({children}){
  const [list,setList]=useState([]);
  useEffect(()=>{(async()=>{
    const raw=await AsyncStorage.getItem(KEY);
    if(raw){setList(JSON.parse(raw));}
    else{
      const seed=[{name:'Bench Press',primary:['Chest','Front Deltoid'],secondary:['Triceps']}];
      setList(seed);
      await AsyncStorage.setItem(KEY,JSON.stringify(seed));
    }
  })()},[]);
  const save=async(arr)=>{setList(arr);await AsyncStorage.setItem(KEY,JSON.stringify(arr));};
  const addExercise=async(e)=>{
    const item={name:normStr(e.name),primary:normArr(e.primary),secondary:normArr(e.secondary||[])};
    const exists=list.find(x=>x.name.toLowerCase()===item.name.toLowerCase());
    const next=exists?list.map(x=>x.name.toLowerCase()===item.name.toLowerCase()?item:x):[...list,item];
    await save(next);
    return item;
  };
  const value=useMemo(()=>({list,addExercise,findByName:(name)=>list.find(x=>x.name.toLowerCase()===String(name||'').toLowerCase())}),[list]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useExerciseLibrary(){return useContext(Ctx);}
