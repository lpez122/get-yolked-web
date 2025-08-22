import React from 'react';
import {View,Text,Pressable} from 'react-native';

export default function NextProgramCard({title,subtitle,items=[],buttonLabel,onStart}){
  return (
    <View style={{backgroundColor:'#141414',borderRadius:12,padding:12}}>
      {title ? <Text style={{color:'white',fontSize:18,fontWeight:'700',marginBottom:4}}>{title}</Text> : null}
      {subtitle ? <Text style={{color:'#9AA0A6',marginBottom:10}}>{subtitle}</Text> : null}
      <View style={{flexDirection:'row',paddingHorizontal:4,marginBottom:6}}>
        <Text style={{color:'#9AA0A6',flex:1}}>Exercise</Text>
        <Text style={{color:'#9AA0A6',width:60,textAlign:'center'}}>Sets</Text>
        <Text style={{color:'#9AA0A6',width:80,textAlign:'right'}}>Top Set</Text>
      </View>
      {items.slice(0,4).map((it,idx)=>{
        const setCount = Array.isArray(it.sets) ? it.sets.length : (typeof it.sets==='number' ? it.sets : 0);
        const top = typeof it.topSet === 'string' ? it.topSet : (it.topReps ? `${it.topReps} reps` : '');
        return (
          <View key={idx} style={{flexDirection:'row',paddingVertical:8,borderTopWidth:idx===0?0:1,borderColor:'#1f2a37',alignItems:'center'}}>
            <Text style={{color:'white',flex:1}} numberOfLines={1}>{it.name}</Text>
            <Text style={{color:'white',width:60,textAlign:'center'}}>{setCount||'-'}</Text>
            <Text style={{color:'white',width:80,textAlign:'right'}}>{top||'-'}</Text>
          </View>
        );
      })}
      <Pressable onPress={onStart} style={{marginTop:12,backgroundColor:'#00B2FF',borderRadius:12,paddingVertical:14,alignItems:'center',justifyContent:'center'}}>
        <Text style={{color:'white',fontWeight:'700'}}>{buttonLabel||'Start Workout'}</Text>
      </Pressable>
    </View>
  );
}
