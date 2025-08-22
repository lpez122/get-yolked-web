import React from 'react';
import {Pressable,Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {useProgramProgress} from '../contexts/ProgramProgressContext';
import {theme} from '../constants/theme';
export default function StartProgramButton({programId,programName,week=1,day=1}){
  const nav=useNavigation();
  const {begin}=useProgramProgress();
  async function onStart(){
    if(programId){
      await AsyncStorage.setItem('current_program_v1',JSON.stringify({programId,week,day}));
      await AsyncStorage.removeItem('program_progress_v1');
      await begin({programId,week,day,status:'in_progress'});
      nav.navigate('Workout',{mode:'program',programId,week,day});
      return;
    }
    if(programName){
      await begin({programName,week,day,status:'in_progress'});
      nav.navigate('Workout',{mode:'program',programName,week,day});
    }
  }
  return(
    <Pressable onPress={onStart} style={{backgroundColor:theme.accent,paddingHorizontal:14,paddingVertical:10,borderRadius:12}}>
      <Text style={{color:'#fff',fontWeight:'800'}}>Start</Text>
    </Pressable>
  )
}
