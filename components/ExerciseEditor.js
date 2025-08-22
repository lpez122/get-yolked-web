import React,{useEffect,useMemo,useState} from 'react';
import {Modal,View,Text,TextInput,Pressable,ScrollView,Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {theme} from '../constants/theme';

async function readJSON(k){try{const v=await AsyncStorage.getItem(k);return v?JSON.parse(v):null}catch(e){return null}}
async function writeJSON(k,v){await AsyncStorage.setItem(k,JSON.stringify(v))}

async function loadLibrary(){
  try{const v2=await AsyncStorage.getItem('exercise_library_v2');if(v2){const arr=JSON.parse(v2||'[]');return Array.isArray(arr)?arr:[]}}catch(e){}
  try{const gy=await AsyncStorage.getItem('getYolkedData');if(gy){const obj=JSON.parse(gy||'{}');return Array.isArray(obj.exercises)?obj.exercises:[]}}catch(e){}
  return [];
}
function musclesOf(x){const a=[].concat(x.primaryMuscles||[],x.secondaryMuscles||[],x.muscleGroups||[]).filter(Boolean);const s=new Set();const out=[];for(const m of a){const v=String(m).trim();if(v&&!s.has(v.toLowerCase())){s.add(v.toLowerCase());out.push(v)}}return out}
function uniqSorted(arr){const s=new Set();for(const x of arr){const v=String(x||'').trim();if(v)s.add(v)}return Array.from(s).sort((a,b)=>a.localeCompare(b))}
function Chip({label,active,onPress,deletable,onDelete}){
  return(
    <Pressable onPress={onPress} style={{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:12,paddingVertical:8,borderRadius:999,marginRight:8,marginBottom:8,backgroundColor:active?theme.accent:'#0F1A26',borderWidth:1,borderColor:active?theme.accent:theme.border}}>
      <Text style={{color:active?'#fff':theme.text,fontWeight:'700'}}>{label}</Text>
      {deletable?
        <Pressable onPress={onDelete} style={{width:18,height:18,borderRadius:9,alignItems:'center',justifyContent:'center',backgroundColor:active?'#244':'#233'}}>
          <Text style={{color:'#fff',fontSize:12}}>×</Text>
        </Pressable>:null}
    </Pressable>
  )
}

export default function ExerciseEditor({visible,onClose,onSaved}){
  const [name,setName]=useState('');
  const [equip,setEquip]=useState('');
  const [muscles,setMuscles]=useState([]);
  const [lastMuscle,setLastMuscle]=useState('');

  const [baseEquip,setBaseEquip]=useState([]);
  const [baseMuscle,setBaseMuscle]=useState([]);
  const [customEquip,setCustomEquip]=useState([]);
  const [customMuscle,setCustomMuscle]=useState([]);

  const equipTags=useMemo(()=>uniqSorted([...baseEquip,...customEquip]),[baseEquip,customEquip]);
  const muscleTags=useMemo(()=>uniqSorted([...baseMuscle,...customMuscle]),[baseMuscle,customMuscle]);

  const [newEquip,setNewEquip]=useState('');
  const [newMuscle,setNewMuscle]=useState('');

  useEffect(()=>{if(visible){(async()=>{
    const lib=await loadLibrary();
    const eq=uniqSorted(lib.map(x=>x.equipment).filter(Boolean));
    const ms=uniqSorted(lib.flatMap(musclesOf));
    setBaseEquip(eq);setBaseMuscle(ms);
    const ce=await readJSON('custom_equipment_tags_v1')||[];
    const cm=await readJSON('custom_muscle_tags_v1')||[];
    setCustomEquip(uniqSorted(ce));setCustomMuscle(uniqSorted(cm));
    setName('');setEquip('');setMuscles([]);setNewEquip('');setNewMuscle('');setLastMuscle('');
  })()}},[visible]);

  const canSave=name.trim().length>0 && equip && muscles.length>0;

  function toggleMuscle(tag){
    setMuscles(prev=>prev.includes(tag)?prev.filter(x=>x!==tag):[...prev,tag]);
    setLastMuscle(tag);
  }

  async function addEquipTag(){
    const t=String(newEquip||'').trim();if(!t)return;
    const next=uniqSorted([...customEquip,t]);setCustomEquip(next);
    await writeJSON('custom_equipment_tags_v1',next);
    setEquip(t);setNewEquip('');
  }
  async function addMuscleTag(){
    const t=String(newMuscle||'').trim();if(!t)return;
    const next=uniqSorted([...customMuscle,t]);setCustomMuscle(next);
    await writeJSON('custom_muscle_tags_v1',next);
    setMuscles(m=>m.includes(t)?m:[...m,t]);setLastMuscle(t);setNewMuscle('');
  }

  async function deleteSelectedEquip(){
    if(!equip){Alert.alert('Select equipment to delete');return}
    if(baseEquip.includes(equip)){Alert.alert('Cannot delete built-in tag');return}
    const next=customEquip.filter(x=>x!==equip);setCustomEquip(next);
    await writeJSON('custom_equipment_tags_v1',next);
    setEquip('');
  }
  async function deleteSelectedMuscle(){
    const target=lastMuscle||newMuscle.trim();
    if(!target){Alert.alert('Select a muscle to delete');return}
    if(baseMuscle.includes(target)){Alert.alert('Cannot delete built-in tag');return}
    const next=customMuscle.filter(x=>x!==target);setCustomMuscle(next);
    await writeJSON('custom_muscle_tags_v1',next);
    setMuscles(m=>m.filter(x=>x!==target));
    if(lastMuscle===target) setLastMuscle('');
    setNewMuscle('');
  }

  function save(){
    if(!canSave) return;
    const ex={id:`user_${Date.now()}`,name:name.trim(),equipment:equip,primaryMuscles:[...muscles],secondaryMuscles:[]};
    onSaved&&onSaved(ex);
  }

  return(
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{flex:1,backgroundColor:'#0009',alignItems:'center',justifyContent:'center'}}>
        <View style={{width:'94%',maxHeight:'92%',backgroundColor:theme.card,borderRadius:16,padding:14}}>
          <Text style={{color:theme.text,fontWeight:'800',fontSize:22,marginBottom:10}}>New Exercise</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={theme.textDim} style={{borderWidth:1,borderColor:theme.border,borderRadius:12,paddingHorizontal:12,paddingVertical:12,color:theme.text,backgroundColor:theme.surface,marginBottom:12}}/>
          <ScrollView style={{maxHeight:320,marginBottom:12}}>
            <Text style={{color:theme.textDim,marginBottom:8,fontWeight:'700'}}>Equipment</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',marginBottom:8}}>
              {equipTags.map(e=>
                <Chip key={e} label={e} active={equip===e} onPress={()=>{setEquip(e)}} deletable={!baseEquip.includes(e)} onDelete={async()=>{if(baseEquip.includes(e)){Alert.alert('Cannot delete built-in tag');return}const nx=customEquip.filter(x=>x!==e);setCustomEquip(nx);await writeJSON('custom_equipment_tags_v1',nx);if(equip===e) setEquip('')}}/>
              )}
            </View>
            <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
              <TextInput value={newEquip} onChangeText={setNewEquip} placeholder="Add equipment" placeholderTextColor={theme.textDim} style={{flex:1,borderWidth:1,borderColor:theme.border,borderRadius:12,paddingHorizontal:12,paddingVertical:10,color:theme.text,backgroundColor:theme.surface}}/>
              <Pressable onPress={addEquipTag} style={{backgroundColor:theme.accent,paddingHorizontal:16,paddingVertical:12,borderRadius:12,alignItems:'center',justifyContent:'center'}}><Text style={{color:'#fff',fontWeight:'800'}}>Add</Text></Pressable>
              <Pressable onPress={deleteSelectedEquip} style={{backgroundColor:'#2B1A1A',paddingHorizontal:16,paddingVertical:12,borderRadius:12,alignItems:'center',justifyContent:'center'}}><Text style={{color:'#ffb3b3',fontWeight:'800'}}>Delete</Text></Pressable>
            </View>
            <Text style={{color:theme.textDim,marginBottom:8,fontWeight:'700'}}>Muscles</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',marginBottom:8}}>
              {muscleTags.map(m=>
                <Chip key={m} label={m} active={muscles.includes(m)} onPress={()=>toggleMuscle(m)} deletable={!baseMuscle.includes(m)} onDelete={async()=>{if(baseMuscle.includes(m)){Alert.alert('Cannot delete built-in tag');return}const nx=customMuscle.filter(x=>x!==m);setCustomMuscle(nx);await writeJSON('custom_muscle_tags_v1',nx);setMuscles(prev=>prev.filter(x=>x!==m));if(lastMuscle===m) setLastMuscle('')}}/>
              )}
            </View>
            <View style={{flexDirection:'row',gap:8}}>
              <TextInput value={newMuscle} onChangeText={setNewMuscle} placeholder="Add muscle" placeholderTextColor={theme.textDim} style={{flex:1,borderWidth:1,borderColor:theme.border,borderRadius:12,paddingHorizontal:12,paddingVertical:10,color:theme.text,backgroundColor:theme.surface}}/>
              <Pressable onPress={addMuscleTag} style={{backgroundColor:theme.accent,paddingHorizontal:16,paddingVertical:12,borderRadius:12,alignItems:'center',justifyContent:'center'}}><Text style={{color:'#fff',fontWeight:'800'}}>Add</Text></Pressable>
              <Pressable onPress={deleteSelectedMuscle} style={{backgroundColor:'#2B1A1A',paddingHorizontal:16,paddingVertical:12,borderRadius:12,alignItems:'center',justifyContent:'center'}}><Text style={{color:'#ffb3b3',fontWeight:'800'}}>Delete</Text></Pressable>
            </View>
          </ScrollView>
          <View style={{flexDirection:'row',justifyContent:'flex-end',gap:10}}>
            <Pressable onPress={onClose} style={{backgroundColor:'#1B2733',paddingHorizontal:20,paddingVertical:12,borderRadius:12}}>
              <Text style={{color:theme.text,fontWeight:'700'}}>Cancel</Text>
            </Pressable>
            <Pressable onPress={save} disabled={!canSave} style={{backgroundColor:canSave?theme.accent:'#234',paddingHorizontal:24,paddingVertical:12,borderRadius:12,opacity:canSave?1:0.6}}>
              <Text style={{color:'#fff',fontWeight:'800'}}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}
