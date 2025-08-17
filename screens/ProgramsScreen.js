import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useData, MUSCLE_GROUPS } from '../contexts/DataContext';

export default function ProgramsScreen() {
  const { data, addProgram, setCurrentProgram, deleteProgram, updateProgram } = useData();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [weeks, setWeeks] = useState('4');
  const [expandedId, setExpandedId] = useState(null);
  // state for adding new day
  const [newDayDow, setNewDayDow] = useState('1');
  const [newDayName, setNewDayName] = useState('Day');
  const [newDayTargetProgram, setNewDayTargetProgram] = useState(null);
  // state for adding exercise to a day
  const [selectedDay, setSelectedDay] = useState(null);
  const [exExerciseId, setExExerciseId] = useState('');
  const [exSets, setExSets] = useState('3');
  const [exRepsMin, setExRepsMin] = useState('8');
  const [exRepsMax, setExRepsMax] = useState('8');
  const [exRpe, setExRpe] = useState('8');
  const [exRestSec, setExRestSec] = useState('90');
  const [exMuscle, setExMuscle] = useState('');
  const [exSearch, setExSearch] = useState('');

  const filteredExercises = data.exercises.filter(ex => {
    const matchesMuscle = exMuscle ? (ex.primaryMuscles.includes(exMuscle) || ex.secondaryMuscles.includes(exMuscle)) : true;
    const matchesSearch = exSearch ? ex.name.toLowerCase().includes(exSearch.toLowerCase()) : true;
    return matchesMuscle && matchesSearch;
  });

  const handleAddProgram = () => {
    if (!name) return;
    addProgram({ name, startDate, weeks: parseInt(weeks) || 4, days: [] });
    setName('');
    setWeeks('4');
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAddDay = (program) => {
    if (!newDayName) return;
    const day = {
      id: Math.random().toString(),
      dow: parseInt(newDayDow) || 1,
      name: newDayName,
      exercises: []
    };
    const updated = { ...program, days: [...program.days, day] };
    updateProgram(updated);
    setNewDayName('Day');
    setNewDayDow('1');
  };

  const handleDeleteDay = (program, dayId) => {
    const updated = { ...program, days: program.days.filter(d => d.id !== dayId) };
    updateProgram(updated);
  };

  const handleAddExerciseToDay = (program, day) => {
    if (!exExerciseId) return;
    const exercise = data.exercises.find(e => e.id === exExerciseId);
    if (!exercise) return;
    const newEx = {
      exerciseId: exExerciseId,
      sets: parseInt(exSets) || 3,
      repsMin: parseInt(exRepsMin) || 8,
      repsMax: parseInt(exRepsMax) || 8,
      targetRpe: parseFloat(exRpe) || 8,
      restSec: parseInt(exRestSec) || 90
    };
    const updatedDays = program.days.map(d => d.id === day.id ? { ...d, exercises: [...d.exercises, newEx] } : d);
    const updated = { ...program, days: updatedDays };
    updateProgram(updated);
    // reset
    setExExerciseId('');
    setExSets('3');
    setExRepsMin('8');
    setExRepsMax('8');
    setExRpe('8');
    setExRestSec('90');
  };

  return (
    <ScrollView style={{ backgroundColor: '#0d1117', flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.section}>
        <Text style={styles.heading}>Create New Program</Text>
        <TextInput style={styles.input} placeholder="Program Name" placeholderTextColor="#6e7681" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Start Date (YYYY-MM-DD)" placeholderTextColor="#6e7681" value={startDate} onChangeText={setStartDate} />
        <TextInput style={styles.input} placeholder="Weeks" placeholderTextColor="#6e7681" keyboardType="numeric" value={weeks} onChangeText={setWeeks} />
        <TouchableOpacity onPress={handleAddProgram} style={styles.addButton}><Text style={styles.addButtonText}>Add Program</Text></TouchableOpacity>
      </View>

      {data.programs.map(program => (
        <View key={program.id} style={styles.section}>
          <TouchableOpacity onPress={() => toggleExpand(program.id)}>
            <Text style={styles.programName}>{program.name}</Text>
          </TouchableOpacity>
          <Text style={styles.programSub}>Start: {program.startDate}, Weeks: {program.weeks}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TouchableOpacity onPress={() => setCurrentProgram(program.id)} style={styles.smallButton}><Text style={styles.smallButtonText}>Set Active</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => deleteProgram(program.id)} style={[styles.smallButton, { backgroundColor: '#f85149' }]}><Text style={styles.smallButtonText}>Delete</Text></TouchableOpacity>
          </View>
          {expandedId === program.id && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.subheading}>Days</Text>
              {program.days.map(day => (
                <View key={day.id} style={styles.dayCard}>
                  <Text style={styles.dayTitle}>{day.name} (DOW {day.dow})</Text>
                  {day.exercises.map((ex, idx) => {
                    const exName = data.exercises.find(e => e.id === ex.exerciseId)?.name || 'Exercise';
                    return (
                      <Text key={idx} style={styles.dayExercise}>• {exName}: {ex.sets}×{ex.repsMin}-{ex.repsMax} reps (RPE {ex.targetRpe}, Rest {ex.restSec}s)</Text>
                    );
                  })}
                  {/* Add exercise to this day */}
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>Add Exercise</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <TouchableOpacity onPress={() => setExMuscle('')} style={[styles.muscleChip, exMuscle === '' && styles.muscleChipSelected]}><Text style={styles.muscleChipText}>All</Text></TouchableOpacity>
                      {MUSCLE_GROUPS.map(muscle => (
                        <TouchableOpacity key={muscle} onPress={() => setExMuscle(muscle)} style={[styles.muscleChip, exMuscle === muscle && styles.muscleChipSelected]}><Text style={styles.muscleChipText}>{muscle}</Text></TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TextInput style={styles.input} placeholder="Search" placeholderTextColor="#6e7681" value={exSearch} onChangeText={setExSearch} />
                    <ScrollView style={{ maxHeight: 100, borderColor: '#30363d', borderWidth: 1, borderRadius: 6 }}>
                      {filteredExercises.map(exo => (
                        <TouchableOpacity key={exo.id} onPress={() => setExExerciseId(exo.id)} style={[styles.exerciseItem, exExerciseId === exo.id && { backgroundColor: '#161b22' }]}>
                          <Text style={styles.exerciseText}>{exo.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                      <TextInput style={styles.smallInput} placeholder="Sets" placeholderTextColor="#6e7681" keyboardType="numeric" value={exSets} onChangeText={setExSets} />
                      <TextInput style={styles.smallInput} placeholder="Reps Min" placeholderTextColor="#6e7681" keyboardType="numeric" value={exRepsMin} onChangeText={setExRepsMin} />
                      <TextInput style={styles.smallInput} placeholder="Reps Max" placeholderTextColor="#6e7681" keyboardType="numeric" value={exRepsMax} onChangeText={setExRepsMax} />
                      <TextInput style={styles.smallInput} placeholder="RPE" placeholderTextColor="#6e7681" keyboardType="numeric" value={exRpe} onChangeText={setExRpe} />
                      <TextInput style={styles.smallInput} placeholder="Rest" placeholderTextColor="#6e7681" keyboardType="numeric" value={exRestSec} onChangeText={setExRestSec} />
                      <TouchableOpacity onPress={() => handleAddExerciseToDay(program, day)} style={styles.addExerciseButton}><Text style={styles.addExerciseButtonText}>Add</Text></TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteDay(program, day.id)} style={[styles.smallButton, { backgroundColor: '#f85149', marginTop: 4 }]}><Text style={styles.smallButtonText}>Delete Day</Text></TouchableOpacity>
                </View>
              ))}
              {/* Add new day */}
              <View style={{ marginTop: 8 }}>
                <Text style={styles.subheading}>Add New Day</Text>
                <TextInput style={styles.input} placeholder="Day Name" placeholderTextColor="#6e7681" value={newDayName} onChangeText={setNewDayName} />
                <TextInput style={styles.input} placeholder="Day of Week (1-7)" placeholderTextColor="#6e7681" keyboardType="numeric" value={newDayDow} onChangeText={setNewDayDow} />
                <TouchableOpacity onPress={() => handleAddDay(program)} style={styles.addButton}><Text style={styles.addButtonText}>Add Day</Text></TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  input: {
    backgroundColor: '#161b22',
    color: '#c9d1d9',
    padding: 8,
    borderRadius: 6,
    borderColor: '#30363d',
    borderWidth: 1,
    marginBottom: 8
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
  programName: {
    fontSize: 18,
    color: '#58a6ff',
    fontWeight: '600'
  },
  programSub: {
    color: '#8b949e'
  },
  smallButton: {
    flex: 1,
    backgroundColor: '#238636',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8
  },
  smallButtonText: {
    color: '#c9d1d9',
    fontWeight: '600'
  },
  subheading: {
    fontSize: 16,
    color: '#58a6ff',
    fontWeight: '600',
    marginBottom: 4
  },
  dayCard: {
    backgroundColor: '#161b22',
    padding: 12,
    borderRadius: 8,
    borderColor: '#30363d',
    borderWidth: 1,
    marginBottom: 12
  },
  dayTitle: {
    fontSize: 16,
    color: '#c9d1d9',
    fontWeight: '600',
    marginBottom: 4
  },
  dayExercise: {
    color: '#8b949e',
    marginLeft: 8
  },
  label: {
    color: '#8b949e',
    marginBottom: 4
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
  smallInput: {
    backgroundColor: '#161b22',
    color: '#c9d1d9',
    padding: 6,
    borderRadius: 6,
    borderColor: '#30363d',
    borderWidth: 1,
    width: 60,
    marginRight: 4
  },
  addExerciseButton: {
    backgroundColor: '#238636',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    justifyContent: 'center'
  },
  addExerciseButtonText: {
    color: '#c9d1d9',
    fontWeight: '600'
  }
});
