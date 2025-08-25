import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { getActive, getSavedPrograms, stopActive } from '../utils/programState';

async function setPointer(next){
  const key='active_program_v1';
  const raw=await AsyncStorage.getItem(key);
  const cur=raw?JSON.parse(raw):null;
  if(!cur) return null;
  const upd={...cur,currentWeek:next.week,currentDay:next.day};
  await AsyncStorage.setItem(key,JSON.stringify(upd));
  return upd;
}

export default function HomeProgramCard({ rightElement, ...props }){
  const nav=useNavigation();
  const focused=useIsFocused();
  const [active,setActive]=useState(null);
  const [preview,setPreview]=useState([]);

  const load=useCallback(async()=>{
    const a=await getActive();
    setActive(a||null);
    if(!a){setPreview([]);return}
    const all=await getSavedPrograms();
    const prog=all.find(x=>String(x.id)===String(a.id));
    const day=((prog?.plan||{})[String(a.currentWeek||1)]||{})[String(a.currentDay||1)]||[];
    setPreview(day.slice(0,3));
  },[]);
  useEffect(()=>{load()},[focused,load]);

  if(!active) return null;

  function start(){
    const a=active||{};
    const w=Number(a.currentWeek||1);
    const d=Number(a.currentDay||1);
    nav.navigate('Workout',{
      mode:'program',
      programId:a.id,
      programName:a.name,
      week:w,
      day:d
    });
  }

  async function stop(){
    await stopActive();
    setActive(null);
    setPreview([]);
  }

  async function step(dir){
    const weeks=Number(active?.weeks||1);
    const days=Number(active?.days||1);
    let w=Number(active?.currentWeek||1);
    let d=Number(active?.currentDay||1);
    d+=dir;
    if(d<1){ if(w>1){w--; d=days;} else d=1; }
    if(d>days){ if(w<weeks){w++; d=1;} else d=days; }
    const upd=await setPointer({week:w,day:d});
    setActive(upd);
    await load();
  }

  return(
    <View style={{backgroundColor:theme.card,borderRadius:16,padding:16,marginBottom:16}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
        <Text style={{color:theme.text,fontSize:18,fontWeight:'800'}} numberOfLines={1}>
          {active.name||'Program'} • Week {active.currentWeek||1} Day {active.currentDay||1}
        </Text>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          {rightElement ? rightElement : null}
        </View>
      </View>

      <View style={{marginTop:10}}>
        {preview.map((item,i)=>(
          <View key={String(item?.name||i)} style={{paddingVertical:8,borderBottomWidth:i<preview.length-1?1:0,borderBottomColor:theme.border,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
            <Text style={{color:theme.text,flex:1,marginRight:8}} numberOfLines={1}>{item?.name||'Exercise'}</Text>
            <Text style={{color:theme.textDim}}>
              {Array.isArray(item?.sets)?item.sets.length:(item?.targetSets||0)} sets
            </Text>
          </View>
        ))}
      </View>

      <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12}}>
        <Pressable onPress={()=>step(-1)} style={{paddingHorizontal:14,paddingVertical:10,backgroundColor:'#1B2733',borderRadius:12}}>
          <Text style={{color:theme.text,fontWeight:'700'}}>◀ Prev</Text>
        </Pressable>
        <Pressable onPress={()=>step(1)} style={{paddingHorizontal:14,paddingVertical:10,backgroundColor:'#1B2733',borderRadius:12}}>
          <Text style={{color:theme.text,fontWeight:'700'}}>Next ▶</Text>
        </Pressable>
        <Pressable onPress={stop} style={{paddingHorizontal:14,paddingVertical:10,backgroundColor:'#273241',borderRadius:12}}>
          <Text style={{color:'#fff',fontWeight:'700'}}>Stop</Text>
        </Pressable>
        <Pressable onPress={start} style={{paddingHorizontal:16,paddingVertical:10,backgroundColor:theme.accent,borderRadius:12}}>
          <Text style={{color:'#fff',fontWeight:'800'}}>Start</Text>
        </Pressable>
      </View>
    </View>
  );
}
