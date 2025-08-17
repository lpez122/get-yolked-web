import React,{useEffect,useState} from 'react';
import {View,Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg,{Polyline,Line,Circle} from 'react-native-svg';
export default function CaloriesChart(){
  const [pts,setPts]=useState([]);
  useEffect(()=>{(async()=>{try{const arr=JSON.parse(await AsyncStorage.getItem('calories_history_v1')||'[]'); const sorted=arr.slice(-14); setPts(sorted.map(x=>({t:new Date(x.date),v:x.calories||0})));}catch{}})();},[]);
  const W=320,H=160,pad=24; const ys=pts.map(p=>p.v); const ymax=Math.max(100,...ys,1);
  const toX=i=>pad+(W-2*pad)*(pts.length<=1?0.5:i/(pts.length-1));
  const toY=v=>H-pad-(H-2*pad)*(v/ymax);
  const points=pts.map((p,i)=>`${toX(i)},${toY(p.v)}`).join(' ');
  return (
    <View style={{backgroundColor:'#141414',borderRadius:16,padding:14}}>
      <Text style={{color:'white',fontWeight:'700',marginBottom:8}}>Calories per Session</Text>
      <Svg width={W} height={H}>
        <Line x1={pad} y1={H-pad} x2={W-pad} y2={H-pad} stroke="#444" strokeWidth="1"/>
        <Line x1={pad} y1={pad} x2={pad} y2={H-pad} stroke="#444" strokeWidth="1"/>
        {points?<Polyline points={points} fill="none" stroke="#6c5ce7" strokeWidth="2.5"/>:null}
        {pts.map((p,i)=><Circle key={i} cx={toX(i)} cy={toY(p.v)} r="3.5" fill="#6c5ce7"/>)}
      </Svg>
      <Text style={{color:'#aaa',marginTop:6}}>{pts.length} sessions · max {ymax} kcal</Text>
    </View>
  );
}
