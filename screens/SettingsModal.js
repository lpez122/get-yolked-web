import React,{useState} from 'react';
import {Modal,View,Text,TextInput,Pressable,Image,ScrollView} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {useSettings} from '../contexts/SettingsContext';
export default function SettingsModal({visible,onClose}){
  const {settings,update}=useSettings();
  const [local,setLocal]=useState(settings);
  const pick=async()=>{try{const res=await ImagePicker.launchImageLibraryAsync({mediaTypes:ImagePicker.MediaTypeOptions.Images,quality:0.7}); if(!res.canceled&&res.assets?.[0]?.uri) setLocal({...local,profileImageUri:res.assets[0].uri});}catch{}};
  const save=()=>{update(local); onClose&&onClose();};
  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose} presentationStyle="pageSheet">
      <ScrollView style={{flex:1,backgroundColor:'#0b0b0b'}} contentContainerStyle={{padding:16}}>
        <Text style={{fontSize:22,fontWeight:'700',marginBottom:12,color:'white'}}>Settings</Text>
        <Text style={{color:'#9aa'}}>Units</Text>
        <View style={{flexDirection:'row',gap:8,marginVertical:8}}>
          <Pressable onPress={()=>setLocal({...local,units:'lb'})} style={{padding:10,borderRadius:8,backgroundColor:local.units==='lb'?'#5b5':'#222'}}><Text style={{color:'white'}}>lb</Text></Pressable>
          <Pressable onPress={()=>setLocal({...local,units:'kg'})} style={{padding:10,borderRadius:8,backgroundColor:local.units==='kg'?'#5b5':'#222'}}><Text style={{color:'white'}}>kg</Text></Pressable>
        </View>
        <Text style={{color:'#9aa'}}>Name</Text>
        <TextInput value={local.name} onChangeText={v=>setLocal({...local,name:v})} style={{backgroundColor:'#1a1a1a',color:'white',padding:10,borderRadius:8,marginBottom:10}} />
        <Text style={{color:'#9aa'}}>Email</Text>
        <TextInput value={local.email} keyboardType="email-address" onChangeText={v=>setLocal({...local,email:v})} style={{backgroundColor:'#1a1a1a',color:'white',padding:10,borderRadius:8,marginBottom:10}} />
        <Text style={{color:'#9aa'}}>Profile image</Text>
        <View style={{flexDirection:'row',alignItems:'center',gap:12,marginVertical:8}}>
          {local.profileImageUri?<Image source={{uri:local.profileImageUri}} style={{width:64,height:64,borderRadius:32}}/>:<View style={{width:64,height:64,borderRadius:32,backgroundColor:'#222'}}/>}
          <Pressable onPress={pick} style={{padding:10,borderRadius:8,backgroundColor:'#333'}}><Text style={{color:'white'}}>Choose Image</Text></Pressable>
        </View>
        <Text style={{color:'#9aa'}}>Body metrics</Text>
        <View style={{flexDirection:'row',gap:8,marginTop:8}}>
          <View style={{flex:1}}>
            <Text style={{color:'#9aa'}}>Weight ({local.units})</Text>
            <TextInput value={String(local.units==='kg'?local.weightKg:Math.round(local.weightKg/0.45359237))} onChangeText={v=>{const n=parseFloat(v||'0'); setLocal({...local,weightKg:local.units==='kg'?n:n*0.45359237});}} keyboardType="numeric" style={{backgroundColor:'#1a1a1a',color:'white',padding:10,borderRadius:8}} />
          </View>
          <View style={{flex:1}}>
            <Text style={{color:'#9aa'}}>Height (cm)</Text>
            <TextInput value={String(local.heightCm)} onChangeText={v=>setLocal({...local,heightCm:parseFloat(v||'0')})} keyboardType="numeric" style={{backgroundColor:'#1a1a1a',color:'white',padding:10,borderRadius:8}} />
          </View>
        </View>
        <View style={{marginTop:8}}>
          <Text style={{color:'#9aa'}}>Body fat (%)</Text>
          <TextInput value={String(local.bodyFatPct)} onChangeText={v=>setLocal({...local,bodyFatPct:parseFloat(v||'0')})} keyboardType="numeric" style={{backgroundColor:'#1a1a1a',color:'white',padding:10,borderRadius:8}} />
        </View>
        <View style={{height:16}}/>
        <View style={{flexDirection:'row',gap:12}}>
          <Pressable onPress={onClose} style={{flex:1,padding:14,borderRadius:10,backgroundColor:'#222',alignItems:'center'}}><Text style={{color:'white'}}>Cancel</Text></Pressable>
          <Pressable onPress={save} style={{flex:1,padding:14,borderRadius:10,backgroundColor:'#6c5ce7',alignItems:'center'}}><Text style={{color:'white',fontWeight:'700'}}>Save</Text></Pressable>
        </View>
        <View style={{height:20}}/>
      </ScrollView>
    </Modal>
  );
}
