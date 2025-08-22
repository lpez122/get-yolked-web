import React from 'react';
import {Pressable,Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useProgramProgress} from '../contexts/ProgramProgressContext';
import {theme} from '../constants/theme';
export default function StopCurrentProgramButton(){
  const {stop}=useProgramProgress();
  async function onStop(){
    await AsyncStorage.removeItem('current_program_v1');
    await AsyncStorage.removeItem('program_progress_v1');
    await stop();
  }
  return(
    <Pressable onPress={onStop} style={{backgroundColor:'#1B2733',paddingHorizontal:14,paddingVertical:10,borderRadius:12}}>
      <Text style={{color:theme.text,fontWeight:'700'}}>Stop</Text>
    </Pressable>
  )
}
