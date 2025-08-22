import React from 'react';
import {ScrollView,View,Text,Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {theme} from '../constants/theme';
import HomeProgramCard from '../components/HomeProgramCard';

export default function HomeScreen(){
  const nav=useNavigation();
  function startEmpty(){ nav.navigate('Workout',{mode:'empty'}) }
  return (
    <ScrollView style={{flex:1,backgroundColor:theme.bg}} contentContainerStyle={{padding:16}}>
      <HomeProgramCard/>
      <Pressable onPress={startEmpty} style={{backgroundColor:theme.accent,alignSelf:'flex-start',paddingHorizontal:18,paddingVertical:12,borderRadius:14}}>
        <Text style={{color:'#fff',fontWeight:'800'}}>Start Empty Workout</Text>
      </Pressable>
    </ScrollView>
  );
}
