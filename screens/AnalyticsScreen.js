import CaloriesChart from'../components/CaloriesChart';
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useData } from '../contexts/DataContext';

export default function AnalyticsScreen() {
  const { data, computeGlobalPrs } = useData();
  const prs = computeGlobalPrs();

  // Map exerciseId to exercise name
  const exMap = {};
  data.exercises.forEach(ex => { exMap[ex.id] = ex.name; });

  // Compute sets per muscle group for last 7 days
  const setsPerMuscle = {};
  const now = new Date();
  data.workouts.forEach(w => {
    const wDate = new Date(w.date);
    if ((now - wDate) / (1000 * 60 * 60 * 24) <= 7) {
      w.sets.forEach(s => {
        const ex = data.exercises.find(e => e.id === s.exerciseId);
        if (!ex) return;
        const muscles = [...ex.primaryMuscles, ...ex.secondaryMuscles];
        muscles.forEach(m => {
          setsPerMuscle[m] = (setsPerMuscle[m] || 0) + 1;
        });
      });
    }
  });

  return (
    <ScrollView style={{ backgroundColor: '#0d1117', flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.heading}>Personal Records</Text>
      {Object.keys(prs).map(key => {
        const pr = prs[key];
        return (
          <View key={key} style={styles.card}>
  <CaloriesChart />
  <View style={{height:12}} />
            <Text style={styles.cardTitle}>{exMap[key] || 'Exercise'}</Text>
            <Text style={styles.cardInfo}>Max Weight: {pr.maxWeight.toFixed(2)}</Text>
            <Text style={styles.cardInfo}>Max Volume: {pr.maxVolume.toFixed(2)}</Text>
            <Text style={styles.cardInfo}>Max 1RM (Epley): {pr.maxOneRmEpley.toFixed(2)}</Text>
            <Text style={styles.cardInfo}>Max 1RM (Brzycki): {pr.maxOneRmBrzycki.toFixed(2)}</Text>
          </View>
        );
      })}
      <Text style={styles.heading}>Sets per Muscle (last 7 days)</Text>
      {Object.keys(setsPerMuscle).map(muscle => (
        <View key={muscle} style={styles.card}>
          <Text style={styles.cardTitle}>{muscle}</Text>
          <Text style={styles.cardInfo}>Sets: {setsPerMuscle[muscle]}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    color: '#58a6ff',
    fontWeight: '600',
    marginBottom: 12
  },
  card: {
    backgroundColor: '#161b22',
    padding: 12,
    borderRadius: 8,
    borderColor: '#30363d',
    borderWidth: 1,
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 16,
    color: '#c9d1d9',
    fontWeight: '600'
  },
  cardInfo: {
    color: '#8b949e'
  }
});
