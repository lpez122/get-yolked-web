import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useData, MUSCLE_GROUPS } from '../contexts/DataContext';

// Component for building a quick workout plan (unscheduled session)
export default function QuickBuilder({ onStartQuickWorkout }) {
  const { data, setQuickPlan, addWorkout, addDayTemplate } = useData();
  const [plan, setPlan] = useState([]);
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [search, setSearch] = useState('');
  const [exerciseId, setExerciseId] = useState('');
  const [sets, setSets] = useState('3');
  const [repsMin, setRepsMin] = useState('8');
  const [repsMax, setRepsMax] = useState('8');
  const [rpe, setRpe] = useState('8');
  const [rest, setRest] = useState('90');

  // Filter exercises based on muscle and search
  const filteredExercises = data.exercises.filter(ex => {
    const matchesMuscle = selectedMuscle ? (ex.primaryMuscles.includes(selectedMuscle) || ex.secondaryMuscles.includes(selectedMuscle)) : true;
    const matchesSearch = search ? ex.name.toLowerCase().includes(search.toLowerCase()) : true;
    return matchesMuscle && matchesSearch;
  });

  const onAdd = () => {
    if (!exerciseId) return;
    const exercise = data.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    const entry = {
      id: Math.random().toString(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: parseInt(sets) || 3,
      repsMin: parseInt(repsMin) || 8,
      repsMax: parseInt(repsMax) || 8,
      rpe: parseFloat(rpe) || 8,
      restSec: parseInt(rest) || 90
    };
    setPlan([...plan, entry]);
    // reset fields
    setExerciseId('');
    setSets('3');
    setRepsMin('8');
    setRepsMax('8');
    setRpe('8');
    setRest('90');
  };

  const onRemove = (id) => {
    setPlan(plan.filter(p => p.id !== id));
  };

  const onSaveTemplate = () => {
    if (plan.length === 0) return;
    const name = prompt('Template name');
    if (!name) return;
    addDayTemplate({ name, exercises: plan.map(({ id, ...rest }) => rest) });
    alert('Template saved!');
  };

  const onStart = () => {
    if (plan.length === 0) return;
    const date = new Date().toISOString().slice(0, 10);
    const setsArray = [];
    let setNumber = 1;
    plan.forEach(item => {
      for (let i = 0; i < item.sets; i++) {
        setsArray.push({
          id: Math.random().toString(),
          exerciseId: item.exerciseId,
          setNumber: setNumber++,
          weight: 0,
          reps: 0,
          rpe: 0,
          restSec: item.restSec,
          completed: false
        });
      }
    });
    const workout = {
      programId: null,
      date: date,
      week: null,
      dow: null,
      sets: setsArray,
      notes: '',
      startedAt: new Date().toISOString(),
      completedAt: null
    };
    addWorkout(workout);
    // store plan into quickPlan in context (optional)
    setQuickPlan([]);
    // callback to start quick workout
    if (onStartQuickWorkout) onStartQuickWorkout();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Quick Workout Builder</Text>
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
      <View style={styles.row}>
        <Text style={styles.label}>Exercise</Text>
        <ScrollView style={{ flex: 1, maxHeight: 100, borderColor: '#30363d', borderWidth: 1, borderRadius: 6 }}>
          {filteredExercises.map(ex => (
            <TouchableOpacity key={ex.id} onPress={() => setExerciseId(ex.id)} style={[styles.exerciseItem, exerciseId === ex.id && { backgroundColor: '#161b22' }]}>
              <Text style={styles.exerciseText}>{ex.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Sets</Text>
        <TextInput style={styles.smallInput} keyboardType="numeric" value={sets} onChangeText={setSets} />
        <Text style={styles.label}>Reps Min</Text>
        <TextInput style={styles.smallInput} keyboardType="numeric" value={repsMin} onChangeText={setRepsMin} />
        <Text style={styles.label}>Reps Max</Text>
        <TextInput style={styles.smallInput} keyboardType="numeric" value={repsMax} onChangeText={setRepsMax} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>RPE</Text>
        <TextInput style={styles.smallInput} keyboardType="numeric" value={rpe} onChangeText={setRpe} />
        <Text style={styles.label}>Rest (s)</Text>
        <TextInput style={styles.smallInput} keyboardType="numeric" value={rest} onChangeText={setRest} />
      </View>
      <TouchableOpacity style={styles.addButton} onPress={onAdd}><Text style={styles.addButtonText}>Add Exercise</Text></TouchableOpacity>

      {plan.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.heading}>Plan</Text>
          {plan.map(item => (
            <View key={item.id} style={styles.planRow}>
              <Text style={styles.planText}>{item.exerciseName} - {item.sets} sets × {item.repsMin}-{item.repsMax} reps (RPE {item.rpe}, Rest {item.restSec}s)</Text>
              <TouchableOpacity onPress={() => onRemove(item.id)}><Text style={{ color: '#f85149' }}>Remove</Text></TouchableOpacity>
            </View>
          ))}
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TouchableOpacity onPress={onSaveTemplate} style={[styles.actionButton, { marginRight: 8 }]}><Text style={styles.actionButtonText}>Save Template</Text></TouchableOpacity>
            <TouchableOpacity onPress={onStart} style={styles.actionButton}><Text style={styles.actionButtonText}>Start Workout</Text></TouchableOpacity>
          </View>
        </View>
      )}
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
  input: {
    backgroundColor: '#161b22',
    color: '#c9d1d9',
    padding: 8,
    borderRadius: 6,
    borderColor: '#30363d',
    borderWidth: 1,
    marginBottom: 8
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
  },
  exerciseItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d'
  },
  exerciseText: {
    color: '#c9d1d9'
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  planText: {
    color: '#c9d1d9',
    flex: 1
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#238636',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  actionButtonText: {
    color: '#c9d1d9',
    fontWeight: '600'
  }
});
