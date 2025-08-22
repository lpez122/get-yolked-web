import React,{useEffect,useMemo,useState} from 'react';
import {View,Text,FlatList,TextInput,Pressable} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {theme} from '../constants/theme';
import ExerciseEditor from '../components/ExerciseEditor';

async function readJSON(k){try{const v=await AsyncStorage.getItem(k);return v?JSON.parse(v):null}catch(e){return null}}
async function writeJSON(k,v){await AsyncStorage.setItem(k,JSON.stringify(v))}
async function loadLibrary(){
  const v2=await readJSON('exercise_library_v2');
  if(Array.isArray(v2)) return v2;
  const gy=await readJSON('getYolkedData');
  if(gy&&Array.isArray(gy.exercises)) return gy.exercises;
  return [];
}

export default function ExercisesScreen(){
  const [all,setAll]=useState([]);
  const [q,setQ]=useState('');
  const [editorOpen,setEditorOpen]=useState(false);

  async function refresh(){setAll(await loadLibrary())}
  useEffect(()=>{refresh()},[]);

  const data=useMemo(()=>{
    const t=String(q||'').toLowerCase();
    return [...all].filter(x=>String(x.name||'').toLowerCase().includes(t)).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
  },[all,q]);

  async function saveNew(ex){
    const base=await loadLibrary();
    const next=[...base,ex];
    await writeJSON('exercise_library_v2',next);
    setEditorOpen(false);
    setAll(next);
  }

  return(
    <View style={{flex:1,backgroundColor:theme.bg,padding:16}}>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <Text style={{color:theme.text,fontSize:20,fontWeight:'800'}}>Exercises</Text>
        <Pressable onPress={()=>setEditorOpen(true)} style={{backgroundColor:theme.accent,paddingHorizontal:14,paddingVertical:10,borderRadius:12}}>
          <Text style={{color:'#fff',fontWeight:'800'}}>New</Text>
        </Pressable>
      </View>
      <TextInput value={q} onChangeText={setQ} placeholder="Search exercises" placeholderTextColor={theme.textDim} style={{borderWidth:1,borderColor:theme.border,borderRadius:10,paddingHorizontal:12,paddingVertical:10,color:theme.text,backgroundColor:theme.surface,marginBottom:10}}/>
      <FlatList
        data={data}
        keyExtractor={(item,i)=>String(item.id||item.name||i)}
        ItemSeparatorComponent={()=> <View style={{height:1,backgroundColor:theme.border}}/>}
        renderItem={({item})=>(
          <View style={{paddingVertical:10}}>
            <Text style={{color:theme.text,fontWeight:'700'}} numberOfLines={1}>{item.name||'Exercise'}</Text>
            <Text style={{color:theme.textDim,marginTop:4}} numberOfLines={1}>{[item.equipment,[...(item.primaryMuscles||[]),...(item.secondaryMuscles||[])].join(', ')].filter(Boolean).join(' • ')}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{color:theme.textDim}}>No exercises.</Text>}
      />
      <ExerciseEditor visible={editorOpen} onClose={()=>setEditorOpen(false)} onSaved={saveNew}/>
    </View>
  )
}
