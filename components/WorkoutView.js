import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useSession } from '../contexts/SessionContext';
import { useSettings } from '../contexts/SettingsContext';
import { getLastForExercise } from '../contexts/HistoryStore';
import RestTimer from './RestTimer';
import Confetti from './Confetti';
import ExerciseOptionsModal from './ExerciseOptionsModal';
import ExercisePickerModal from './ExercisePickerModal';

function Header({elapsedSec, running, setRunning, onFinish, dateISO, setDateISO, notes, setNotes}){
  const mm = String(Math.floor(elapsedSec/60)).padStart(2,'0');
  const ss = String(elapsedSec%60).padStart(2,'0');
  return (
    <View style={{padding:16, backgroundColor:'#171717', borderTopLeftRadius:16, borderTopRightRadius:16}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
        <Pressable onPress={()=>setRunning(r=>!r)} style={{paddingVertical:8, paddingHorizontal:14, backgroundColor:'#333', borderRadius:10}}>
          <Text style={{color:'white', fontWeight:'700'}}>{running?'Pause':'Start'} {mm}:{ss}</Text>
        </Pressable>
        <Pressable onPress={onFinish} style={{paddingVertical:8, paddingHorizontal:14, backgroundColor:'#7c5cff', borderRadius:10}}>
          <Text style={{color:'white', fontWeight:'700'}}>Finish</Text>
        </Pressable>
      </View>
      <View style={{height:10}}/>
      <Text style={{color:'white', fontSize:24, fontWeight:'800'}}>Workout</Text>
      <View style={{height:8}}/>
      <Text style={{color:'#aaa'}}>Date</Text>
      <TextInput
        value={dateISO.slice(0,10)}
        onChangeText={(v)=>setDateISO(v.length>=10 ? (v+'T00:00:00.000Z') : dateISO)}
        style={{backgroundColor:'#1a1a1a', color:'white', padding:10, borderRadius:8}}
      />
      <View style={{height:8}}/>
      <Text style={{color:'#aaa'}}>Notes</Text>
      <TextInput
        placeholder="Add notes here..."
        placeholderTextColor="#777"
        value={notes}
        onChangeText={setNotes}
        style={{backgroundColor:'#1a1a1a', color:'white', padding:10, borderRadius:8}}
        multiline
      />
    </View>
  );
}

function HeaderRow({units}){
  return (
    <View style={{flexDirection:'row', paddingVertical:8, paddingHorizontal:12}}>
      <Text style={{flex:1, color:'#9aa'}}>Set</Text>
      <Text style={{flex:2, color:'#9aa'}}>Previous</Text>
      <Text style={{width:80, color:'#9aa', textAlign:'right'}}>{units}</Text>
      <Text style={{width:60, color:'#9aa', textAlign:'right'}}>Reps</Text>
      <Text style={{width:40, color:'#9aa', textAlign:'center'}}>✓</Text>
    </View>
  );
}

function singleReps(e){
  if (typeof e?.reps === 'number') return e.reps;
  const hasMin = typeof e?.minReps === 'number';
  const hasMax = typeof e?.maxReps === 'number';
  if (hasMin && hasMax) return Math.round((e.minReps + e.maxReps)/2);
  if (hasMax) return e.maxReps;
  if (hasMin) return e.minReps;
  return 10;
}

export default function WorkoutView({ onFinish }) {
  const { current } = useSession();
  const { settings } = useSettings();
  const [celebrate, setCelebrate] = useState(false);

  const startAt = current?.startAt || Date.now();
  const [elapsed, setElapsed] = useState(Math.floor((Date.now()-startAt)/1000));
  const [running, setRunning] = useState(true);
  useEffect(()=>{
    if(!running) return;
    const id = setInterval(()=>setElapsed(Math.floor((Date.now()-startAt)/1000)),1000);
    return ()=>clearInterval(id);
  },[startAt, running]);

  const [dateISO,setDateISO] = useState(new Date(startAt).toISOString());
  const [notes,setNotes] = useState('');

  const [exercises, setExercises] = useState([]);
  const plan = current?.plan;

  const [optIndex, setOptIndex] = useState(-1);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(()=>{(async ()=>{
    let list = [];
    if (Array.isArray(plan?.exercises) && plan.exercises.length) {
      list = plan.exercises.map(e => ({
        name: e.name,
        targetSets: e.sets ?? e.targetSets ?? 3,
        targetReps: singleReps(e),
        targetWeight: e.weight ?? e.targetWeight ?? '',
        restSec: e.restSec ?? 90
      }));
    } else {
      list = [
        {name:'Lying Side Lateral Raise', targetSets:3, targetReps:10, targetWeight:'', restSec:90},
        {name:'Bicep Curl (Dumbbell)',   targetSets:3, targetReps:10, targetWeight:'', restSec:90}
      ];
    }
    const withPrev = [];
    for (const e of list){
      const prev = await getLastForExercise(e.name);
      const prevLabel = prev ? `${prev.weight} ${prev.units||'lb'} x ${prev.reps}` : '—';
      const rows = Array.from({length:e.targetSets}).map((_,i)=>({
        set: i+1,
        weight: prev?.weight ?? e.targetWeight ?? '',
        reps: e.targetReps ?? '',
        rpe: 7,
        done:false,
        prevLabel
      }));
      withPrev.push({name:e.name, rows, restSec: e.restSec});
    }
    setExercises(withPrev);
  })();},[plan]);

  const toggleDone = (ei, si) => {
    setExercises(xs=>{
      const c = xs.slice();
      const r = {...c[ei].rows[si]};
      r.done = !r.done;
      c[ei].rows[si] = r;
      return c;
    });
  };

  const updateCell = (ei, si, key, val) => {
    setExercises(xs=>{
      const c = xs.slice();
      const r = {...c[ei].rows[si], [key]: val};
      c[ei].rows[si] = r;
      return c;
    });
  };

  const addSet = (ei) => {
    setExercises(xs=>{
      const c = xs.slice();
      const last = c[ei].rows[c[ei].rows.length-1] || {weight:'', reps:'', rpe:7, prevLabel:'—'};
      c[ei].rows.push({ set: c[ei].rows.length+1, weight:last.weight, reps:last.reps, rpe:last.rpe, done:false, prevLabel:last.prevLabel });
      return c;
    });
  };

  const openOptions = (ei) => {
    setOptIndex(ei);
  };

  const closeOptions = () => {
    setOptIndex(-1);
  };

  const setRestFor = (sec) => {
    if (optIndex < 0) return;
    setExercises(xs=>{
      const c = xs.slice();
      c[optIndex] = { ...c[optIndex], restSec: sec };
      return c;
    });
  };

  const beginSwap = () => {
    setPickerVisible(true);
  };

  const onPickExercise = (name) => {
    if (optIndex < 0) return;
    setExercises(xs=>{
      const c = xs.slice();
      c[optIndex] = { ...c[optIndex], name };
      return c;
    });
  };

  const onFinishPress = () => {
    const flatSets = [];
    const outExercises = exercises.map(ex => ({
      name: ex.name,
      sets: ex.rows.map(r => {
        const one = {
          weight: Number(r.weight||0),
          reps: Number(r.reps||0),
          rpe: Number(r.rpe||0),
          done: !!r.done
        };
        if (one.done) flatSets.push({exercise: ex.name, ...one});
        return one;
      })
    }));
    setCelebrate(true);
    setTimeout(()=>setCelebrate(false), 1200);
    onFinish && onFinish({ dateISO, notes, exercises: outExercises, sets: flatSets });
  };

  return (
    <View style={{ flex:1, backgroundColor:'#0b0b0b' }}>
      <Header elapsedSec={elapsed} running={running} setRunning={setRunning} onFinish={onFinishPress} dateISO={dateISO} setDateISO={setDateISO} notes={notes} setNotes={setNotes} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {exercises.map((ex, ei)=>(
          <View key={ei} style={{ backgroundColor:'#141414', borderRadius:12, paddingBottom:12 }}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12}}>
              <Pressable>
                <Text style={{color:'#8aa2ff', fontSize:16, fontWeight:'700'}}>{ei+1}  {ex.name}  ›</Text>
              </Pressable>
              <View style={{flexDirection:'row', gap:12, alignItems:'center'}}>
                <RestTimer initialSec={ex.restSec || 90} />
                <Pressable onPress={()=>openOptions(ei)} style={{paddingVertical:6,paddingHorizontal:10, backgroundColor:'#222', borderRadius:8}}>
                  <Text style={{color:'white'}}>⋯</Text>
                </Pressable>
              </View>
            </View>
            <HeaderRow units={settings.units} />
            {ex.rows.map((r, si)=>(
              <View key={si} style={{flexDirection:'row', alignItems:'center', paddingVertical:6, paddingHorizontal:12, gap:8}}>
                <Text style={{flex:1, color:'white'}}>{r.set}</Text>
                <Text style={{flex:2, color:'#aaa'}}>{r.prevLabel}</Text>
                <TextInput
                  keyboardType="numeric"
                  value={String(r.weight ?? '')}
                  onChangeText={(v)=>updateCell(ei,si,'weight',v)}
                  style={{width:80, backgroundColor:'#1a1a1a', color:'white', padding:8, borderRadius:8, textAlign:'right'}}
                />
                <TextInput
                  keyboardType="numeric"
                  value={String(r.reps ?? '')}
                  onChangeText={(v)=>updateCell(ei,si,'reps',v)}
                  style={{width:60, backgroundColor:'#1a1a1a', color:'white', padding:8, borderRadius:8, textAlign:'right'}}
                />
                <Pressable onPress={()=>toggleDone(ei,si)} style={{width:40, alignItems:'center'}}>
                  <Text style={{fontSize:18}}>{r.done ? '✅' : '🏋️'}</Text>
                </Pressable>
              </View>
            ))}
            <View style={{paddingHorizontal:12, paddingTop:6}}>
              <Pressable onPress={()=>addSet(ei)} style={{padding:12, borderRadius:10, backgroundColor:'#333', alignItems:'center'}}>
                <Text style={{color:'white', fontWeight:'600'}}>+ Add Set</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
      <ExerciseOptionsModal
        visible={optIndex>=0}
        onClose={closeOptions}
        exerciseName={exercises[optIndex]?.name}
        restSec={exercises[optIndex]?.restSec || 90}
        onChangeRestSec={setRestFor}
        onSwap={beginSwap}
      />
      <ExercisePickerModal
        visible={pickerVisible}
        onClose={()=>setPickerVisible(false)}
        onPick={onPickExercise}
      />
      {celebrate ? <Confetti count={80} origin={{ x: 0, y: 0 }} fadeOut autoStart /> : null}
    </View>
  );
}
