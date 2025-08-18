import React,{useState} from 'react';
import {Modal,View,Text,TextInput,Pressable} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {theme} from '../constants/theme';

export default function SaveTemplateModal({visible,onClose,exercises,onSaved}){
  const [name,setName]=useState('');
  const save=async()=>{
    if(!name.trim())return;
    const key='day_templates_v1';
    const prev=JSON.parse(await AsyncStorage.getItem(key)||'[]');
    const tpl={id:String(Date.now()),name,exercises};
    prev.push(tpl);
    await AsyncStorage.setItem(key,JSON.stringify(prev));
    onSaved&&onSaved(tpl);
    onClose&&onClose();
  };
  return(
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <View style={{flex:1,backgroundColor:theme.bg,padding:16}}>
        <Text style={{color:theme.text,fontSize:18,fontWeight:'700'}}>Save as Template</Text>
        <View style={{height:12}}/>
        <TextInput placeholder="Template name" placeholderTextColor={theme.muted} value={name} onChangeText={setName} style={{backgroundColor:theme.card,color:theme.text,padding:10,borderRadius:8}}/>
        <View style={{flex:1}}/>
        <View style={{flexDirection:'row',gap:12}}>
          <Pressable onPress={onClose} style={{flex:1,padding:14,borderRadius:10,backgroundColor:theme.surface,alignItems:'center'}}><Text style={{color:theme.text}}>Cancel</Text></Pressable>
          <Pressable onPress={save} style={{flex:1,padding:14,borderRadius:10,backgroundColor:theme.accent,alignItems:'center'}}><Text style={{color:theme.text,fontWeight:'700'}}>Save</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}
