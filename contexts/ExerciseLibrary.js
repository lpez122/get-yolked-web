import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY='exercise_library_v1';
const Ctx=createContext(null);
function normStr(x){return String(x||'').trim();}
function normArr(a){return (Array.isArray(a)?a:[a]).filter(Boolean).map(normStr);}

const SEED = [
  { name:'Bench Press', primary:['Chest','Front Deltoid'], secondary:['Triceps'] },
  { name:'Incline Bench Press', primary:['Chest','Front Deltoid'], secondary:['Triceps'] },
  { name:'Decline Bench Press', primary:['Chest'], secondary:['Triceps','Front Deltoid'] },
  { name:'Dumbbell Bench Press', primary:['Chest','Front Deltoid'], secondary:['Triceps'] },
  { name:'Close-Grip Bench Press', primary:['Triceps'], secondary:['Chest','Front Deltoid'] },
  { name:'Wide-Grip Bench Press', primary:['Chest'], secondary:['Front Deltoid','Triceps'] },
  { name:'Paused Bench Press', primary:['Chest'], secondary:['Front Deltoid','Triceps'] },
  { name:'Tempo Bench Press', primary:['Chest'], secondary:['Front Deltoid','Triceps'] },
  { name:'Spoto Press', primary:['Chest'], secondary:['Front Deltoid','Triceps'] },
  { name:'Feet-Up Bench Press', primary:['Chest','Front Deltoid'], secondary:['Triceps'] },
  { name:'Close-Grip Feet-Up Bench Press', primary:['Triceps'], secondary:['Chest','Front Deltoid'] },
  { name:'Floor Press', primary:['Chest','Triceps'], secondary:['Front Deltoid'] },
  { name:'Pin Bench Press', primary:['Chest','Front Deltoid'], secondary:['Triceps'] },
  { name:'Board Press', primary:['Chest','Front Deltoid'], secondary:['Triceps'] },
  { name:'Reverse-Grip Bench Press', primary:['Chest'], secondary:['Triceps','Front Deltoid'] },
  { name:'Bench Press Against Bands', primary:['Chest','Front Deltoid'], secondary:['Triceps'] },
  { name:'Band-Assisted Bench Press', primary:['Chest','Front Deltoid'], secondary:['Triceps'] },
  { name:'Smith Machine Bench Press', primary:['Chest'], secondary:['Front Deltoid','Triceps'] }
];

export function ExerciseLibraryProvider({children}){
  const [list,setList]=useState([]);

  useEffect(()=>{(async()=>{
    const raw=await AsyncStorage.getItem(KEY);
    if(raw){
      setList(JSON.parse(raw));
    }else{
      setList(SEED);
      await AsyncStorage.setItem(KEY,JSON.stringify(SEED));
    }
  })()},[]);

  const save=async(arr)=>{ setList(arr); await AsyncStorage.setItem(KEY,JSON.stringify(arr)); };

  const addExercise=async(e)=>{
    const item={ name:normStr(e.name), primary:normArr(e.primary), secondary:normArr(e.secondary||[]) };
    const exists=list.find(x=>x.name.toLowerCase()===item.name.toLowerCase());
    const next=exists?list.map(x=>x.name.toLowerCase()===item.name.toLowerCase()?item:x):[...list,item];
    await save(next);
    return item;
  };

  const value=useMemo(()=>({
    list,
    addExercise,
    findByName:(name)=>list.find(x=>x.name.toLowerCase()===String(name||'').toLowerCase())
  }),[list]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useExerciseLibrary(){return useContext(Ctx);}
