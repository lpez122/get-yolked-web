import React from 'react';
import {View,Text} from 'react-native';
import EggButton from './EggButton';
export default function NextProgramCard({programName,week,day,items,onStart}){
  return (
    <View style={{backgroundColor:'#141414',borderRadius:16,padding:14}}>
      <Text style={{color:'white',fontSize:18,fontWeight:'700',marginBottom:8}}>Continue Program</Text>
      <View style={{backgroundColor:'#0f0f0f',borderRadius:12,padding:12}}>
        <Text style={{color:'white',fontWeight:'700'}}>{programName||'No Program Selected'}</Text>
        <Text style={{color:'#aaa',marginTop:2}}>Week {week??1} · Day {day??1}</Text>
        <View style={{height:10}}/>
        <View>
          <View style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:6}}>
            <Text style={{color:'#aaa'}}>Exercise</Text><Text style={{color:'#aaa'}}>Sets</Text>
          </View>
          {(items||[]).slice(0,4).map((it,i)=>(<View key={i} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:6}}>
            <Text style={{color:'white'}} numberOfLines={1}>{it.name}</Text><Text style={{color:'white'}}>{it.sets??'-'}</Text>
          </View>))}
        </View>
        <View style={{height:12}}/>
        <EggButton size={44} label={`Start Week ${week??1} · Day ${day??1}`} onCrack={onStart}/>
      </View>
    </View>
  );
}
