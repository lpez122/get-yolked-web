import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExerciseEditor from '../components/ExerciseEditor';
import ExercisePicker from '../components/ExercisePicker';
import RestSquareTimer from '../components/RestSquareTimer';
import SummaryModal from '../components/SummaryModal';
import { theme } from '../constants/theme';
import { useData } from '../contexts/DataContext';
import { appendWorkoutSession } from '../contexts/HistoryStore';
import { advanceAfterWorkout, getNextSummary } from '../contexts/ProgramStore';
import { useSettings } from '../contexts/SettingsContext';

function fmt(sec){const s=Math.max(0,Math.floor(sec));const h=Math.floor(s/3600);const m=Math.floor((s%3600)/60);const r=s%60;return (h?`${h}:`:'')+String(m).padStart(2,'0')+':'+String(r).padStart(2,'0');}

function StableWorkoutInner(){
  const nav=useNavigation();
  const route=useRoute();
  const { addExercise, data } = useData(); // read programs when starting from Programs tab
  const { settings } = useSettings();
  const {top,bottom}=useSafeAreaInsets();

  const [programMeta,setProgramMeta]=useState({programId:null,programName:'',week:1,day:1});
  const [exercises,setExercises]=useState([]);
  const [elapsed,setElapsed]=useState(0);

  const restRef = useRef(null);
  const [timerKey, setTimerKey] = useState(0);
  const [restSec, setRestSec] = useState('90');
  const [restRemain, setRestRemain] = useState(90);
  const rfmt = (s)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const [startedAt,setStartedAt]=useState(Date.now());
  const [pickerOpen,setPickerOpen]=useState(false);
  const [pickerMode,setPickerMode]=useState('add');
  const [pickerTarget,setPickerTarget]=useState(-1);

  const [editorVisible,setEditorVisible]=useState(false);
  const [editorTargetIndex,setEditorTargetIndex]=useState(-1);

  const timerRef=useRef(null);
  const lastTickRef=useRef(Date.now());
  const histCacheRef = useRef({}); // { [normName]: { version: number, ts: number, value: { maxVol, maxOne } } }
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL so small timing delays won't drop cache immediately
  // Invalidate cache when the current user changes to avoid stale/incorrect attribution
  useEffect(() => {
    histCacheRef.current = {};
  }, [settings?.id]);

  const [checkAnims, setCheckAnims] = useState([]); // Animated.Value instances
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(()=>{
    setCheckAnims(prev=>{
      return exercises.map((ex, i) =>
        (ex.sets||[]).map((s, j) => {
          return (prev[i] && prev[i][j]) ? prev[i][j] : new Animated.Value(0);
        })
      );
    });
  }, [exercises.length, exercises.map?.(ex => ex.sets.length).join('|')]);

  // local loader that supports:
  // - route.params.programId (load from in-memory DataContext programs)
  // - active program for current user via ProgramStore.getNextSummary(settings?.id)
  async function loadProgramDayLocal({ programId, week, day }) {
    // prefer explicit programId coming from Programs screen (in-app programs store)
    if (programId && data?.programs?.length) {
      const prog = data.programs.find(p => String(p.id) === String(programId));
      if (!prog) return { name: '', items: [] };
      const w = String(week || 1), d = String(day || 1);
      const dayArr = (((prog.plan || {})[w] || {})[d]) || prog.exercises || [];
      const items = (dayArr || []).map(ex => {
        const sets = Array.isArray(ex.sets) && ex.sets.length ? ex.sets : (Array.isArray(prog.defaultSets) ? prog.defaultSets : [{ weight: '', reps: '', rpe: 7 }]);
        return {
          name: ex.name || ex.exercise || 'Exercise',
          sets: sets.map(s => ({ weight: String(s.weight ?? ''), reps: String(s.reps ?? ''), rpe: Number(s.rpe || 7), done: false, pr: false }))
        };
      });
      return { name: prog.name || '', items };
    }

    // fallback: ask ProgramStore for the current user's next-up summary
    try {
      const next = await getNextSummary(settings?.id);
      if (!next) return { name: '', items: [] };
      const exercisesArr = (next.plan?.exercises || []);
      const items = exercisesArr.map(ex => {
        const sets = Array.isArray(ex.sets) && ex.sets.length ? ex.sets : [{ weight: '', reps: '', rpe: 7 }];
        return {
          name: ex.name || ex.exercise || 'Exercise',
          sets: sets.map(s => ({ weight: String(s.weight ?? ''), reps: String(s.reps ?? ''), rpe: Number(s.rpe || 7), done: false, pr: false }))
        };
      });
      return { name: next.programName || '', items };
    } catch (e) {
      return { name: '', items: [] };
    }
  }

  useEffect(()=>{
    let mounted=true;
    (async()=>{
      const p=route?.params||{};
      // try route params first; otherwise load per-user active program
      const a = {}; // placeholder
      let programId = p.programId || null;
      let programName = p.programName || '';
      let week = Number(p.week || 1);
      let day = Number(p.day || 1);
      if (!programId) {
        // ask ProgramStore for current active/next for this user
        try {
          const next = await getNextSummary(settings?.id);
          if (next) {
            programId = next.programId || null;
            programName = next.programName || programName;
            week = Number(p.week || next.week || 1);
            day = Number(p.day || next.day || 1);
          }
        } catch (e) {}
      }
      setProgramMeta({ programId, programName, week, day });
      const loaded = await loadProgramDayLocal({ programId, week, day });
      if (mounted) setExercises(loaded.items || []);
      setElapsed(0);
      setStartedAt(Date.now());
      lastTickRef.current=Date.now();
    })();
    return ()=>{mounted=false}
  },[route?.params?.programId,route?.params?.week,route?.params?.day, data, settings?.id]);

  useEffect(()=>{
    if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null}
    const tick = () => {
      const now = Date.now();
      const dt = (now - (lastTickRef.current || now)) / 1000;
      lastTickRef.current = now;
      setElapsed(prev => Math.max(0, prev + dt));
    };
    tick();
    timerRef.current = setInterval(tick, 500);
    return ()=>{ if(timerRef.current) clearInterval(timerRef.current); timerRef.current=null };
  },[startedAt]);

  function toggleSetDone(i, j) {
    const wasDone = !!exercises[i]?.sets?.[j]?.done;
    const curr = exercises[i]?.sets?.[j] || {};
    const weightNum = Number(curr.weight) || 0;
    const repsNum = Number(curr.reps) || 0;
    const setVol = weightNum * repsNum;
    const estOneRm = weightNum * (1 + (repsNum / 30)); // Epley

    // debug: surface the toggle attempt immediately
    console.log('[PRDebug] toggleSetDone start', { i, j, wasDone, weightNum, repsNum, setVol, estOneRm, exerciseName: exercises[i]?.name });

    // get the animated value for this set (may be undefined if not initialized yet)
    const animVal = (checkAnims[i] && checkAnims[i][j]) ? checkAnims[i][j] : null;

    // toggle done immediately (preserve existing pr until recalculated)
    setExercises(prev => {
      const next = prev.map((ex, idx) => (idx === i ? { ...ex } : { ...ex }));
      const ex = next[i];
      ex.sets = ex.sets.map((s, k) => (k === j ? { ...s, done: !s.done } : s));
      return next;
    });

    if (wasDone) {
      // user just unchecked -> clear any PR flag + animation immediately
      setExercises(prev => {
        const next = prev.map((ex, idx) => (idx === i ? { ...ex } : { ...ex }));
        next[i].sets = next[i].sets.map((s,k) => k===j ? { ...s, pr:false } : s);
        return next;
      });
      if (animVal) animVal.setValue(0);
      return;
    }

    // user just checked the set -> start rest timer
    const headerSeconds = Number(restSec || 0);
    const duration = headerSeconds > 0 ? headerSeconds : 90;
    restRef.current?.start(duration);

    (async () => {
      try{
        const exName = exercises[i]?.name || '';
        const { maxVol: histVol, maxOne: histOne } = await getHistoricalMaxsForExercise(exName);
        console.log('[PRDebug] historical maxs', { exName, histVol, histOne });
        // include done sets from current workout (same exercise) when calculating prior maxs
        let curMaxVol = 0, curMaxOne = 0;
        for (const ex of exercises) {
          if (String(ex.name).trim().toLowerCase() !== String(exName).trim().toLowerCase()) continue;
          for (const s of (ex.sets || [])) {
            if (!s?.done) continue;
            const w = Number(s.weight) || 0;
            const r = Number(s.reps) || 0;
            const vol = w * r;
            const one = w * (1 + (r / 30));
            if (vol > curMaxVol) curMaxVol = vol;
            if (one > curMaxOne) curMaxOne = one;
          }
        }
        const priorMaxVol = Math.max(histVol || 0, curMaxVol);
        const priorMaxOne = Math.max(histOne || 0, curMaxOne);

        const isVolPr = setVol > priorMaxVol;
        const isOnePr = estOneRm > priorMaxOne;
        // debug: report comparison that leads to PR decision
        console.log('[PRDebug] setChecked', { exIndex:i, setIndex:j, exName, setVol, estOneRm, histVol, histOne, curMaxVol, curMaxOne, priorMaxVol, priorMaxOne, isVolPr, isOnePr });
        const isPr = !!(isVolPr || isOnePr);

        // persist PR flag on the set so UI and final summary reflect it
        setExercises(prev => {
          const next = prev.map((ex, idx) => (idx === i ? { ...ex } : { ...ex }));
          next[i].sets = next[i].sets.map((s, k) => k === j ? { ...s, pr: isPr } : s);
          return next;
        });

        if (isPr) {
          animatePr(i, j);
        } else {
          if (animVal) animVal.setValue(0);
        }
      }catch(e){}
    })();
  }

  function updateSet(i,j,patch){
    setExercises(prev=>{
      const next=prev.map((ex,idx)=> idx===i?{...ex}:{...ex});
      const ex=next[i];
      ex.sets=ex.sets.map((s,k)=> k===j?{...s,...patch}:s);
      return next;
    })
  }

  function addSet(i){
    setExercises(prev=>{
      const next=prev.map(ex=>({...ex}));
      next[i].sets=[...next[i].sets,{weight:'',reps:'',rpe:7,done:false,pr:false}];
      return next;
    })
  }

function removeSet(i, j){
  setExercises(prev => prev.map((ex, idx) => {
    if (idx !== i) return ex;
    const nextSets = ex.sets.filter((_, k) => k !== j);
    return { ...ex, sets: nextSets.length ? nextSets : [{ weight:'', reps:'', rpe:7, done:false, pr:false }] };
  }));
}

  function removeExercise(i){
    setExercises(prev=>prev.filter((_,idx)=>idx!==i));
  }

  function openAdd(){setPickerMode('add');setPickerTarget(-1);setPickerOpen(true);}
  function openSwap(i){setPickerMode('swap');setPickerTarget(i);setPickerOpen(true);}

  function openMenu(i){
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Swap exercise','Create new','Cancel'], cancelButtonIndex: 2 },
      (idx)=>{
        if(idx===0){ openSwap(i); }
        else if(idx===1){ setEditorTargetIndex(i); setEditorVisible(true); }
      }
    );
  }

  function onConfirm(list){
    if(pickerMode==='add'){
      if(!Array.isArray(list)||!list.length){setPickerOpen(false);return}
      setExercises(prev=>{
        const mapped=list.map(x=>({name:x.name||'Exercise',sets:[{weight:'',reps:'',rpe:7,done:false,pr:false}]}));
        return [...prev,...mapped];
      });
    }else{
      const first=Array.isArray(list)&&list.length?list[0]:null;
      if(first && pickerTarget>=0){
        setExercises(prev=>{
          const next=prev.map((ex,idx)=>idx===pickerTarget?{...ex,name:first.name||'Exercise'}:ex);
          return next;
        });
      }
    }
    setPickerOpen(false);
  }

  async function advancePointer(){
    try{ await advanceAfterWorkout(settings?.id); }catch(e){}
  }

  async function finish(){
    const started = startedAt;
    const ended = Date.now();
    let totalSets=0, totalReps=0, totalVolume=0;
    const exSummary = exercises.map(ex=>{
      let sets = 0, reps = 0, volume = 0;
      for(const s of (ex.sets||[])){
        sets += 1;
        const w = Number(s.weight)||0;
        const r = Number(s.reps)||0;
        reps += r;
        volume += w * r;
      }
      totalSets += sets;
      totalReps += reps;
      totalVolume += volume;
      return { name: ex.name, sets, reps, volume, rawSets: Array.isArray(ex.sets) ? ex.sets : [] };
    });

    // derive PR flags directly from set.pr (calculated when sets were checked)
    const perExHasPr = exercises.map(ex => (ex.sets || []).some(s => !!s.pr));
    const hasPr = perExHasPr.some(Boolean);

    // simple calories estimate
    const calories = Math.max(1, Math.round(totalVolume * 0.02 + totalReps * 0.12));

    // build summary.exercises with per-ex hasPr
    const summaryExercises = exSummary.map((e, i) => ({
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      volume: e.volume,
      hasPr: !!perExHasPr[i]
    }));

    const summary = {
      programId:programMeta.programId, programName:programMeta.programName,
      week:programMeta.week, day:programMeta.day,
      startedAt: started, endedAt: ended, durationSec: Math.round(elapsed),
      exercises: summaryExercises,
      rawExercises: exercises,
      totalSets, totalReps, totalVolume, calories,
      hasPr,
      // attach a compact snapshot of current user/settings for later reference
      user: {
        id: settings?.id || null,
        name: settings?.name || '',
        email: settings?.email || '',
        units: settings?.units || 'lb',
        weightKg: settings?.weightKg ?? null,
        heightCm: settings?.heightCm ?? null,
        bodyFatPct: settings?.bodyFatPct ?? null,
        age: settings?.age ?? null,
        profileImageUri: settings?.profileImageUri || ''
      },
      dateISO: new Date(ended).toISOString()
    };

    // debug: show final summary PR flags and totals
    console.log('[PRDebug] finish summary', { programMeta, totalSets, totalReps, totalVolume, hasPr, perExHasPr, summaryExercises });

    try{
      await appendWorkoutSession(summary);
    }catch(e){}

    setSummaryData(summary);
    setSummaryVisible(true);
  }

  function onSummaryClose(){
    setSummaryVisible(false);
    setElapsed(0);
    setExercises([]);
    setRestRemain(0);
    setTimerKey(k=>k+1);
    if (restRef?.current?.reset) restRef.current.reset();
    Alert.alert('Great job','You finished your workout!');
    nav.goBack();
  }

  const header = useMemo(() => (
    <View style={[styles.header, { paddingTop: top + 8 }]}>
      <Text style={styles.clock}>{fmt(elapsed)}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          keyboardType="number-pad"
          value={restSec}
          onChangeText={(t) => setRestSec(t.replace(/[^0-9]/g, '').slice(0, 4))}
          placeholder="sec"
          placeholderTextColor="#8C8C96"
          style={{width: 64,textAlign: 'center',color: '#EDEDED',backgroundColor: '#1F1F28',borderWidth: 1,borderColor: '#2C2C36',borderRadius: 12,paddingVertical: 6,paddingHorizontal: 8}}
        />
        <Text style={[styles.hBtnText, { color: '#EDEDED' }]}>{rfmt(restRemain)}</Text>
        <Pressable onPress={() => restRef.current?.start(Number(restSec || 0))} style={[styles.hBtn, { backgroundColor: '#1F1F28' }]}>
          <Text style={styles.hBtnText}>Start</Text>
        </Pressable>
        <Pressable onPress={finish} style={[styles.hBtn, { backgroundColor: theme.accent }]}>
          <Text style={[styles.hBtnText, { color: '#fff' }]}>Finish</Text>
        </Pressable>
      </View>
    </View>
  ), [elapsed, finish, restSec, restRemain, top]);

  function onEditorSaved(newEx){
    if(!newEx||!newEx.name){ setEditorVisible(false); return; }
    try{ addExercise(newEx); }catch(e){}
    setExercises(prev=>prev.map((ex,k)=> k===editorTargetIndex ? { ...ex, name: newEx.name } : ex));
    setEditorVisible(false);
  }

  return(
    <View style={styles.wrap}>
      {header}
      <ScrollView contentContainerStyle={{paddingBottom:24+bottom}}>
        {exercises.map((ex,i)=>(
          <Swipeable
            key={i}
            renderRightActions={() => (
              <View style={{ width: 96, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2b0f14', borderRadius: 14, marginRight: 12 }}>
                <Pressable onPress={() => removeExercise(i)} style={{ backgroundColor: '#c0392b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Delete</Text>
                </Pressable>
              </View>
            )}
            overshootRight={false}
            rightThreshold={40}
          >
            <View style={styles.card}>
              <View style={styles.exHeader}>
                <Text style={styles.exTitle} numberOfLines={1}>{ex.name}</Text>
                <Pressable onPress={()=>openMenu(i)} style={styles.menuDot}><Text style={{color:'#CFCFF5',fontSize:18}}>⋯</Text></Pressable>
              </View>
              <View style={styles.tableHeader}>
                <Text style={[styles.th,{flex:0.7}]}>Set</Text>
                <Text style={styles.th}>Prev</Text>
                <View style={styles.colLbs}><Text style={styles.headerLabel}>LBS</Text></View>
                <View style={styles.colReps}><Text style={styles.headerLabel}>REPS</Text></View>
                <Text style={[styles.th,{width:40,textAlign:'center'}]}>✓</Text>
              </View>
              {ex.sets.map((s,j)=>(
                <Swipeable
                  key={j}
                  renderRightActions={() => (
                    <View style={{width:96,justifyContent:'center',alignItems:'center',backgroundColor:'#2b0f14',borderRadius:14,marginRight:12}}>
                      <Pressable onPress={()=>removeSet(i,j)} style={{backgroundColor:'#c0392b',paddingHorizontal:16,paddingVertical:10,borderRadius:12}}>
                        <Text style={{color:'#fff',fontWeight:'800'}}>Delete</Text>
                      </Pressable>
                    </View>
                  )}
                  overshootRight={false}
                  rightThreshold={40}
                >
                  <View style={styles.row}>
                    <Text style={[styles.cell,{flex:0.7}]}>{j+1}</Text>
                    <Text style={[styles.cell,{color:theme.textDim}]}>—</Text>
                    <View style={styles.colLbs}>
                      <TextInput
                        value={s.weight}
                        onChangeText={t=>updateSet(i,j,{weight:t})}
                        keyboardType="number-pad"
                        placeholder="lbs"
                        placeholderTextColor="#6A6A75"
                        style={[styles.input,styles.inputFill,s.done&&styles.doneInput]}
                      />
                    </View>
                    <View style={styles.colReps}>
                      <TextInput
                        value={s.reps}
                        onChangeText={t=>updateSet(i,j,{reps:t})}
                        keyboardType="number-pad"
                        placeholder="reps"
                        placeholderTextColor="#6A6A75"
                        style={[styles.input,styles.inputFill,s.done&&styles.doneInput]}
                      />
                    </View>
                    {(() => {
                      const anim = (checkAnims[i] && checkAnims[i][j]) ? checkAnims[i][j] : new Animated.Value(0);
                      // when s.done is true and anim === 0 we want the bright-accent (blue).
                      // when anim === 1 we want gold for PR (with glow).
                      const baseBg = s.done ? theme.accent : 'transparent';
                      const baseBorder = s.done ? theme.accent : '#3A3A45';
                      const baseMark = s.done ? theme.text : '#3A3A45';
                      const bgColor = anim.interpolate({ inputRange:[0,1], outputRange:[baseBg,'#FFD700'] });
                      const borderColor = anim.interpolate({ inputRange:[0,1], outputRange:[baseBorder,'#FFD700'] });
                      const scale = anim.interpolate({ inputRange:[0,1], outputRange:[1,1.12] });
                      const markColor = anim.interpolate({ inputRange:[0,1], outputRange:[baseMark,'#1a1a1a'] });
                      // glow values for PR: shadow/elevation animate from 0 -> visible
                      const shadowRadius = anim.interpolate({ inputRange:[0,1], outputRange:[0,8] });
                      const shadowOpacity = anim.interpolate({ inputRange:[0,1], outputRange:[0,0.95] });
                      const elevationVal = anim.interpolate({ inputRange:[0,1], outputRange:[0,6] });

                      return (
                        <Animated.View
                          style={[
                            styles.check,
                            {
                              backgroundColor: bgColor,
                              borderColor,
                              transform: [{ scale }],
                              shadowColor: '#FFD700',
                              shadowOffset: { width: 0, height: 0 },
                              shadowRadius: shadowRadius,
                              shadowOpacity: shadowOpacity,
                              elevation: elevationVal
                            }
                          ]}
                        >
                          <Pressable onPress={()=>toggleSetDone(i,j)} style={{flex:1,alignItems:'center',justifyContent:'center'}}>
                            <Animated.Text style={[styles.checkMark, { color: markColor }]}>✓</Animated.Text>
                          </Pressable>
                        </Animated.View>
                      );
                    })()}
                  </View>
                </Swipeable>
              ))}
              <Pressable onPress={()=>addSet(i)} style={styles.addSet}><Text style={styles.addSetText}>+ Add Set</Text></Pressable>
            </View>
          </Swipeable>
        ))}
        <Pressable onPress={openAdd} style={styles.addExercise}><Text style={styles.addExerciseText}>+ Add Exercise</Text></Pressable>
      </ScrollView>
      <ExercisePicker visible={pickerOpen} onClose={()=>setPickerOpen(false)} onConfirm={onConfirm} multi={pickerMode==='add'}/>
      <ExerciseEditor visible={editorVisible} onClose={()=>setEditorVisible(false)} onSaved={onEditorSaved} />
      <RestSquareTimer key={timerKey} ref={restRef} initialSeconds={Number(restSec || 0) || 90} color="#1e90ff" thickness={4} margin={6} showText={false} onTick={setRestRemain} visible/>
      <SummaryModal visible={summaryVisible} onClose={onSummaryClose} summary={summaryData} />
    </View>
  )
}

const styles=StyleSheet.create({
  wrap:{flex:1,backgroundColor:theme.bg},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingBottom:8,backgroundColor:theme.bg},
  clock:{color:'#fff',fontSize:28,fontWeight:'700'},
  hBtn:{paddingHorizontal:14,paddingVertical:10,borderRadius:12,backgroundColor:'#1F1F28'},
  hBtnText:{color:'#EDEDED',fontWeight:'700'},
  card:{backgroundColor:theme.card,marginHorizontal:12,marginTop:12,borderRadius:14,padding:12},
  exHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:6},
  exTitle:{color:'#CFCFF5',fontSize:16,fontWeight:'700'},
  menuDot:{width:32,height:32,alignItems:'center',justifyContent:'center',borderRadius:8,backgroundColor:'#23232B'},
  tableHeader:{flexDirection:'row',paddingVertical:6,borderBottomWidth:1,borderBottomColor:theme.border},
  th:{flex:1,color:'#8C8C96',fontSize:12,textTransform:'uppercase',letterSpacing:0.5},
  headerLabel:{width:'100%',textAlign:'right',fontSize:12,opacity:0.7,color:'#8C8C96'},
  colLbs:{width:68,marginHorizontal:4},
  colReps:{width:68,marginHorizontal:4},
  row:{flexDirection:'row',alignItems:'center',paddingVertical:8,borderBottomWidth:1,borderBottomColor:theme.border,paddingRight:6},
  cell:{flex:1,color:'#EDEDED'},
  input:{color:'#fff',borderWidth:1,borderColor:'#2C2C36',borderRadius:10,paddingVertical:6,paddingHorizontal:4,marginHorizontal:4,textAlign:'center',fontSize:14},
  inputFill:{width:'100%'},
  weightInput:{width:60},
  repsInput:{width:60},
  doneInput:{borderColor:theme.accent,backgroundColor:'#101a33'},
  check:{height:30,width:30,borderRadius:8,borderWidth:2,borderColor:'#3A3A45',alignItems:'center',justifyContent:'center',marginLeft:8},
  checkOn:{borderColor:theme.accent,backgroundColor:'#101a33'},
  checkMark:{color:'#3A3A45',fontWeight:'900'},
  checkMarkOn:{color:theme.accent},
  addSet:{marginTop:8,alignSelf:'flex-start',paddingVertical:6,paddingHorizontal:12,borderRadius:10,backgroundColor:'#20202A'},
  addSetText:{color:'#B8B8C7',fontWeight:'600'},
  addExercise:{marginTop:16,alignSelf:'center',backgroundColor:theme.accent,paddingHorizontal:18,paddingVertical:12,borderRadius:12,marginBottom:12},
  addExerciseText:{color:'#fff',fontWeight:'800'}
});

export default function StableWorkout(props){
  return(<GestureHandlerRootView style={{flex:1}}><StableWorkoutInner {...props}/></GestureHandlerRootView>);
}
