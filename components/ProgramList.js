import React,{useEffect,useState} from 'react';
import {View,Text,FlatList,Pressable,Alert} from 'react-native';
import {theme} from '../constants/theme';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function loadSaved(){
  try{const r=await AsyncStorage.getItem('saved_programs_v1');return r?JSON.parse(r):[]}catch(e){return[]}
}
async function saveSaved(list){
  await AsyncStorage.setItem('saved_programs_v1',JSON.stringify(list||[]))
}
async function getPointer(){
  try{const r=await AsyncStorage.getItem('current_program_v1');return r?JSON.parse(r):null}catch(e){return null}
}
async function setPointer(programId,week=1,day=1){
  await AsyncStorage.setItem('current_program_v1',JSON.stringify({programId,week,day}));
  await AsyncStorage.removeItem('program_progress_v1');
}
async function clearPointer(){
  await AsyncStorage.removeItem('current_program_v1');
  await AsyncStorage.removeItem('program_progress_v1');
}

function demoProgram(){
  const id='demo_'+Date.now();
  return{
    id,
    name:'Demo Program',
    plan:{
      1:{
        1:[{id:'ex1',name:'Lying Side Lateral Raise',sets:[{lbs:'',reps:10},{lbs:'',reps:10},{lbs:'',reps:10}]},
           {id:'ex2',name:'Bicep Curl (Dumbbell)',sets:[{lbs:'',reps:12},{lbs:'',reps:12},{lbs:'',reps:12}]}],
        2:[{id:'ex3',name:'Bench Press',sets:[{lbs:'',reps:8},{lbs:'',reps:8},{lbs:'',reps:8}]}]
      }
    }
  }
}

export default function ProgramList(){
  const nav=useNavigation();
  const [programs,setPrograms]=useState([]);
  const [pointer,setPointer]=useState(null);

  async function refresh(){
    const list=await loadSaved();
    setPrograms(Array.isArray(list)?list:[]);
    const ptr=await getPointer();
    setPointer(ptr);
  }

  async function onStart(p){
    const w=1,d=1;
    await setPointer(p.id,w,d);
    await refresh();
    nav.navigate('Workout',{mode:'program',programId:p.id,week:w,day:d});
  }

  async function onStop(){
    await clearPointer();
    await refresh();
  }

  async function onAddDemo(){
    const list=await loadSaved();
    list.push(demoProgram());
    await saveSaved(list);
    await refresh();
    Alert.alert('Added','Demo Program saved');
  }

  async function onScan(){
    try{
      const keys=await AsyncStorage.getAllKeys();
      const entries=await AsyncStorage.multiGet(keys);
      console.log('ASYNC_KEYS',keys);
      console.log('ASYNC_ENTRIES',entries.map(([k,v])=>[k,(v||'').slice(0,200)]));
      Alert.alert('Storage',`Keys: ${keys.length}. Open console for details.`);
    }catch(e){
      Alert.alert('Scan error',String(e&&e.message||e));
    }
  }

  useEffect(()=>{refresh()},[]);

  return(
    <View style={{backgroundColor:theme.card,borderRadius:16,padding:16,marginTop:16}}>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <Text style={{color:theme.text,fontSize:17,fontWeight:'800'}}>Your Programs</Text>
        <View style={{flexDirection:'row',gap:8}}>
          <Pressable onPress={refresh} style={{backgroundColor:'#1B2733',paddingHorizontal:10,paddingVertical:8,borderRadius:10}}>
            <Text style={{color:theme.text,fontWeight:'700'}}>Refresh</Text>
          </Pressable>
          <Pressable onPress={onAddDemo} style={{backgroundColor:theme.accent,paddingHorizontal:10,paddingVertical:8,borderRadius:10}}>
            <Text style={{color:'#fff',fontWeight:'800'}}>Add Demo</Text>
          </Pressable>
          <Pressable onPress={onScan} style={{backgroundColor:'#0F1A26',paddingHorizontal:10,paddingVertical:8,borderRadius:10}}>
            <Text style={{color:theme.text,fontWeight:'700'}}>Scan</Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={programs}
        keyExtractor={item=>String(item.id||item.name)}
        ItemSeparatorComponent={()=> <View style={{height:1,backgroundColor:theme.border,marginVertical:8}}/>}
        renderItem={({item})=>{
          const active=pointer&&pointer.programId===item.id;
          return(
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
              <View style={{flex:1,marginRight:10}}>
                <Text style={{color:theme.text,fontWeight:'700'}} numberOfLines={1}>{item.name||'Program'}</Text>
                <Text style={{color:theme.textDim,marginTop:2}} numberOfLines={1}>{active?'Active':'Inactive'}</Text>
              </View>
              {active?(
                <Pressable onPress={onStop} style={{backgroundColor:'#1B2733',paddingHorizontal:14,paddingVertical:10,borderRadius:12}}>
                  <Text style={{color:theme.text,fontWeight:'700'}}>Stop</Text>
                </Pressable>
              ):(
                <Pressable onPress={()=>onStart(item)} style={{backgroundColor:theme.accent,paddingHorizontal:16,paddingVertical:10,borderRadius:12}}>
                  <Text style={{color:'#fff',fontWeight:'800'}}>Start</Text>
                </Pressable>
              )}
            </View>
          )
        }}
        ListEmptyComponent={<Text style={{color:theme.textDim}}>No saved programs yet.</Text>}
      />
    </View>
  )
}
