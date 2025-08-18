import React,{useCallback,useEffect,useState} from 'react';
import {View,Text,Pressable,ScrollView} from 'react-native';
import NextProgramCard from '../components/NextProgramCard';
import WorkoutSheet from '../components/WorkoutSheet';
import SettingsModal from './SettingsModal';
import WorkoutView from '../components/WorkoutView';
import {useSession} from '../contexts/SessionContext';
import { ensureActiveProgram, getNextUp } from '../contexts/ProgramProgress';

export default function HomeScreen(){
  const {sheetVisible,setSheetVisible,startSession,endSession,current}=useSession();
  const [showSettings,setShowSettings]=useState(false);
  const [next,setNext] = useState(null);

  const loadNext = useCallback(async ()=>{
    await ensureActiveProgram('Get Yolked 4.0');
    const data = await getNextUp();
    setNext(data);
  },[]);

  useEffect(()=>{ loadNext(); },[loadNext]);

  const onStart=()=>{ 
    if (!next) return;
    startSession({programName:next.programName,week:next.week,day:next.day,plan:next.plan});
  };

  const onFinish=async(finalize)=>{
    await endSession(finalize);
    await loadNext();
  };

  const hasActiveSession = !!current;
  const ctaLabel = hasActiveSession ? 'Continue Workout' : 'Start Workout';

  return (
    <View style={{flex:1,backgroundColor:'#0a0a0a'}}>
      <View style={{height:56,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16}}>
        <Text style={{color:'white',fontSize:20,fontWeight:'700'}}>Train</Text>
        <Pressable onPress={()=>setShowSettings(true)}><Text style={{color:'white'}}>⚙️</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={{padding:16,gap:16}}>
        {next ? (
          <NextProgramCard
            programName={next.programName}
            week={next.week}
            day={next.day}
            items={next.items}
            onStart={onStart}
          />
        ) : (
          <View style={{backgroundColor:'#141414',borderRadius:16,padding:14}}>
            <Text style={{color:'white',fontWeight:'700'}}>All sessions complete</Text>
            <Text style={{color:'#aaa',marginTop:6}}>You’ve finished the programmed days.</Text>
          </View>
        )}

        <View style={{backgroundColor:'#141414',borderRadius:16,padding:14}}>
          <Text style={{color:'white'}}>Workout Tracker</Text>
          <Pressable style={{marginTop:8,padding:12,borderRadius:12,borderWidth:1,borderColor:'#4338ca'}} onPress={()=>setSheetVisible(true)}>
            <Text style={{color:'#a5b4fc'}}>{ctaLabel}</Text>
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
