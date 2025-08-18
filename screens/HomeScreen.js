import React,{useEffect,useState} from 'react';
import {View,Text,Pressable,ScrollView,Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import NextProgramCard from '../components/NextProgramCard';
import WorkoutSheet from '../components/WorkoutSheet';
import WorkoutView from '../components/WorkoutView';
import SaveTemplateModal from '../components/SaveTemplateModal';
import {useSession} from '../contexts/SessionContext';
import {theme} from '../constants/theme';
import * as P from '../contexts/ProgramStore';

export default function HomeScreen(){
  const nav = useNavigation();
  const {sheetVisible,setSheetVisible,startSession,endSession,current}=useSession();
  const [askSaveTpl,setAskSaveTpl]=useState(false);
  const [lastFinishPayload,setLastFinishPayload]=useState(null);
  const [programFinished,setProgramFinished]=useState(false);
  const [nextProg,setNextProg]=useState(null);

  useEffect(()=>{(async()=>{
    const fin = await P.consumeFinishFlag();
    if(fin){ setProgramFinished(true); }
    const n = await P.getNextSummary();
    setNextProg(n);
  })()},[current]);

  const onStartProgram=()=>{ if(nextProg){ startSession(nextProg); } };
  const onStartAdHoc=()=>startSession({adHoc:true});

  const onFinish=async(finalize)=>{
    const res=await endSession(finalize);
    if(res?.isLastDay || await P.consumeFinishFlag()){
      Alert.alert('Congratulations!','You finished the program!');
      setProgramFinished(true);
    }
    if(res?.adHoc){ setLastFinishPayload(res); setAskSaveTpl(true); }
    const n = await P.getNextSummary();
    setNextProg(n);
  };

  return (
    <View style={{flex:1,backgroundColor:theme.bg}}>
      <ScrollView contentContainerStyle={{padding:16,gap:16}}>
        {!programFinished && nextProg ? (
          <NextProgramCard
            programName={nextProg.programName}
            week={nextProg.week}
            day={nextProg.day}
            items={(nextProg.plan?.exercises||[]).map(e=>({name:e.name,sets:e.sets||3}))}
            onStart={onStartProgram}
          />
        ) : (
          <View style={{backgroundColor:theme.card,borderRadius:16,padding:14}}>
            <Text style={{color:theme.text,fontSize:18,fontWeight:'700',marginBottom:8}}>
              {programFinished?'Program Complete':'No Active Program'}
            </Text>
            <Text style={{color:theme.muted,marginBottom:12}}>
              {programFinished?'Create a new program to keep going.':'Create a program or start an ad-hoc workout.'}
            </Text>
            <Pressable style={{padding:12,borderRadius:10,backgroundColor:theme.accent,alignItems:'center'}} onPress={()=>nav.navigate('Programs')}>
              <Text style={{color:theme.text,fontWeight:'700'}}>Create Program</Text>
            </Pressable>
          </View>
        )}

        {current ? (
          <View style={{backgroundColor:theme.card,borderRadius:16,padding:14}}>
            <Text style={{color:theme.text}}>Workout Tracker</Text>
            <Pressable style={{marginTop:8,padding:12,borderRadius:12,borderWidth:1,borderColor:theme.accent}} onPress={()=>setSheetVisible(true)}>
              <Text style={{color:theme.accent}}>Continue Workout</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{backgroundColor:theme.card,borderRadius:16,padding:14}}>
            <Text style={{color:theme.text}}>Workout</Text>
            <Pressable style={{marginTop:8,padding:12,borderRadius:12,backgroundColor:theme.accent,alignItems:'center'}} onPress={onStartAdHoc}>
              <Text style={{color:theme.text,fontWeight:'700'}}>Start New Workout</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <WorkoutSheet visible={sheetVisible} onClose={()=>setSheetVisible(false)}>
        <WorkoutView onFinish={onFinish}/>
      </WorkoutSheet>

      <SaveTemplateModal
        visible={askSaveTpl}
        onClose={()=>setAskSaveTpl(false)}
        exercises={lastFinishPayload?.exercises||[]}
        onSaved={()=>setAskSaveTpl(false)}
      />
    </View>
  );
}
