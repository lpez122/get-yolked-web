// removed direct AsyncStorage writes to legacy history; persistence delegated to SessionContext
import React, { useEffect } from 'react';
import { Animated, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { theme } from '../constants/theme';
import Confetti from './Confetti';
import ExerciseOptionsModal from './ExerciseOptionsModal';
import ExercisePickerModal from './ExercisePickerModal';
import RestSquareTimer from './RestSquareTimer';
import SummaryModal from './SummaryModal';

// ...existing code...

function WorkoutView({ onFinish }) {

  const toggleDone = (ei, si) => {
    // read current row values before toggling
    const cur = exercises[ei]?.rows?.[si] || {};
    const weightNum = Number(cur.weight) || 0;
    const repsNum = Number(cur.reps) || 0;
    const setVol = weightNum * repsNum;
    const estOneRm = weightNum * (1 + (repsNum / 30)); // Epley

    // debug: immediate info about toggle
    console.log('[PRDebug] toggleDone start', { ei, si, weightNum, repsNum, setVol, estOneRm, exerciseName: exercises[ei]?.name });

    const exerciseName = exercises[ei]?.name || '';
    // compute current-session maxs for this exercise from already-done sets (exclude current set)
    let curMaxVol = 0, curMaxOne = 0;
    for (const ex of exercises) {
      if (String(ex.name).trim().toLowerCase() !== String(exerciseName).trim().toLowerCase()) continue;
      for (const r of (ex.rows || [])) {
        if (!r.done) continue;
        const w = Number(r.weight) || 0;
        const rep = Number(r.reps) || 0;
        const vol = w * rep;
        const one = w * (1 + (rep / 30));
        if (vol > curMaxVol) curMaxVol = vol;
        if (one > curMaxOne) curMaxOne = one;
      }
    }

    setExercises(xs => {
       const c = xs.slice();
       const r = { ...c[ei].rows[si] };
       const newDone = !r.done;
       r.done = newDone;
       c[ei].rows[si] = r;
 
       if (newDone) {
         const perExerciseRest = Number(c[ei]?.restSec ?? 0);
         const headerSeconds = Number(restSec || 0);
         const duration = perExerciseRest > 0 ? perExerciseRest : (headerSeconds > 0 ? headerSeconds : 90);
         restRef.current?.start(duration);
       }
 
       // after state update, check historical PRs and animate if needed
       if (!cur.done) {
         (async()=>{
           try{
            const { maxVol: histVol, maxOne: histOne } = await getHistoricalMaxsForExercise(exerciseName);
            console.log('[PRDebug] historical maxs', { exerciseName, histVol, histOne });
            const priorMaxVol = Math.max(histVol || 0, curMaxVol);
            const priorMaxOne = Math.max(histOne || 0, curMaxOne);
            const isVolPr = setVol > priorMaxVol;
            const isOnePr = estOneRm > priorMaxOne;
            const isPr = !!(isVolPr || isOnePr);
            console.log('[PRDebug] setChecked', { ei, si, exerciseName, setVol, estOneRm, histVol, histOne, curMaxVol, curMaxOne, priorMaxVol, priorMaxOne, isVolPr, isOnePr });
            // persist PR flag
            setExercises(prev => {
              const next = prev.slice();
              if (next[ei] && next[ei].rows && next[ei].rows[si]) {
                next[ei].rows[si] = { ...next[ei].rows[si], pr: isPr };
              }
              return next;
            });
            if (isPr) animatePr(ei, si); else {
              const v = (checkAnims[ei] && checkAnims[ei][si]) ? checkAnims[ei][si] : null;
              if (v) v.setValue(0);
            }
           }catch(e){}
         })();
       }
 
       return c;
     });
   };

  const updateCell=(ei,si,key,val)=>{
    setExercises(xs=>{
      const c=xs.slice();
      const r={...c[ei].rows[si],[key]:val};
      c[ei].rows[si]=r;
      return c;
    });
  };
  const addSet=(ei)=>{
    setExercises(xs=>{
      const c=xs.slice();
      const last=c[ei].rows[c[ei].rows.length-1]||{weight:'',reps:'',rpe:7,prevLabel:'—'};
      c[ei].rows.push({set:c[ei].rows.length+1,weight:last.weight,reps:last.reps,rpe:last.rpe,done:false,pr:false,prevLabel:last.prevLabel});
      return c;
    });
  };
  const openOptions=(ei)=>{setOptIndex(ei);};
  const closeOptions=()=>{setOptIndex(-1);};
  const setRestFor=(sec)=>{
    if(optIndex<0)return;
    setExercises(xs=>{
      const c=xs.slice();
      c[optIndex]={...c[optIndex],restSec:sec};
      return c;
    });
  };
  const beginSwap=()=>{setPickerVisible(true);};
  const onPickExercise=(name)=>{
    if(optIndex<0)return;
    setExercises(xs=>{
      const c=xs.slice();
      c[optIndex]={...c[optIndex],name};
      return c;
    });
  };
  const onFinishPress=()=>{
    const flatSets=[];
    const outExercises=exercises.map(ex=>({
      name:ex.name,
      sets:ex.rows.map(r=>{
        const one={weight:Number(r.weight||0),reps:Number(r.reps||0),rpe:Number(r.rpe||0),done:!!r.done};
        if(one.done)flatSets.push({exercise:ex.name,...one});
        return one;
      })
    }));

    // compute totals
    let totalSets=0,totalReps=0,totalVolume=0;
    const exSummary = outExercises.map(ex=>{
      const sets = ex.sets.length;
      let reps=0, volume=0;
      for(const s of ex.sets){ reps += Number(s.reps||0); volume += (Number(s.weight||0) * Number(s.reps||0)) }
      totalSets += sets; totalReps += reps; totalVolume += volume;
      return { name: ex.name, sets, reps, volume, rawSets: Array.isArray(ex.sets) ? ex.sets : [] };
    });
    const calories = Math.max(1, Math.round(totalVolume * 0.02 + totalReps * 0.12));

    // compute whether any set is a PR
    (async()=>{
      let hasPr = false;
      const perExHasPr = [];
      try{
        for(const ex of outExercises){
          // prefer using per-row pr flags computed during the session
          const localEx = exercises.find(x => String(x.name).trim().toLowerCase() === String(ex.name).trim().toLowerCase());
          const exPr = !!(localEx && (localEx.rows || []).some(r => !!r.pr));
          perExHasPr.push(!!exPr);
          if (exPr) hasPr = true;
        }
      }catch(e){}

      const summaryExercises = exSummary.map((e,i)=>({
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        volume: e.volume,
        hasPr: !!perExHasPr[i]
      }));

      const summary = {
        dateISO: new Date().toISOString(),
        exercises: outExercises, // preserve raw per-set rows
        totalSets, totalReps, totalVolume, calories, durationSec: elapsed, hasPr,
        // snapshot of user/settings at time of workout (include id)
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
        }
      };
      // debug: summary & PR info
      console.log('[PRDebug] onFinish summary', { totalSets, totalReps, totalVolume, hasPr, perExHasPr, summaryExercises });

      // delegate persistence to the session/history pipeline (ensures user snapshot)
      try{
        if (typeof onFinish === 'function') {
          // parent/onFinish is expected to call SessionContext.endSession / HistoryStore.append
          await onFinish(summary);
        }
      }catch(e){}

      // show modal
      setSummaryData(summary);
      setSummaryVisible(true);
    })();
  };

  function onSummaryCloseWV(){
    setSummaryVisible(false);
    setCelebrate(true);
    setTimeout(()=>setCelebrate(false),1200);
    onFinish&&onFinish(summaryData);
  }

  // if a history cache is present in this component, invalidate it when the user changes
  useEffect(() => {
    if (histCacheRef && histCacheRef.current) histCacheRef.current = {};
  }, [settings?.id]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* measure the header height so the border starts below it */}
      <View onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
        <Header
          elapsedSec={elapsed}
          onFinish={onFinishPress}
          dateISO={dateISO}
          setDateISO={setDateISO}
          notes={notes}
          setNotes={setNotes}
          restRef={restRef}
          restSec={restSec}
          setRestSec={setRestSec}
          restRemain={restRemain}
        />
      </View>
  
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {exercises.map((ex, ei) => (
          <View key={ei} style={{ backgroundColor: theme.card, borderRadius: 12, paddingBottom: 12 }}>
            <View style={{ padding: 12 }}>
              <Text style={{ color: theme.accent, fontSize: 16, fontWeight: '700' }}>
                {ei + 1} {ex.name} ›
              </Text>
              <View style={{ height: 8 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>                {/* replaced missing RestTimer component with RestSquareTimer (already imported) */}
                <RestSquareTimer
                  initialSeconds={Number(ex.restSec || 90)}
                  color="#999"
                  thickness={3}
                  margin={0}
                  showText={false}
                  visible={false}
                  onTick={()=>{}}
                />
                <Pressable
                  onPress={() => openOptions(ei)}
                  style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: theme.surface, borderRadius: 8 }}
                >
                  <Text style={{ color: theme.text }}>⋯</Text>
                </Pressable>
              </View>
            </View>
  
            <HeaderRow/>
  
            {ex.rows.map((r, si) => (
              <View
                key={si}
                style={{ flexDirection:'row', alignItems:'center', paddingVertical:6, paddingHorizontal:12, paddingRight:6, gap:8 }}
              >
                <Text style={{ flex:1, color:theme.text, textAlign:'center' }}>{r.set}</Text>
                <Text style={{ flex:2, color:theme.muted }}>{r.prevLabel}</Text>
                <TextInput
                  keyboardType="numeric"
                  value={r.weight === 0 ? '' : String(r.weight ?? '')}
                  onChangeText={(t)=>updateCell(ei,si,'weight', t===''? null : Number(t))}
                  placeholder="lbs"
                  placeholderTextColor="#6A6A75"
                  style={{
                    width:50,
                    flexShrink:0,
                    backgroundColor:theme.card,
                    borderWidth:1,
                    borderColor:theme.border,
                    color:theme.text,
                    paddingVertical:4,
                    borderRadius:8,
                    textAlign:'center',
                    fontSize:14
                  }}
                />
                <TextInput
                  keyboardType="numeric"
                  value={r.reps === 0 ? '' : String(r.reps ?? '')}
                  onChangeText={(t)=>updateCell(ei,si,'reps', t===''? null : Number(t))}
                  placeholder="reps"
                  placeholderTextColor="#6A6A75"
                  style={{
                    width:50,
                    flexShrink:0,
                    backgroundColor:theme.card,
                    borderWidth:1,
                    borderColor:theme.border,
                    color:theme.text,
                    paddingVertical:4,
                    borderRadius:8,
                    textAlign:'center',
                    fontSize:14
                  }}
                />
                {(() => {
                  const anim = (checkAnims[ei] && checkAnims[ei][si]) ? checkAnims[ei][si] : new Animated.Value(0);
                  const baseBg = r.done ? theme.accent : 'transparent';
                  const baseBorder = r.done ? theme.accent : theme.muted || '#3A3A45';
                  const baseMark = r.done ? theme.text : '#3A3A45';
                  const bgColor = anim.interpolate({ inputRange:[0,1], outputRange:[baseBg,'#FFD700'] });
                  const borderColor = anim.interpolate({ inputRange:[0,1], outputRange:[baseBorder,'#FFD700'] });
                  const scale = anim.interpolate({ inputRange:[0,1], outputRange:[1,1.12] });
                  const markColor = anim.interpolate({ inputRange:[0,1], outputRange:[baseMark,'#1a1a1a'] });
                  const shadowRadius = anim.interpolate({ inputRange:[0,1], outputRange:[0,8] });
                  const shadowOpacity = anim.interpolate({ inputRange:[0,1], outputRange:[0,0.95] });
                  const elevationVal = anim.interpolate({ inputRange:[0,1], outputRange:[0,6] });
                  return (
                    <Animated.View
                      style={{
                        height:30,
                        width:30,
                        borderRadius:8,
                        borderWidth:2,
                        alignItems:'center',
                        justifyContent:'center',
                        backgroundColor: bgColor,
                        borderColor,
                        transform: [{ scale }],
                        marginLeft: 8, // move the checkbox box away from reps input
                        shadowColor: '#FFD700',
                        shadowOffset: { width: 0, height: 0 },
                        shadowRadius: shadowRadius,
                        shadowOpacity: shadowOpacity,
                        elevation: elevationVal
                      }}
                    >
                      <Pressable onPress={()=>toggleDone(ei,si)} style={{flex:1,alignItems:'center',justifyContent:'center'}}>
                        <Animated.Text style={{ color: markColor, fontWeight:'900' }}>✓</Animated.Text>
                      </Pressable>
                    </Animated.View>
                  );
                })()}
              </View>
            ))}
  
            <View style={{ paddingHorizontal: 12, paddingTop: 6 }}>
              <Pressable
                onPress={() => addSet(ei)}
                style={{ padding: 12, borderRadius: 10, backgroundColor: theme.surface, alignItems: 'center' }}
              >
                <Text style={{ color: theme.text, fontWeight: '600' }}>+ Add Set</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
  
      <ExerciseOptionsModal
        visible={optIndex >= 0}
        onClose={closeOptions}
        exerciseName={exercises[optIndex]?.name}
        restSec={exercises[optIndex]?.restSec || 90}
        onChangeRestSec={setRestFor}
        onSwap={beginSwap}
      />
  
      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onPick={onPickExercise}
      />
  
      {celebrate ? <Confetti count={80} origin={{ x: 0, y: 0 }} fadeOut autoStart /> : null}
  
      {/* Square border overlay LAST so it renders on top; start it below the header */}
      <RestSquareTimer
        ref={restRef}
        initialSeconds={Number(restSec || 0) || 90}
        color="#1e90ff"
        thickness={4}
        margin={6}
        showText={false}
        onTick={setRestRemain}
        visible
        topOffset={headerH}   // <-- requires: const [headerH, setHeaderH] = useState(0);
      />
      <SummaryModal visible={summaryVisible} onClose={onSummaryCloseWV} summary={summaryData} />
    </View>
  )
}

// explicit export to avoid trailing/implicit-export parsing issues
export default WorkoutView;