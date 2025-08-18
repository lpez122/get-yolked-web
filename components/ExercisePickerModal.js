import React,{useMemo,useState} from 'react';
import {Modal,View,Text,TextInput,Pressable,ScrollView} from 'react-native';
import {theme} from '../constants/theme';
import {useExerciseLibrary} from '../contexts/ExerciseLibrary';
import NewExerciseModal from './NewExerciseModal';
export default function ExercisePickerModal({visible,onClose,onPick}){
  const {list}=useExerciseLibrary();
  const [q,setQ]=useState('');
  const [showNew,setShowNew]=useState(false);
  const listNames=useMemo(()=>list.map(e=>e.name),[list]);
  const filtered=useMemo(()=>listNames.filter(n=>n.toLowerCase().includes(q.toLowerCase())).slice(0,300),[listNames,q]);
  return(
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <View style={{flex:1,backgroundColor:theme.bg}}>
        <View style={{padding:16}}>
          <Text style={{color:theme.text,fontSize:18,fontWeight:'700'}}>Select Exercise</Text>
          <TextInput placeholder="Search" placeholderTextColor={theme.muted} value={q} onChangeText={setQ} style={{marginTop:12,backgroundColor:theme.card,color:theme.text,padding:10,borderRadius:8}}/>
        </View>
        <ScrollView contentContainerStyle={{paddingHorizontal:16,paddingBottom:24}}>
          <Pressable onPress={()=>setShowNew(true)} style={{padding:12,borderRadius:8,backgroundColor:theme.surface,marginBottom:8,alignItems:'center'}}>
            <Text style={{color:theme.accent,fontWeight:'700'}}>+ New Exercise</Text>
          </Pressable>
          {filtered.map((name,i)=>(
            <Pressable key={i} onPress={()=>{onPick&&onPick(name);onClose&&onClose();}} style={{padding:12,borderBottomWidth:1,borderColor:theme.border}}>
              <Text style={{color:theme.text}}>{name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={{padding:16}}>
          <Pressable onPress={onClose} style={{padding:14,borderRadius:10,backgroundColor:theme.surface,alignItems:'center'}}>
            <Text style={{color:theme.text}}>Close</Text>
          </Pressable>
        </View>
        <NewExerciseModal visible={showNew} onClose={()=>setShowNew(false)} onCreated={(e)=>{setQ(e.name);}}/>
      </View>
    </Modal>
  );
}
