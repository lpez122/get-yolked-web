import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useData } from '../contexts/DataContext';
import WorkoutView from '../components/WorkoutView';
import QuickBuilder from '../components/QuickBuilder';

export default function HomeScreen() {
  const { data, addWorkout, updateWorkout } = useData();
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [nextProgramDayInfo, setNextProgramDayInfo] = useState(null);

  // refresh active workout and next program day whenever data changes
  useEffect(() => {
    // find active workout (started but not completed)
    const inProgress = data.workouts.find(w => w.startedAt && !w.completedAt);
    setActiveWorkout(inProgress || null);

    // compute next program day info
    if (data.currentProgramId) {
      const program = data.programs.find(p => p.id === data.currentProgramId);
      if (program && program.days && program.days.length > 0) {
        // sort days by dow ascending
        const sorted = [...program.days].sort((a, b) => a.dow - b.dow);
        // naive: pick the first day that is not completed; we don't track week here
        let nextDay = null;
        for (let d of sorted) {
          // check if there is a completed workout for this dow
          const done = data.workouts.find(w => w.programId === program.id && w.dow === d.dow && w.completedAt);
          if (!done) {
            nextDay = d;
            break;
          }
        }
        if (!nextDay) {
          nextDay = sorted[0];
        }
        setNextProgramDayInfo({ program, day: nextDay });
      } else {
        setNextProgramDayInfo(null);
      }
    } else {
      setNextProgramDayInfo(null);
    }
  }, [data]);

  const handleStartProgramDay = () => {
    if (!nextProgramDayInfo) return;
    const { program, day } = nextProgramDayInfo;
    // generate sets
    const sets = [];
    let setNumber = 1;
    day.exercises.forEach(item => {
      for (let i = 0; i < item.sets; i++) {
        sets.push({
          id: Math.random().toString(),
          exerciseId: item.exerciseId,
          setNumber: setNumber++,
          weight: 0,
          reps: 0,
          rpe: 0,
          restSec: item.restSec || 90,
          completed: false
        });
      }
    });
    const date = new Date().toISOString().slice(0, 10);
    const workout = {
      programId: program.id,
      date: date,
      week: null,
      dow: day.dow,
      sets,
      notes: '',
      startedAt: new Date().toISOString(),
      completedAt: null
    };
    addWorkout(workout);
    setActiveWorkout(workout);
  };

  const refreshActive = () => {
    const inProgress = data.workouts.find(w => w.startedAt && !w.completedAt);
    setActiveWorkout(inProgress || null);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16 }}>
      {/* Logo */}
      <Image source={require('../assets/get_yolked_logo.png')} style={styles.logo} />
      {activeWorkout ? (
        <WorkoutView workout={activeWorkout} />
      ) : (
        <View style={styles.section}>
          {nextProgramDayInfo ? (
            <View>
              <Text style={styles.heading}>Next Program Workout</Text>
              <Text style={styles.programText}>{nextProgramDayInfo.program.name} - Day {nextProgramDayInfo.day.dow}</Text>
              {nextProgramDayInfo.day.exercises.map((ex, idx) => {
                const exercise = data.exercises.find(e => e.id === ex.exerciseId);
                return (
                  <Text key={idx} style={styles.programDetail}>• {exercise ? exercise.name : 'Exercise'}: {ex.sets}×{ex.repsMin}-{ex.repsMax} reps (RPE {ex.targetRpe}, Rest {ex.restSec}s)</Text>
                );
              })}
              <TouchableOpacity style={styles.startButton} onPress={handleStartProgramDay}>
                <Text style={styles.startButtonText}>Start Workout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.heading}>No active program</Text>
          )}
        </View>
      )}
      {/* Quick builder always visible */}
      <QuickBuilder onStartQuickWorkout={refreshActive} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: '#0d1117',
    flex: 1
  },
  logo: {
    width: 200,
    height: 80,
    alignSelf: 'center',
    marginBottom: 16,
    resizeMode: 'contain'
  },
  section: {
    backgroundColor: '#0d1117',
    padding: 16,
    borderRadius: 8,
    borderColor: '#30363d',
    borderWidth: 1,
    marginBottom: 20
  },
  heading: {
    fontSize: 20,
    color: '#58a6ff',
    fontWeight: '600',
    marginBottom: 8
  },
  programText: {
    color: '#c9d1d9',
    marginBottom: 8
  },
  programDetail: {
    color: '#8b949e',
    marginLeft: 8,
    marginBottom: 4
  },
  startButton: {
    backgroundColor: '#238636',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12
  },
  startButtonText: {
    color: '#c9d1d9',
    fontWeight: '600'
  }
});
