import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useData, MUSCLE_GROUPS, EQUIPMENT_TYPES } from '../contexts/DataContext';

export default function ExercisesScreen() {
  const { data, addExercise, updateExercise, deleteExercises } = useData();
  const [search, setSearch] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formId, setFormId] = useState(null);
  const [name, setName] = useState('');
  const [primary, setPrimary] = useState([]);
  const [secondary, setSecondary] = useState([]);
  const [equipment, setEquipment] = useState('Barbell');
  const [selectedIds, setSelectedIds] = useState([]);

  const filtered = data.exercises.filter(ex => {
    const matchesSearch = search ? ex.name.toLowerCase().includes(search.toLowerCase()) : true;
    const matchesFilter = filterMuscle ? (ex.primaryMuscles.includes(filterMuscle) || ex.secondaryMuscles.includes(filterMuscle)) : true;
    return matchesSearch && matchesFilter;
  });

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openForm = (exercise) => {
    setShowForm(true);
    if (exercise) {
      setFormId(exercise.id);
      setName(exercise.name);
      setPrimary(exercise.primaryMuscles);
      setSecondary(exercise.secondaryMuscles);
      setEquipment(exercise.equipment);
    } else {
      setFormId(null);
      setName('');
      setPrimary([]);
      setSecondary([]);
      setEquipment('Barbell');
    }
  };

  const handleSave = () => {
    if (!name || primary.length === 0) return alert('Name and primary muscles required');
    const exData = {
      name,
      primaryMuscles: primary,
      secondaryMuscles: secondary,
      equipment
    };
    if (formId) {
      updateExercise({ id: formId, ...exData });
    } else {
      addExercise(exData);
    }
    setShowForm(false);
    setName('');
    setPrimary([]);
    setSecondary([]);
    setEquipment('Barbell');
    setFormId(null);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    deleteExercises(selectedIds);
    setSelectedIds([]);
  };

  const togglePrimary = (muscle) => {
    setPrimary(prev => prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]);
  };
  const toggleSecondary = (muscle) => {
    setSecondary(prev => prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]);
  };

  return (
    <ScrollView style={{ backgroundColor: '#0d1117', flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.section}>
        <Text style={styles.heading}>Exercise Library</Text>
        <TextInput style={styles.input} placeholder="Search" placeholderTextColor="#6e7681" value={search} onChangeText={setSearch} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <TouchableOpacity onPress={() => setFilterMuscle('')} style={[styles.muscleChip, filterMuscle === '' && styles.muscleChipSelected]}><Text style={styles.muscleChipText}>All</Text></TouchableOpacity>
          {MUSCLE_GROUPS.map(m => (
            <TouchableOpacity key={m} onPress={() => setFilterMuscle(m)} style={[styles.muscleChip, filterMuscle === m && styles.muscleChipSelected]}><Text style={styles.muscleChipText}>{m}</Text></TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={() => openForm()} style={styles.addButton}><Text style={styles.addButtonText}>Add New Exercise</Text></TouchableOpacity>
        {selectedIds.length > 0 && (
          <TouchableOpacity onPress={handleDeleteSelected} style={[styles.addButton, { backgroundColor: '#f85149', marginTop: 8 }]}><Text style={styles.addButtonText}>Delete Selected</Text></TouchableOpacity>
        )}
      </View>
      {filtered.map(ex => (
        <View key={ex.id} style={styles.exerciseCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => toggleSelect(ex.id)} style={styles.checkbox}>{selectedIds.includes(ex.id) && <View style={styles.checkboxInner} />}</TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <Text style={styles.exerciseInfo}>Primary: {ex.primaryMuscles.join(', ')}</Text>
              <Text style={styles.exerciseInfo}>Secondary: {ex.secondaryMuscles.join(', ') || '-'}</Text>
              <Text style={styles.exerciseInfo}>Equipment: {ex.equipment}</Text>
            </View>
            <TouchableOpacity onPress={() => openForm(ex)} style={styles.editButton}><Text style={styles.editButtonText}>Edit</Text></TouchableOpacity>
          </View>
        </View>
      ))}
      {/* Form Modal */}
      {showForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.heading}>{formId ? 'Edit Exercise' : 'Add Exercise'}</Text>
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#6e7681" value={name} onChangeText={setName} />
            <Text style={styles.label}>Primary Muscles (select at least one)</Text>
            <View style={styles.flexWrapRow}>
              {MUSCLE_GROUPS.map(m => (
                <TouchableOpacity key={m} onPress={() => togglePrimary(m)} style={[styles.muscleChip, primary.includes(m) && styles.muscleChipSelected]}><Text style={styles.muscleChipText}>{m}</Text></TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Secondary Muscles (optional)</Text>
            <View style={styles.flexWrapRow}>
              {MUSCLE_GROUPS.map(m => (
                <TouchableOpacity key={m} onPress={() => toggleSecondary(m)} style={[styles.muscleChip, secondary.includes(m) && styles.muscleChipSelected]}><Text style={styles.muscleChipText}>{m}</Text></TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Equipment</Text>
            <View style={styles.flexWrapRow}>
              {EQUIPMENT_TYPES.map(e => (
                <TouchableOpacity key={e} onPress={() => setEquipment(e)} style={[styles.muscleChip, equipment === e && styles.muscleChipSelected]}><Text style={styles.muscleChipText}>{e}</Text></TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity onPress={handleSave} style={[styles.addButton, { flex: 1, marginRight: 8 }]}><Text style={styles.addButtonText}>{formId ? 'Save' : 'Add'}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setShowForm(false)} style={[styles.addButton, { flex: 1, backgroundColor: '#f85149' }]}><Text style={styles.addButtonText}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  muscleChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363d',
    marginRight: 6,
    marginBottom: 4
  },
  muscleChipSelected: {
    backgroundColor: '#161b22'
  },
  muscleChipText: {
    color: '#c9d1d9'
  },
  exerciseCard: {
    backgroundColor: '#161b22',
    padding: 12,
    borderRadius: 8,
    borderColor: '#30363d',
    borderWidth: 1,
    marginBottom: 12
  },
  exerciseName: {
    fontSize: 16,
    color: '#58a6ff',
    fontWeight: '600'
  },
  exerciseInfo: {
    color: '#8b949e'
  },
  editButton: {
    backgroundColor: '#238636',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  editButtonText: {
    color: '#c9d1d9',
    fontWeight: '600'
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#30363d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#238636'
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#0d1117',
    padding: 16,
    borderRadius: 8,
    borderColor: '#30363d',
    borderWidth: 1,
    width: '90%'
  },
  label: {
    color: '#8b949e',
    marginBottom: 4
  },
  flexWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8
  }
});
