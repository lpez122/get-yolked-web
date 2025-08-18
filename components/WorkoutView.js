import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Platform } from 'react-native';
import { useSession } from '../contexts/SessionContext';
import { useSettings } from '../contexts/SettingsContext';
import { getLastForExercise } from '../contexts/HistoryStore';
import RestTimer from './RestTimer';
import Confetti from './Confetti';

function Header({elapsedSec,onFinish,dateISO,setDateISO,notes,setNotes}){
  const mm = String(Math.floor(elapsedSec/60)).padStart(2,'0');
  const ss = String(elapsedSec%60).padStart(2,'0');
  return (
    <View style={{padding:16, backgroundColor:'#171717', borderTopLeftRadius:16, borderTopRightRadius:16}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
        <Text style={{color:'white', fontWeight:'700'}}>⏸ {mm}:{ss}</Text>
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

export default function WorkoutView({ onFinish }) {
  const { current } = useSession();
  const { settings } = useSettings();
  const [celebrate, setCelebrate] = useState(false);

  const startAt = current?.startAt || Date.now();
  const [elapsed, setElapsed] = useState(Math.floor((Date.now()-startAt)/1000));
  useEffect(()=>{
    const id = setInterval(()=>setElapsed(Math.floor((Date.now()-startAt)/1000)),1000);
    return ()=>clearInterval(id);
  },[startAt]);

  const [dateISO,setDateISO] = useState(new Date(startAt).toISOString());
  const [notes,setNotes] = useState('');

  const [exercises, setExercises] = useState([]);
  const plan = current?.plan;

  useEffect(()=>{(async ()=>{
    let list = [];
    if (plan?.exercises?.length){
      list = plan.exercises.map(e => ({ name: e.name, targetSets: e.sets||3, targetReps: e.reps||10, targetWeight: e.weight||'' }));
    } else {
      list = [
        {name:'Lying Side Lateral Raise', targetSets:3, targetReps:10, targetWeight:''},
        {name:'Bicep Curl (Dumbbell)', targetSets:3, targetReps:10, targetWeight:''}
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
      withPrev.push({name:e.name, rows, rest:false});
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

  const swapExercise = (ei) => {
    const name = prompt ? prompt('Swap exercise name:', exercises[ei].name) : null;
    if (!name) return;
    setExercises(xs=>{
      const c = xs.slice();
      c[ei] = { ...c[ei], name };
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
      <Header elapsedSec={elapsed} onFinish={onFinishPress} dateISO={dateISO} setDateISO={setDateISO} notes={notes} setNotes={setNotes} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {exercises.map((ex, ei)=>(
          <View key={ei} style={{ backgroundColor:'#141414', borderRadius:12, paddingBottom:12 }}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12}}>
              <Pressable onLongPress={()=>swapExercise(ei)}>
                <Text style={{color:'#8aa2ff', fontSize:16, fontWeight:'700'}}>{ei+1}  {ex.name}  ›</Text>
              </Pressable>
              <View style={{flexDirection:'row', gap:12}}>
                <Pressable onPress={()=>swapExercise(ei)} style={{paddingVertical:6,paddingHorizontal:10, backgroundColor:'#222', borderRadius:8}}>
                  <Text style={{color:'white'}}>Swap</Text>
                </Pressable>
                <RestTimer />
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

      {celebrate ? <Confetti count={80} origin={{ x: 0, y: 0 }} fadeOut autoStart /> : null}
    </View>
  );
}
