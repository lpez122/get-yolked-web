import React, { useEffect, useState } from 'react';
import DevErrorBoundary from '../components/DevErrorBoundary';
import { View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkoutSheet from '../components/WorkoutSheet';
import WorkoutView from '../components/WorkoutView';
import { useSession } from '../contexts/SessionContext';

export default function WorkoutScreen(){
  const nav = useNavigation();
  const route = useRoute();
  const { startSession, endSession } = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = route?.params || {};
        const mode = p.mode || 'empty';
        let plan = { exercises: [] };
        let programName = '';
        const week = Number(p.week || 1);
        const day  = Number(p.day  || 1);

        if (mode === 'program' && p.programId) {
          const raw = await AsyncStorage.getItem('saved_programs_v1');
          const list = JSON.parse(raw || '[]');
          const prog = list.find(x => x.id === p.programId);
          if (prog) {
            programName = prog.name || '';
            const ex = (((prog.plan || {})[week] || {})[day]) || [];
            const norm = ex.map(e => ({
              name: e.name,
              sets: typeof e.sets === 'number' ? e.sets : (Array.isArray(e.sets) ? e.sets.length : (e.targetSets ?? 3)),
              reps: typeof e.reps === 'number' ? e.reps : (e.targetReps ?? 10),
              restSec: typeof e.restSec === 'number' ? e.restSec : 90,
              weight: e.weight ?? e.targetWeight ?? ''
            }));
            plan = { exercises: norm };
          }
        }

        await startSession({ plan, programName, week, day, adHoc: !programName });
      } catch {}
      if (mounted) setReady(true);
    })();
    return () => { mounted = false; };
  }, [route, startSession]);

  useEffect(() => {
    global.__ROUTE__ = route;
    return () => { try { delete global.__ROUTE__; } catch {} };
  }, [route]);

  const handleFinish = async (finalize) => {
    try { await endSession(finalize); } catch {}
    nav.goBack();
  };

  if (!ready) return <View style={{flex:1}}/>;

  return (
    <View style={{flex:1}}>
      <DevErrorBoundary>
<WorkoutSheet visible onClose={() => nav.goBack()}>
        <WorkoutView onFinish={handleFinish} />
      </WorkoutSheet>
</DevErrorBoundary>
    </View>
  );
}
