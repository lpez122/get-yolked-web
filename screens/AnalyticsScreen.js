import React,{useEffect,useMemo,useState} from 'react';
import {View,Text,ScrollView} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {theme} from '../constants/theme';
import {useExerciseLibrary} from '../contexts/ExerciseLibrary';

async function loadHistory(){return JSON.parse(await AsyncStorage.getItem('workouts_history_v1')||'[]');}
function bucketCounts(history,libMap,days){
  const cutoff=Date.now()-days*86400000;
  const counts={};
  for(const s of history){
    const t=new Date(s.dateISO||s.endAt||s.startAt).getTime();
    if(isNaN(t)||t<cutoff)continue;
    for(const ex of s.exercises||[]){
      const meta=libMap.get(String(ex.name||'').toLowerCase());
      const prim=meta?meta.primary:[];
      for(const set of ex.sets||[]){
        if(!set.done)continue;
        for(const m of prim){counts[m]=(counts[m]||0)+1;}
      }
    }
  }
  return counts;
}

export default function AnalyticsScreen(){
  const {list}=useExerciseLibrary();
  const [history,setHistory]=useState([]);
  useEffect(()=>{(async()=>{setHistory(await loadHistory());})()},[]);
  const libMap=useMemo(()=>{
    const m=new Map();
    for(const e of list)m.set(e.name.toLowerCase(),{primary:e.primary||[],secondary:e.secondary||[]});
    return m;
  },[list]);
  const w=useMemo(()=>bucketCounts(history,libMap,7),[history,libMap]);
  const mo=useMemo(()=>bucketCounts(history,libMap,30),[history,libMap]);
  const y=useMemo(()=>bucketCounts(history,libMap,365),[history,libMap]);
  const keys=Array.from(new Set([...Object.keys(w),...Object.keys(mo),...Object.keys(y)])).sort();
  return(
    <View style={{flex:1,backgroundColor:theme.bg}}>
      <ScrollView contentContainerStyle={{padding:16,gap:16}}>
        <View style={{backgroundColor:theme.card,borderRadius:12,padding:12}}>
          <Text style={{color:theme.text,fontWeight:'700',marginBottom:8}}>Sets per Muscle Group</Text>
          {keys.length===0?<Text style={{color:theme.muted}}>No completed sets logged yet.</Text>:null}
          {keys.map(k=>(
            <View key={k} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:6,borderBottomWidth:1,borderColor:theme.border}}>
              <Text style={{color:theme.text}}>{k}</Text>
              <Text style={{color:theme.muted}}>7d {w[k]||0} • 30d {mo[k]||0} • 365d {y[k]||0}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
