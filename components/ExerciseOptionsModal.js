import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable } from 'react-native';

export default function ExerciseOptionsModal({ visible, onClose, exerciseName, restSec, onChangeRestSec, onSwap }) {
  const [localRest, setLocalRest] = useState(restSec ?? 90);
  const save = () => { onChangeRestSec && onChangeRestSec(localRest); onClose && onClose(); };
  const preset = (v) => setLocalRest(v);
  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <View style={{flex:1, backgroundColor:'#0b0b0b', padding:16}}>
        <Text style={{color:'white', fontSize:18, fontWeight:'700'}}>{exerciseName || 'Exercise'}</Text>
        <View style={{height:12}} />
        <Text style={{color:'#9aa'}}>Rest seconds</Text>
        <View style={{flexDirection:'row', gap:8, marginVertical:8}}>
          <Pressable onPress={()=>preset(30)} style={{padding:10, borderRadius:8, backgroundColor: localRest===30?'#6c5ce7':'#222'}}><Text style={{color:'white'}}>30</Text></Pressable>
          <Pressable onPress={()=>preset(60)} style={{padding:10, borderRadius:8, backgroundColor: localRest===60?'#6c5ce7':'#222'}}><Text style={{color:'white'}}>60</Text></Pressable>
          <Pressable onPress={()=>preset(90)} style={{padding:10, borderRadius:8, backgroundColor: localRest===90?'#6c5ce7':'#222'}}><Text style={{color:'white'}}>90</Text></Pressable>
          <Pressable onPress={()=>preset(120)} style={{padding:10, borderRadius:8, backgroundColor: localRest===120?'#6c5ce7':'#222'}}><Text style={{color:'white'}}>120</Text></Pressable>
        </View>
        <TextInput
          placeholder="Custom seconds"
          placeholderTextColor="#777"
          keyboardType="numeric"
          value={String(localRest)}
          onChangeText={(v)=>setLocalRest(Number(v||0))}
          style={{backgroundColor:'#1a1a1a', color:'white', padding:10, borderRadius:8}}
        />
        <View style={{height:20}} />
        <Text style={{color:'#9aa', marginBottom:8}}>Actions</Text>
        <Pressable onPress={onSwap} style={{padding:12, borderRadius:10, backgroundColor:'#222', alignItems:'center'}}>
          <Text style={{color:'white'}}>Swap Exercise</Text>
        </Pressable>
        <View style={{flex:1}} />
        <View style={{flexDirection:'row', gap:12}}>
          <Pressable onPress={onClose} style={{flex:1, padding:14, borderRadius:10, backgroundColor:'#222', alignItems:'center'}}><Text style={{color:'white'}}>Cancel</Text></Pressable>
          <Pressable onPress={save} style={{flex:1, padding:14, borderRadius:10, backgroundColor:'#6c5ce7', alignItems:'center'}}><Text style={{color:'white', fontWeight:'700'}}>Save</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}
