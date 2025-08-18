import React,{useState} from 'react';
import {Modal,View,Text,TextInput,Pressable} from 'react-native';
import {theme} from '../constants/theme';
import {useExerciseLibrary} from '../contexts/ExerciseLibrary';
export default function NewExerciseModal({visible,onClose,onCreated}){
  const {addExercise}=useExerciseLibrary();
  const [name,setName]=useState('');
  const [primary,setPrimary]=useState('');
  const [secondary,setSecondary]=useState('');
  const save=async()=>{
    if(!name.trim())return;
    const created=await addExercise({name,primary:primary.split(',').map(s=>s.trim()).filter(Boolean),secondary:secondary.split(',').map(s=>s.trim()).filter(Boolean)});
    setName('');setPrimary('');setSecondary('');
    onCreated&&onCreated(created);
    onClose&&onClose();
  };
  return(
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <View style={{flex:1,backgroundColor:theme.bg,padding:16}}>
        <Text style={{color:theme.text,fontSize:18,fontWeight:'700'}}>New Exercise</Text>
        <View style={{height:12}}/>
        <TextInput placeholder="Name" placeholderTextColor={theme.muted} value={name} onChangeText={setName} style={{backgroundColor:theme.card,color:theme.text,padding:10,borderRadius:8}}/>
        <View style={{height:8}}/>
        <TextInput placeholder="Primary muscles (comma-separated)" placeholderTextColor={theme.muted} value={primary} onChangeText={setPrimary} style={{backgroundColor:theme.card,color:theme.text,padding:10,borderRadius:8}}/>
        <View style={{height:8}}/>
        <TextInput placeholder="Secondary muscles (optional, comma-separated)" placeholderTextColor={theme.muted} value={secondary} onChangeText={setSecondary} style={{backgroundColor:theme.card,color:theme.text,padding:10,borderRadius:8}}/>
        <View style={{flex:1}}/>
        <View style={{flexDirection:'row',gap:12}}>
          <Pressable onPress={onClose} style={{flex:1,padding:14,borderRadius:10,backgroundColor:theme.surface,alignItems:'center'}}><Text style={{color:theme.text}}>Cancel</Text></Pressable>
          <Pressable onPress={save} style={{flex:1,padding:14,borderRadius:10,backgroundColor:theme.accent,alignItems:'center'}}><Text style={{color:theme.text,fontWeight:'700'}}>Save</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}
