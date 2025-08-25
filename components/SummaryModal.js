import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { theme } from '../constants/theme';

export default function SummaryModal({ visible, onClose, summary }) {
  const scale = useRef(new Animated.Value(0.96)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.loop(
      Animated.sequence([
        // use JS driver here (false) because we animate shadow/glow (JS-only) elsewhere
        Animated.timing(scale, { toValue: 1.06, duration: 700, useNativeDriver: false }),
        Animated.timing(scale, { toValue: 0.98, duration: 700, useNativeDriver: false })
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 700, useNativeDriver: false })
      ])
    ).start();
  }, [visible]);

  if (!summary) return null;

  const borderColor = glow.interpolate ? glow.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,215,0,0.0)', 'rgba(255,215,0,0.9)'] }) : '#FFD700';

  // summary.exercises may be either:
  // - numeric summaries: [{name, sets:number, reps:number, volume:number}, ...]
  // - raw rows: [{ name, sets: [ {weight,reps,...}, ... ], ... }, ...]
  const exercises = Array.isArray(summary.exercises) ? summary.exercises : [];
  // derive totals if not provided
  const totalSets = typeof summary.totalSets === 'number'
    ? summary.totalSets
    : exercises.reduce((acc, ex) => acc + (Array.isArray(ex.sets) ? ex.sets.length : (Number(ex.sets) || 0)), 0);
  const totalReps = typeof summary.totalReps === 'number'
    ? summary.totalReps
    : exercises.reduce((acc, ex) => {
        if (typeof ex.reps === 'number') return acc + ex.reps;
        if (Array.isArray(ex.sets)) return acc + ex.sets.reduce((a,s)=>a + (Number(s.reps)||0),0);
        return acc;
      }, 0);
  const totalVolume = typeof summary.totalVolume === 'number'
    ? summary.totalVolume
    : exercises.reduce((acc, ex) => {
        if (typeof ex.volume === 'number') return acc + ex.volume;
        if (Array.isArray(ex.sets)) return acc + ex.sets.reduce((a,s)=>a + ((Number(s.weight)||0)*(Number(s.reps)||0)),0);
        return acc;
      }, 0);
  const calories = typeof summary.calories === 'number' ? summary.calories : 0;
  const durationSec = summary.durationSec || 0;
  const dateISO = summary.dateISO || summary.startedAt || new Date().toISOString();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'center', alignItems:'center', padding:18 }}>
        <Animated.View style={{ width:'100%', maxWidth:560, backgroundColor:theme.card, borderRadius:14, padding:16, borderWidth:2, borderColor }}>
          <ScrollView contentContainerStyle={{ paddingBottom:12 }}>
            <View style={{ alignItems:'center', marginBottom:10 }}>
              <Text style={{ color:theme.text, fontSize:18, fontWeight:'800', marginTop:8 }}>Workout Summary</Text>
              {/* meta line slightly lighter gray */}
              <Text style={{ color:'#9aa', marginTop:6 }}>{new Date(dateISO || Date.now()).toLocaleString()} • {Math.round(durationSec||0)}s</Text>
            </View>

            <View style={{ flexDirection:'row', justifyContent:'space-between', marginVertical:8 }}>
              <View>
                <Text style={{ color:'#9aa' }}>Sets</Text>
                <Text style={{ color:theme.text, fontWeight:'700' }}>{String(totalSets)}</Text>
              </View>
              <View>
                <Text style={{ color:'#9aa' }}>Reps</Text>
                <Text style={{ color:theme.text, fontWeight:'700' }}>{String(totalReps)}</Text>
              </View>
              <View>
                <Text style={{ color:'#9aa' }}>Volume</Text>
                <Text style={{ color:theme.text, fontWeight:'700' }}>{String(totalVolume)}</Text>
              </View>
              <View>
                <Text style={{ color:'#9aa' }}>Calories</Text>
                <Text style={{ color:theme.text, fontWeight:'700' }}>{String(calories)}</Text>
              </View>
            </View>

            <View style={{ height:8 }} />
            <Text style={{ color:'#9aa', marginBottom:6 }}>Per-exercise</Text>
            {exercises.map((ex,idx)=>{
              const name = ex.name || ex.exercise || `Exercise ${idx+1}`;
              const setsCount = Array.isArray(ex.sets) ? ex.sets.length : (Number(ex.sets) || 0);
              const repsCount = (typeof ex.reps === 'number') ? ex.reps : (Array.isArray(ex.sets) ? ex.sets.reduce((a,s)=>a + (Number(s.reps)||0),0) : 0);
              const vol = (typeof ex.volume === 'number') ? ex.volume : (Array.isArray(ex.sets) ? ex.sets.reduce((a,s)=>a + ((Number(s.weight)||0)*(Number(s.reps)||0)),0) : 0);
              return (
                <View key={idx} style={{ paddingVertical:6, borderTopWidth: idx?1:0, borderTopColor:theme.border, flexDirection:'row',justifyContent:'space-between',alignItems:'center' }}>
                  <View style={{flex:1}}>
                    <Text style={{ color:theme.accent, fontWeight:'700' }}>{name}</Text>
                    <Text style={{ color:'#9aa' }}>{String(setsCount)} sets · {String(repsCount)} reps · {String(vol)} vol</Text>
                  </View>
                  {/* per-row PR badge: small gold pill with glow/scale (uses modal's glow & scale) */}
                  {ex.hasPr ? (
                    <Animated.View
                      style={{
                        marginLeft:12,
                        width:28,
                        height:28,
                        borderRadius:8,
                        backgroundColor:'#FFD700',
                        alignItems:'center',
                        justifyContent:'center',
                        transform:[{ scale }],
                        shadowColor:'#FFD700',
                        shadowOffset:{ width:0, height:0 },
                        shadowRadius: glow.interpolate ? glow.interpolate({ inputRange:[0,1], outputRange:[0,8] }) : 6,
                        shadowOpacity: glow.interpolate ? glow.interpolate({ inputRange:[0,1], outputRange:[0.0,0.95] }) : 0.9,
                        elevation: glow.interpolate ? glow.interpolate({ inputRange:[0,1], outputRange:[0,6] }) : 4
                      }}
                    >
                      <Text style={{ color:'#111', fontWeight:'800', fontSize:14 }}>✓</Text>
                    </Animated.View>
                  ) : null}
                </View>
              );
            })}

            <View style={{ height:12 }} />
            <Pressable onPress={onClose} style={{ backgroundColor:theme.accent, padding:12, borderRadius:10, alignItems:'center' }}>
              <Text style={{ color:'#fff', fontWeight:'800' }}>Close</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
