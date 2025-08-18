import React,{useMemo,useState} from 'react';
import {View,Text,Pressable,ScrollView} from 'react-native';
import NextProgramCard from '../components/NextProgramCard';
import WorkoutSheet from '../components/WorkoutSheet';
import SettingsModal from './SettingsModal';
import WorkoutView from '../components/WorkoutView';
import {useSession} from '../contexts/SessionContext';

export default function HomeScreen(){
  const {sheetVisible,setSheetVisible,startSession,endSession}=useSession();
  const [showSettings,setShowSettings]=useState(false);
  const next=useMemo(()=>({
    programName:'Get Yolked 4.0',
    week:2, day:4,
    items:[
      {name:'Lying Side Lateral Raise', sets:3, reps:10},
      {name:'Bicep Curl (Dumbbell)', sets:3, reps:10},
    ],
    plan:{exercises:[
      {name:'Lying Side Lateral Raise', sets:3, reps:10},
      {name:'Bicep Curl (Dumbbell)', sets:3, reps:10}
    ]}
  }),[]);
  const onStart=()=>startSession({programName:next.programName,week:next.week,day:next.day,plan:next.plan});
  const onFinish=(finalize)=>endSession(finalize);
  return (
    <View style={{flex:1,backgroundColor:'#0a0a0a'}}>
      <ScrollView contentContainerStyle={{padding:16,gap:16}}>
        <NextProgramCard programName={next.programName} week={next.week} day={next.day} items={next.items} onStart={onStart}/>
        <View style={{backgroundColor:'#141414',borderRadius:16,padding:14}}>
          <Text style={{color:'white'}}>Workout Tracker</Text>
          <Pressable style={{marginTop:8,padding:12,borderRadius:12,borderWidth:1,borderColor:'#4338ca'}} onPress={()=>setSheetVisible(true)}>
            <Text style={{color:'#a5b4fc'}}>Continue Workout</Text>
          </Pressable>
        </View>
      </ScrollView>
      <WorkoutSheet visible={sheetVisible} onClose={()=>setSheetVisible(false)}>
        <WorkoutView onFinish={onFinish}/>
      </WorkoutSheet>
      <SettingsModal visible={showSettings} onClose={()=>setShowSettings(false)} />
    </View>
  );
}
