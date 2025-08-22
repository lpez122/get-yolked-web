import React,{useMemo,useState,useRef,useEffect} from 'react';
import {View,Text,StyleSheet,Pressable,FlatList,TextInput,Alert} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation,useRoute} from '@react-navigation/native';
import {theme} from '../constants/theme';
import ExercisePicker from '../components/ExercisePicker';
import {addHistoryEntry} from '../utils/history';
import {getDayExercises,advanceAfterFinish} from '../utils/programState';

function fmt(sec){const s=Math.max(0,Math.floor(sec));const h=Math.floor(s/3600);const m=Math.floor((s%3600)/60);const r=s%60;return (h?`${h}:`:'')+String(m).padStart(2,'0')+':'+String(r).padStart(2,'0')}
function defSet(){return {lbs:0,reps:0,rpe:7,done:false}}
function mapSet(s){const w=s?.weight??s?.lbs??0;const r=s?.reps??0;const p=s?.rpe??7;return {lbs:Number(w)||0,reps:Number(r)||0,rpe:Number(p)||7,done:false}}
function mapEx(e){const base=Array.isArray(e?.sets)&&e.sets.length?e.sets:[...Array(Number(e?.targetSets||3))].map(()=>({weight:0,reps:0,rpe:7}));return {id:e?.id||`ex_${Date.now()}_${Math.random()}`,name:e?.name||'Exercise',sets:base.map(mapSet)}}

function ExerciseCard({ex,index,onToggle,onUpdate,onAddSet,onMenu}){
  return(
    <View style={styles.exCard}>
      <View style={styles.exHeader}>
        <Text style={styles.exTitle} numberOfLines={1}>{ex.name||'Exercise'}</Text>
        <Pressable onPress={()=>onMenu(index)} style={styles.menuDot}><Text style={{color:theme.text}}>⋯</Text></Pressable>
      </View>
      <View style={styles.tableHeader}>
        <Text style={[styles.th,{flex:0.7}]}>SET</Text>
        <Text style={styles.th}>PREVIOUS</Text>
        <Text style={styles.th}>LBS</Text>
        <Text style={styles.th}>REPS</Text>
        <Text style={[styles.th,{flex:0.6}]}/>
      </View>
      {(ex.sets||[]).map((s,i)=>(
        <View key={i} style={styles.setRow}>
          <Text style={[styles.cell,{flex:0.7}]}>{i+1}</Text>
          <Text style={[styles.cell,{color:theme.textDim}]}>—</Text>
          <TextInput value={String(s.lbs??'')} onChangeText={(t)=>onUpdate(index,i,{lbs:t})} keyboardType="numeric" placeholder="0" placeholderTextColor={theme.textDim} style={[styles.input,s.done&&styles.doneInput]}/>
          <TextInput value={String(s.reps??'')} onChangeText={(t)=>onUpdate(index,i,{reps:t})} keyboardType="numeric" placeholder="0" placeholderTextColor={theme.textDim} style={[styles.input,s.done&&styles.doneInput]}/>
          <Pressable onPress={()=>onToggle(index,i)} style={[styles.checkBtn,s.done&&styles.checkBtnOn]}>
            <Text style={[styles.checkMark,s.done&&styles.checkMarkOn]}>✓</Text>
          </Pressable>
        </View>
      ))}
      <Pressable onPress={()=>onAddSet(index)} style={styles.addSetBtn}><Text style={styles.addSetText}>+ Add Set</Text></Pressable>
    </View>
  )
}

export default function StableWorkout(){
  const nav=useNavigation();
  const route=useRoute();
  const {top,bottom}=useSafeAreaInsets();

  const [exercises,setExercises]=useState([]);
  const [running,setRunning]=useState(true);
  const [elapsed,setElapsed]=useState(0);
  const [startedAt,setStartedAt]=useState(Date.now());

  const [pickerOpen,setPickerOpen]=useState(false);
  const [pickerMulti,setPickerMulti]=useState(true);
  const [swapIndex,setSwapIndex]=useState(-1);

  const lastTick=useRef(Date.now());

  useEffect(()=>{const id=setInterval(()=>{if(running){const now=Date.now();setElapsed(e=>e+(now-lastTick.current)/1000);lastTick.current=now}},500);return ()=>clearInterval(id)},[running]);
  useEffect(()=>{lastTick.current=Date.now()},[running]);

  useEffect(()=>{hydrate()},[]);
  async function hydrate(){
    const p=route?.params||{};
    let init=[];
    if(Array.isArray(p.initialExercises)&&p.initialExercises.length) init=p.initialExercises.map(mapEx);
    else if(p.mode==='program' || p.programId){
      const arr=await getDayExercises({programId:p.programId,programName:p.programName,week:p.week,day:p.day});
      init=(arr||[]).map(mapEx);
    }
    setExercises(init);
    setStartedAt(Date.now());
    setRunning(true);
    lastTick.current=Date.now();
  }

  function toggleSetDone(exIdx,setIdx){setExercises(prev=>{const n=prev.map(x=>({...x}));n[exIdx].sets=n[exIdx].sets.map((s,i)=>i===setIdx?{...s,done:!s.done}:s);return n})}
  function updateSet(exIdx,setIdx,patch){setExercises(prev=>{const n=prev.map(x=>({...x}));n[exIdx].sets=n[exIdx].sets.map((s,i)=>i===setIdx?{...s,...patch}:s);return n})}
  function addSet(exIdx){setExercises(prev=>{const n=prev.map(x=>({...x}));n[exIdx].sets=[...n[exIdx].sets,defSet()];return n})}

  function openAdd(){setSwapIndex(-1);setPickerMulti(true);setPickerOpen(true)}
  function openSwap(i){setSwapIndex(i);setPickerMulti(false);setPickerOpen(true)}
  function onPickerConfirm(list){
    if(!Array.isArray(list)||list.length===0){setPickerOpen(false);return}
    if(swapIndex>=0){
      const rep=mapEx(list[0]);
      setExercises(prev=>{const n=prev.map(x=>({...x}));n[swapIndex]=rep;return n});
    }else{
      const mapped=list.map(mapEx);
      setExercises(prev=>[...prev,...mapped]);
    }
    setPickerOpen(false);setSwapIndex(-1);
  }

  async function finish(){
    const end=Date.now();
    const summary={programName:route?.params?.programName||'',startedAt,endedAt:end,durationSec:Math.round(elapsed),exercises};
    await addHistoryEntry(summary);
    await advanceAfterFinish();
    setRunning(false);setElapsed(0);setExercises([]);setStartedAt(Date.now());
    try{Alert.alert('Great job','You finished your workout!')}catch(e){}
    nav.goBack();
  }

  const header=useMemo(()=>(
    <View style={[styles.header,{paddingTop:top+8}]}>
      <Text style={styles.clock}>{fmt(elapsed)}</Text>
      <View style={{flexDirection:'row',gap:8}}>
        <Pressable onPress={()=>setRunning(r=>!r)} style={[styles.hBtn,!running&&{backgroundColor:'#26262F'}]}>
          <Text style={styles.hBtnText}>{running?'Pause':'Resume'}</Text>
        </Pressable>
        <Pressable onPress={finish} style={[styles.hBtn,{backgroundColor:theme.accent}]}>
          <Text style={[styles.hBtnText,{color:'#fff'}]}>Finish</Text>
        </Pressable>
      </View>
    </View>
  ),[running,elapsed,top]);

  return(
    <View style={styles.sheet}>
      {header}
      <FlatList
        data={exercises}
        keyExtractor={(_,i)=>String(i)}
        contentContainerStyle={{paddingBottom:bottom+24}}
        renderItem={({item,index})=>(
          <ExerciseCard ex={item} index={index} onToggle={toggleSetDone} onUpdate={updateSet} onAddSet={addSet} onMenu={openSwap}/>
        )}
        ListFooterComponent={<Pressable onPress={openAdd} style={styles.addExercise}><Text style={styles.addExerciseText}>+ Add Exercise</Text></Pressable>}
      />
      <ExercisePicker visible={pickerOpen} onClose={()=>setPickerOpen(false)} onConfirm={onPickerConfirm} multi={pickerMulti}/>
    </View>
  )
}

const styles=StyleSheet.create({
  sheet:{flex:1,backgroundColor:theme.bg},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingBottom:8,backgroundColor:theme.bg},
  clock:{color:theme.text,fontSize:28,fontWeight:'700'},
  hBtn:{paddingHorizontal:14,paddingVertical:10,borderRadius:12,backgroundColor:'#1F1F28'},
  hBtnText:{color:theme.text,fontWeight:'700'},
  exCard:{backgroundColor:theme.card,marginHorizontal:12,marginTop:12,borderRadius:14,padding:12},
  exHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:6},
  exTitle:{color:theme.text,fontSize:16,fontWeight:'700'},
  menuDot:{width:32,height:32,alignItems:'center',justifyContent:'center',borderRadius:8,backgroundColor:'#23232B'},
  tableHeader:{flexDirection:'row',paddingVertical:6,borderBottomWidth:1,borderBottomColor:theme.border},
  th:{flex:1,color:theme.textDim,fontSize:12,letterSpacing:0.5},
  setRow:{flexDirection:'row',alignItems:'center',paddingVertical:8,borderBottomWidth:1,borderBottomColor:theme.border},
  cell:{flex:1,color:theme.text},
  input:{flex:1,color:theme.text,borderWidth:1,borderColor:theme.border,borderRadius:10,paddingVertical:6,paddingHorizontal:10,marginHorizontal:6,minWidth:64,textAlign:'center'},
  doneInput:{borderColor:theme.accent,backgroundColor:'#0C1F36'},
  checkBtn:{flex:0.6,height:30,borderRadius:8,borderWidth:2,borderColor:theme.border,alignItems:'center',justifyContent:'center'},
  checkBtnOn:{borderColor:theme.accent,backgroundColor:'#0C1F36'},
  checkMark:{color:theme.textDim,fontWeight:'900'},
  checkMarkOn:{color:theme.accent},
  addSetBtn:{marginTop:8,alignSelf:'flex-start',paddingVertical:6,paddingHorizontal:12,borderRadius:10,backgroundColor:'#20202A'},
  addSetText:{color:'#B8B8C7',fontWeight:'600'},
  addExercise:{marginTop:16,alignSelf:'center',backgroundColor:theme.accent,paddingHorizontal:18,paddingVertical:12,borderRadius:12},
  addExerciseText:{color:'#fff',fontWeight:'800'}
});
