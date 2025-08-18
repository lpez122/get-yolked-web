import React,{useEffect,useMemo,useState} from 'react';
import {View,Text,ScrollView,Pressable,TextInput,Modal,FlatList} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {theme} from '../constants/theme';
import * as P from '../contexts/ProgramStore';

const DAYNAMES=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function ProgramsScreen(){
  const [templates,setTemplates]=useState([]);
  const [assign,setAssign]=useState({});
  const [weeks,setWeeks]=useState('4');
  const [pickerDay,setPickerDay]=useState(null);

  useEffect(()=>{(async()=>{
    const list=JSON.parse(await AsyncStorage.getItem('day_templates_v1')||'[]');
    setTemplates(list);
  })()},[]);

  const selectedNames=useMemo(()=>{
    const m={};
    for(const k of Object.keys(assign)){
      const t=templates.find(x=>x.id===assign[k]);
      m[k]=t?t.name:'—';
    }
    return m;
  },[assign,templates]);

  const start=async()=>{
    const filtered={};
    for(const [k,v] of Object.entries(assign)){ if(v) filtered[k]=v; }
    if(Object.keys(filtered).length===0) return;
    await P.setActive({ name:'Custom Program', weeks:Number(weeks||4), dayTemplates:filtered, days:7 });
  };

  return(
    <View style={{flex:1,backgroundColor:theme.bg}}>
      <ScrollView contentContainerStyle={{padding:16,gap:16}}>
        <View style={{backgroundColor:theme.card,borderRadius:12,padding:12}}>
          <Text style={{color:theme.text,fontWeight:'700',marginBottom:8}}>Weekly Schedule</Text>
          <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12}}>
            <Text style={{color:theme.muted}}>Weeks</Text>
            <TextInput value={weeks} onChangeText={setWeeks} keyboardType="numeric" style={{width:60,backgroundColor:theme.surface,color:theme.text,padding:8,borderRadius:8,textAlign:'center'}}/>
          </View>
          {DAYNAMES.map((d,idx)=>(
            <Pressable key={d} onPress={()=>setPickerDay(idx+1)} style={{paddingVertical:10,borderBottomWidth:1,borderColor:theme.border}}>
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                <Text style={{color:theme.text}}>{d}</Text>
                <Text style={{color:theme.muted}}>{selectedNames[String(idx+1)]||'—'}</Text>
              </View>
            </Pressable>
          ))}
          <View style={{height:12}}/>
          <Pressable onPress={start} style={{padding:12,borderRadius:10,backgroundColor:theme.accent,alignItems:'center'}}>
            <Text style={{color:theme.text,fontWeight:'700'}}>Start Program</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={pickerDay!=null} transparent animationType="fade" onRequestClose={()=>setPickerDay(null)}>
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',padding:16}}>
          <View style={{backgroundColor:theme.card,borderRadius:12,maxHeight:'70%'}}>
            <Text style={{color:theme.text,fontWeight:'700',padding:12}}>Select Template</Text>
            <FlatList
              data={templates}
              keyExtractor={(x)=>x.id}
              renderItem={({item})=>(
                <Pressable onPress={()=>{ setAssign(prev=>({...prev,[String(pickerDay)]:item.id})); setPickerDay(null); }} style={{padding:12,borderBottomWidth:1,borderColor:theme.border}}>
                  <Text style={{color:theme.text}}>{item.name}</Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={{color:theme.muted,padding:12}}>No templates yet. Finish a workout and save it as a template.</Text>}
            />
            <Pressable onPress={()=>setPickerDay(null)} style={{padding:12,alignItems:'center'}}>
              <Text style={{color:theme.muted}}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
