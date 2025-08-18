import React,{useMemo,useState} from 'react';
import {View,Text,ScrollView,Pressable} from 'react-native';
import {theme} from '../constants/theme';
import {useExerciseLibrary} from '../contexts/ExerciseLibrary';
import NewExerciseModal from '../components/NewExerciseModal';
export default function ExercisesScreen(){
  const {list}=useExerciseLibrary();
  const [showNew,setShowNew]=useState(false);
  const byPrimary=useMemo(()=>{
    const m={};
    for(const e of list){for(const p of e.primary||[]){if(!m[p])m[p]=[];m[p].push(e.name);}}
    return m;
  },[list]);
  const groups=Object.keys(byPrimary).sort();
  return(
    <View style={{flex:1,backgroundColor:theme.bg}}>
      <ScrollView contentContainerStyle={{padding:16,gap:16}}>
        <Pressable onPress={()=>setShowNew(true)} style={{padding:14,borderRadius:10,backgroundColor:theme.accent,alignItems:'center'}}>
          <Text style={{color:theme.text,fontWeight:'700'}}>+ New Exercise</Text>
        </Pressable>
        {groups.map(g=>(
          <View key={g} style={{backgroundColor:theme.card,borderRadius:12,padding:12}}>
            <Text style={{color:theme.text,fontWeight:'700',marginBottom:8}}>{g}</Text>
            {byPrimary[g].sort().map((name,i)=>(<Text key={i} style={{color:theme.muted,paddingVertical:4}}>{name}</Text>))}
          </View>
        ))}
        {groups.length===0?<Text style={{color:theme.muted}}>No exercises yet. Add one.</Text>:null}
      </ScrollView>
      <NewExerciseModal visible={showNew} onClose={()=>setShowNew(false)}/>
    </View>
  );
}
