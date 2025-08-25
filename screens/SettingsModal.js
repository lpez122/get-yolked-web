import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { theme } from '../constants/theme';
import { useSettings } from '../contexts/SettingsContext';
export default function SettingsModal({visible,onClose}){
  const {settings,update}=useSettings();
  const [local,setLocal]=useState(settings);
  const pick=async()=>{try{const res=await ImagePicker.launchImageLibraryAsync({mediaTypes:ImagePicker.MediaTypeOptions.Images,quality:0.7}); if(!res.canceled&&res.assets?.[0]?.uri) setLocal({...local,profileImageUri:res.assets[0].uri});}catch{}};
  const save=()=>{update(local); onClose&&onClose();};
  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose} presentationStyle="pageSheet">
      <ScrollView style={{flex:1,backgroundColor:theme.bg}} contentContainerStyle={{padding:16}}>
        <Text style={{fontSize:22,fontWeight:'700',marginBottom:12,color:theme.text}}>Settings</Text>
        <Text style={{color:theme.text, marginBottom:6}}>Units</Text>
        <View style={{flexDirection:'row',gap:8,marginVertical:8}}>
          <Pressable
            onPress={()=>setLocal({...local,units:'lb'})}
            style={{
              padding:10,
              borderRadius:8,
              backgroundColor: local.units==='lb' ? theme.accent : theme.bg,
              borderWidth: local.units==='lb' ? 0 : 1,
              borderColor: theme.border
            }}
          >
            <Text style={{color:theme.text}}>lb</Text>
          </Pressable>
          <Pressable
            onPress={()=>setLocal({...local,units:'kg'})}
            style={{
              padding:10,
              borderRadius:8,
              backgroundColor: local.units==='kg' ? theme.accent : theme.bg,
              borderWidth: local.units==='kg' ? 0 : 1,
              borderColor: theme.border
            }}
          >
            <Text style={{color:theme.text}}>kg</Text>
          </Pressable>
        </View>
        <Text style={{color:theme.text}}>Username</Text>
        <TextInput
          value={local.username}
          onChangeText={v=>setLocal({...local,username:String(v||'')})}
          style={{backgroundColor:theme.bg,padding:10,borderRadius:8,marginBottom:10,borderWidth:1,borderColor:theme.border,color:theme.text}}
          placeholder="username (used as your id)"
          placeholderTextColor={theme.border}
          autoCapitalize="none"
        />
        <Text style={{color:theme.text}}>Email</Text>
        <TextInput value={local.email} keyboardType="email-address" onChangeText={v=>setLocal({...local,email:v})} style={{backgroundColor:theme.bg,padding:10,borderRadius:8,marginBottom:10,borderWidth:1,borderColor:theme.border,color:theme.text}} placeholderTextColor={theme.border} />
        <Text style={{color:theme.text}}>Profile image</Text>
        <View style={{flexDirection:'row',alignItems:'center',gap:12,marginVertical:8}}>
          {local.profileImageUri
            ? <Image source={{uri:local.profileImageUri}} style={{width:64,height:64,borderRadius:32}}/>
            : <View style={{width:64,height:64,borderRadius:32,backgroundColor:theme.border}}/>}
          <Pressable onPress={pick} style={{padding:10,borderRadius:8,backgroundColor:theme.bg,borderWidth:1,borderColor:theme.border}}><Text style={{color:theme.text}}>Choose Image</Text></Pressable>
        </View>
        <Text style={{color:theme.text}}>Body metrics</Text>
        <View style={{flexDirection:'row',gap:8,marginTop:8}}>
          <View style={{flex:1}}>
            <Text style={{color:theme.text}}>Weight ({local.units})</Text>
            <TextInput
              value={String(local.units==='kg'?local.weightKg:Math.round(local.weightKg/0.45359237))}
              onChangeText={v=>{const n=parseFloat(v||'0'); setLocal({...local,weightKg:local.units==='kg'?n:n*0.45359237});}}
              keyboardType="numeric"
              style={{backgroundColor:theme.bg,color:theme.text,padding:10,borderRadius:8,borderWidth:1,borderColor:theme.border}}
              placeholderTextColor={theme.border}
            />
          </View>
          <View style={{flex:1}}>
            <Text style={{color:theme.text}}>Height (cm)</Text>
            <TextInput value={String(local.heightCm)} onChangeText={v=>setLocal({...local,heightCm:parseFloat(v||'0')})} keyboardType="numeric" style={{backgroundColor:theme.bg,color:theme.text,padding:10,borderRadius:8,borderWidth:1,borderColor:theme.border}} placeholderTextColor={theme.border} />
          </View>
        </View>
        <View style={{marginTop:8}}>
          <Text style={{color:theme.text}}>Age</Text>
          <TextInput
            value={String(local.age ?? '')}
            onChangeText={v=>setLocal({...local,age: parseInt(v||'0', 10)})}
            keyboardType="number-pad"
            placeholder="Age"
            placeholderTextColor={theme.border}
            style={{backgroundColor:theme.bg,color:theme.text,padding:10,borderRadius:8,marginTop:6,borderWidth:1,borderColor:theme.border}}
          />
        </View>
        <View style={{marginTop:8}}>
          <Text style={{color:theme.text}}>Body fat (%)</Text>
          <TextInput value={String(local.bodyFatPct)} onChangeText={v=>setLocal({...local,bodyFatPct:parseFloat(v||'0')})} keyboardType="numeric" style={{backgroundColor:theme.bg,color:theme.text,padding:10,borderRadius:8,borderWidth:1,borderColor:theme.border}} placeholderTextColor={theme.border} />
        </View>
        <View style={{height:16}}/>
        <View style={{flexDirection:'row',gap:12}}>
          <Pressable onPress={onClose} style={{flex:1,padding:14,borderRadius:10,backgroundColor:theme.bg,alignItems:'center',borderWidth:1,borderColor:theme.border}}><Text style={{color:theme.text}}>Cancel</Text></Pressable>
          <Pressable onPress={save} style={{flex:1,padding:14,borderRadius:10,backgroundColor:theme.accent,alignItems:'center'}}><Text style={{color:theme.text,fontWeight:'700'}}>Save</Text></Pressable>
        </View>
        <View style={{height:20}}/>
      </ScrollView>
    </Modal>
  );
}
