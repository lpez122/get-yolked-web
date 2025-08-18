import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView } from 'react-native';
let useDataHook = null;
try { useDataHook = require('../contexts/DataContext').useData; } catch(e) {}

export default function ExercisePickerModal({ visible, onClose, onPick }) {
  const dataCtx = useDataHook ? useDataHook() : null;
  const all = dataCtx && Array.isArray(dataCtx.data?.exercises) ? dataCtx.data.exercises.map(e=>e.name) : [
    'Back Squat','Front Squat','Deadlift','Bench Press','Overhead Press','Barbell Row','Incline DB Press','Lat Pulldown','Face Pull','Bicep Curl (Dumbbell)','Tricep Pushdown','Lateral Raise','Leg Press','Romanian Deadlift'
  ];
  const [q,setQ] = useState('');
  const list = useMemo(()=> all.filter(n => n.toLowerCase().includes(q.toLowerCase())).slice(0,200), [all,q]);
  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <View style={{flex:1, backgroundColor:'#0b0b0b'}}>
        <View style={{padding:16}}>
          <Text style={{color:'white', fontSize:18, fontWeight:'700'}}>Select Exercise</Text>
          <TextInput
            placeholder="Search"
            placeholderTextColor="#777"
            value={q}
            onChangeText={setQ}
            style={{marginTop:12, backgroundColor:'#1a1a1a', color:'white', padding:10, borderRadius:8}}
          />
        </View>
        <ScrollView contentContainerStyle={{paddingHorizontal:16, paddingBottom:24}}>
          {list.map((name,i)=>(
            <Pressable key={i} onPress={()=>{ onPick && onPick(name); onClose && onClose(); }} style={{padding:12, borderBottomWidth:1, borderColor:'#1f1f1f'}}>
              <Text style={{color:'white'}}>{name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={{padding:16}}>
          <Pressable onPress={onClose} style={{padding:14, borderRadius:10, backgroundColor:'#222', alignItems:'center'}}>
            <Text style={{color:'white'}}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
