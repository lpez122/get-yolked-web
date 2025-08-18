import React,{useState} from 'react';
import {Modal,View,Text,TextInput,Pressable} from 'react-native';
import {theme} from '../constants/theme';
export default function ExerciseOptionsModal({visible,onClose,exerciseName,restSec,onChangeRestSec,onSwap}){
  const [localRest,setLocalRest]=useState(restSec??90);
  const save=()=>{onChangeRestSec&&onChangeRestSec(localRest);onClose&&onClose();};
  const preset=v=>setLocalRest(v);
  return(
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <View style={{flex:1,backgroundColor:theme.bg,padding:16}}>
        <Text style={{color:theme.text,fontSize:18,fontWeight:'700'}}>{exerciseName||'Exercise'}</Text>
        <View style={{height:12}}/>
        <Text style={{color:theme.muted}}>Rest seconds</Text>
        <View style={{flexDirection:'row',gap:8,marginVertical:8}}>
          <Pressable onPress={()=>preset(30)} style={{padding:10,borderRadius:8,backgroundColor:localRest===30?theme.accent:theme.surface}}><Text style={{color:theme.text}}>30</Text></Pressable>
          <Pressable onPress={()=>preset(60)} style={{padding:10,borderRadius:8,backgroundColor:localRest===60?theme.accent:theme.surface}}><Text style={{color:theme.text}}>60</Text></Pressable>
          <Pressable onPress={()=>preset(90)} style={{padding:10,borderRadius:8,backgroundColor:localRest===90?theme.accent:theme.surface}}><Text style={{color:theme.text}}>90</Text></Pressable>
          <Pressable onPress={()=>preset(120)} style={{padding:10,borderRadius:8,backgroundColor:localRest===120?theme.accent:theme.surface}}><Text style={{color:theme.text}}>120</Text></Pressable>
        </View>
        <TextInput placeholder="Custom seconds" placeholderTextColor={theme.muted} keyboardType="numeric" value={String(localRest)} onChangeText={(v)=>setLocalRest(Number(v||0))} style={{backgroundColor:theme.card,color:theme.text,padding:10,borderRadius:8}}/>
        <View style={{height:20}}/>
        <Text style={{color:theme.muted,marginBottom:8}}>Actions</Text>
        <Pressable onPress={onSwap} style={{padding:12,borderRadius:10,backgroundColor:theme.surface,alignItems:'center'}}>
          <Text style={{color:theme.text}}>Swap Exercise</Text>
        </Pressable>
        <View style={{flex:1}}/>
        <View style={{flexDirection:'row',gap:12}}>
          <Pressable onPress={onClose} style={{flex:1,padding:14,borderRadius:10,backgroundColor:theme.surface,alignItems:'center'}}><Text style={{color:theme.text}}>Cancel</Text></Pressable>
          <Pressable onPress={save} style={{flex:1,padding:14,borderRadius:10,backgroundColor:theme.accent,alignItems:'center'}}><Text style={{color:theme.text,fontWeight:'700'}}>Save</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}
