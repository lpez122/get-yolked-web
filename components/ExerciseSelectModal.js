import React,{useMemo,useState} from 'react';
import {Modal,View,Text,Pressable,TextInput,ScrollView} from 'react-native';
import {theme} from '../constants/theme';
import {useExerciseLibrary} from '../contexts/ExerciseLibrary';
function uniq(a){return Array.from(new Set(a));}
export default function ExerciseSelectModal({visible,onClose,onDone}){
  const {list}=useExerciseLibrary();
  const [q,setQ]=useState('');
  const muscles=useMemo(()=>uniq(list.flatMap(e=>e.muscleGroups||e.primaryMuscles||[])).sort(),[list]);
  const equipment=useMemo(()=>uniq(list.map(e=>e.equipment||'').filter(Boolean)).sort(),[list]);
  const [selMuscles,setSelMuscles]=useState([]);
  const [selEquip,setSelEquip]=useState([]);
  const [chosen,setChosen]=useState(new Set());
  const filtered=useMemo(()=>{
    const s=q.trim().toLowerCase();
    return list.filter(e=>{
      if(s && !(e.name.toLowerCase().includes(s) || (e.primaryMuscles||[]).some(m=>m.toLowerCase().includes(s)) || (e.muscleGroups||[]).some(m=>m.toLowerCase().includes(s)))) return false;
      if(selMuscles.length && !selMuscles.every(m=>(e.muscleGroups||e.primaryMuscles||[]).includes(m))) return false;
      if(selEquip.length && !selEquip.includes(e.equipment||'')) return false;
      return true;
    }).slice(0,500);
  },[list,q,selMuscles,selEquip]);
  const toggle=(name)=>{
    const n=new Set(chosen);
    if(n.has(name)) n.delete(name); else n.add(name);
    setChosen(n);
  };
  const done=()=>{onDone&&onDone(Array.from(chosen));onClose&&onClose();};
  const chip=(label,active,onPress)=>(<Pressable key={label} onPress={onPress} style={{paddingVertical:6,paddingHorizontal:10,borderRadius:14,backgroundColor:active?theme.accent:theme.surface,marginRight:8,marginBottom:8}}><Text style={{color:theme.text}}>{label}</Text></Pressable>);
  return(
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <View style={{flex:1,backgroundColor:theme.bg}}>
        <View style={{padding:16}}>
          <Text style={{color:theme.text,fontSize:18,fontWeight:'700'}}>Add Exercises</Text>
          <TextInput placeholder="Search" placeholderTextColor={theme.muted} value={q} onChangeText={setQ} style={{marginTop:10,backgroundColor:theme.card,color:theme.text,padding:10,borderRadius:8}}/>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:10}}>
            <View style={{flexDirection:'row',flexWrap:'nowrap'}}>
              {muscles.map(m=>(<Pressable key={m} onPress={()=>setSelMuscles(x=>x.includes(m)?x.filter(y=>y!==m):[...x,m])} style={{paddingVertical:6,paddingHorizontal:10,borderRadius:14,backgroundColor:selMuscles.includes(m)?theme.accent:theme.surface,marginRight:8,marginBottom:8}}><Text style={{color:theme.text}}>{m}</Text></Pressable>))}
            </View>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:8}}>
            <View style={{flexDirection:'row',flexWrap:'nowrap'}}>
              {equipment.map(eq=>(<Pressable key={eq} onPress={()=>setSelEquip(x=>x.includes(eq)?x.filter(y=>y!==eq):[...x,eq])} style={{paddingVertical:6,paddingHorizontal:10,borderRadius:14,backgroundColor:selEquip.includes(eq)?theme.accent:theme.surface,marginRight:8,marginBottom:8}}><Text style={{color:theme.text}}>{eq}</Text></Pressable>))}
            </View>
          </ScrollView>
        </View>
        <ScrollView contentContainerStyle={{paddingHorizontal:16,paddingBottom:90}}>
          {filtered.map(e=>(
            <Pressable key={e.name} onPress={()=>toggle(e.name)} style={{paddingVertical:10,borderBottomWidth:1,borderColor:theme.border,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
              <Text style={{color:theme.text}}>{e.name}</Text>
              <Text style={{color:new Set(chosen).has(e.name)?theme.accent:theme.muted}}>{new Set(chosen).has(e.name)?'✓':''}</Text>
            </Pressable>
          ))}
          {filtered.length===0?<Text style={{color:theme.muted,marginTop:10}}>No matches.</Text>:null}
        </ScrollView>
        <View style={{position:'absolute',left:0,right:0,bottom:0,padding:16,backgroundColor:theme.bg}}>
          <View style={{flexDirection:'row',gap:12}}>
            <Pressable onPress={onClose} style={{flex:1,padding:14,borderRadius:10,backgroundColor:theme.surface,alignItems:'center'}}><Text style={{color:theme.text}}>Cancel</Text></Pressable>
            <Pressable onPress={done} style={{flex:1,padding:14,borderRadius:10,backgroundColor:theme.accent,alignItems:'center'}}><Text style={{color:theme.text,fontWeight:'700'}}>Add</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
