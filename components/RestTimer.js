import React,{useEffect,useRef,useState} from 'react';
import {View,Text,Pressable} from 'react-native';

export default function RestTimer({initial=90}) {
  const [sec,setSec]=useState(initial);
  const [running,setRunning]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{
    if(!running) return;
    ref.current=setInterval(()=>setSec(s=>Math.max(0,s-1)),1000);
    return ()=>clearInterval(ref.current);
  },[running]);
  const mm = String(Math.floor(sec/60)).padStart(2,'0');
  const ss = String(sec%60).padStart(2,'0');
  return (
    <View style={{flexDirection:'row',gap:8,alignItems:'center'}}>
      <Text style={{color:'white'}}>⏱ {mm}:{ss}</Text>
      <Pressable onPress={()=>setRunning(r=>!r)} style={{padding:6,backgroundColor:'#333',borderRadius:8}}>
        <Text style={{color:'white'}}>{running?'Pause':'Start'}</Text>
      </Pressable>
      <Pressable onPress={()=>setSec(initial)} style={{padding:6,backgroundColor:'#222',borderRadius:8}}>
        <Text style={{color:'white'}}>Reset</Text>
      </Pressable>
    </View>
  );
}
