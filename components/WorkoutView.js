import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useData, MUSCLE_GROUPS } from '../contexts/DataContext';
import ConfettiCannon from 'react-native-confetti-cannon';

export default function WorkoutView({ workout }) {
  const { data, updateWorkout, computeGlobalPrs, addDayTemplate } = useData();
  const [localWorkout, setLocalWorkout] = useState(workout);
  const [showConfetti, setShowConfetti] = useState(false);

  // Add exercise state
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [search, setSearch] = useState('');
  const [exerciseId, setExerciseId] = useState('');
  const [setsCount, setSetsCount] = useState('3');
  const [repsMin, setRepsMin] = useState('8');
  const [repsMax, setRepsMax] = useState('8');
  const [rpe, setRpe] = useState('8');
  const [restSec, setRestSec] = useState('90');

  useEffect(() => {
    setLocalWorkout(workout);
  }, [workout]);

  // handle update input fields for sets
  const handleSetChange = (setId, field, value) => {
    const updatedSets = localWorkout.sets.map(s => {
      if (s.id === setId) {
        return { ...s, [field]: value };
      }
      return s;
    });
    const updatedWorkout = { ...localWorkout, sets: updatedSets };
    setLocalWorkout(updatedWorkout);
    updateWorkout(updatedWorkout);
  };

  const toggleCompleted = (setId) => {
    const updatedSets = localWorkout.sets.map(s => {
      if (s.id === setId) {
        return { ...s, completed: !s.completed };
      }
      return s;
    });
    const updatedWorkout = { ...localWorkout, sets: updatedSets };
    setLocalWorkout(updatedWorkout);
    updateWorkout(updatedWorkout);
    // check for PR if this set toggled to completed and now completed
    const setObj = updatedSets.find(s => s.id === setId);
    if (setObj.completed) {
      checkForPR(setObj);
    }
  };

  const checkForPR = (setObj) => {
    const prs = computeGlobalPrs();
    const current = prs[setObj.exerciseId] || { maxWeight: 0, maxVolume: 0, maxOneRmEpley: 0, maxOneRmBrzycki: 0 };
    const weight = parseFloat(setObj.weight) || 0;
    const reps = parseFloat(setObj.reps) || 0;
    const volume = weight * reps;
    const oneE = weight * (1 + reps / 30);
    const oneB = reps >= 37 || reps === 0 ? 0 : weight * (36 / (37 - reps));
    if (weight > current.maxWeight || volume > current.maxVolume || oneE > current.maxOneRmEpley || oneB > current.maxOneRmBrzycki) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  // Add exercise to workout
  const filteredExercises = data.exercises.filter(ex => {
    const matchesMuscle = selectedMuscle ? (ex.primaryMuscles.includes(selectedMuscle) || ex.secondaryMuscles.includes(selectedMuscle)) : true;
    const matchesSearch = search ? ex.name.toLowerCase().includes(search.toLowerCase()) : true;
    return matchesMuscle && matchesSearch;
  });

  const onAddExercise = () => {
    if (!exerciseId) return;
    const exercise = data.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    const newSets = [];
    let maxSetNumber = 0;
    localWorkout.sets.forEach(s => { if (s.setNumber > maxSetNumber) maxSetNumber = s.setNumber; });
    for (let i = 0; i < (parseInt(setsCount) || 3); i++) {
      newSets.push({
        id: Math.random().toString(),
        exerciseId: exercise.id,
        setNumber: maxSetNumber + i + 1,
        weight: 0,
        reps: 0,
        rpe: 0,
        restSec: parseInt(restSec) || 90,
        completed: false
      });
    }
    const updatedWorkout = { ...localWorkout, sets: [...localWorkout.sets, ...newSets] };
    setLocalWorkout(updatedWorkout);
    updateWorkout(updatedWorkout);
    // reset
    setExerciseId('');
    setSetsCount('3');
    setRepsMin('8');
    setRepsMax('8');
    setRpe('8');
    setRestSec('90');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Active Workout</Text>
      <ScrollView style={{ maxHeight: 300 }}>
        {localWorkout.sets.map(s => {
          const exercise = data.exercises.find(e => e.id === s.exerciseId);
          return (
            <View key={s.id} style={styles.setRow}>
              <Text style={styles.setText}>{exercise ? exercise.name : 'Exercise'}</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(s.weight)}
                onChangeText={(text) => handleSetChange(s.id, 'weight', parseFloat(text) || 0)}
              />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(s.reps)}
                onChangeText={(text) => handleSetChange(s.id, 'reps', parseInt(text) || 0)}
              />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(s.rpe)}
                onChangeText={(text) => handleSetChange(s.id, 'rpe', parseFloat(text) || 0)}
              />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(s.restSec)}
                onChangeText={(text) => handleSetChange(s.id, 'restSec', parseInt(text) || 0)}
              />
              <TouchableOpacity onPress={() => toggleCompleted(s.id)} style={styles.checkbox}>
                {s.completed && <View style={styles.checkboxInner} />}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
      {showConfetti && <ConfettiCannon count={60} origin={{ x: 200, y: 0 }} fadeOut={true} />}
      {/* Add exercise section */}
      <View style={{ marginTop: 16 }}>
        <Text style={styles.heading}>Add Exercise to Workout</Text>
        <View style={styles.controlsRow}>
          <Text style={styles.label}>Muscle:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity onPress={() => setSelectedMuscle('')} style={[styles.muscleChip, selectedMuscle === '' && styles.muscleChipSelected]}><Text style={styles.muscleChipText}>All</Text></TouchableOpacity>
            {MUSCLE_GROUPS.map(muscle => (
              <TouchableOpacity key={muscle} onPress={() => setSelectedMuscle(muscle)} style={[styles.muscleChip, selectedMuscle === muscle && styles.muscleChipSelected]}>
                <Text style={styles.muscleChipText}>{muscle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Search exercises"
          placeholderTextColor="#6e7681"
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView style={{ maxHeight: 120, borderColor: '#30363d', borderWidth: 1, borderRadius: 6 }}>
          {filteredExercises.map(ex => (
            <TouchableOpacity key={ex.id} onPress={() => setExerciseId(ex.id)} style={[styles.exerciseItem, exerciseId === ex.id && { backgroundColor: '#161b22' }]}>
              <Text style={styles.exerciseText}>{ex.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.row}>
          <Text style={styles.label}>Sets</Text>
          <TextInput style={styles.smallInput} keyboardType="numeric" value={setsCount} onChangeText={setSetsCount} />
          <Text style={styles.label}>RPE</Text>
          <TextInput style={styles.smallInput} keyboardType="numeric" value={rpe} onChangeText={setRpe} />
          <Text style={styles.label}>Rest (s)</Text>
          <TextInput style={styles.smallInput} keyboardType="numeric" value={restSec} onChangeText={setRestSec} />
        </View>
        <TouchableOpacity onPress={onAddExercise} style={styles.addButton}><Text style={styles.addButtonText}>Add</Text></TouchableOpacity>
      </View>
      {/* Finish workout */}
      <TouchableOpacity onPress={() => {
        const updated = { ...localWorkout, completedAt: new Date().toISOString() };
        setLocalWorkout(updated);
        updateWorkout(updated);
      }} style={[styles.addButton, { marginTop: 16, backgroundColor: '#f85149' }]}> 
        <Text style={styles.addButtonText}>Finish Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0d1117',
    padding: 16,
    borderRadius: 8,
    borderColor: '#30363d',
    borderWidth: 1,
    marginBottom: 20
  },
  heading: {
    fontSize: 18,
    color: '#58a6ff',
    marginBottom: 8,
    fontWeight: '600'
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  setText: {
    color: '#c9d1d9',
    flex: 1,
    marginRight: 4
  },
  input: {
    backgroundColor: '#161b22',
    color: '#c9d1d9',
    padding: 4,
    borderRadius: 4,
    borderColor: '#30363d',
    borderWidth: 1,
    width: 60,
    marginRight: 4
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#30363d',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#238636'
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  label: {
    color: '#8b949e',
    marginRight: 6
  },
  muscleChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363d',
    marginRight: 6
  },
  muscleChipSelected: {
    backgroundColor: '#161b22'
  },
  muscleChipText: {
    color: '#c9d1d9'
  },
  exerciseItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d'
  },
  exerciseText: {
    color: '#c9d1d9'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  smallInput: {
    backgroundColor: '#161b22',
    color: '#c9d1d9',
    padding: 6,
    borderRadius: 6,
    borderColor: '#30363d',
    borderWidth: 1,
    width: 60,
    marginRight: 8
  },
  addButton: {
    backgroundColor: '#238636',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  addButtonText: {
    color: '#c9d1d9',
    fontWeight: '600'
  }
});
