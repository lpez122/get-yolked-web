import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';

const ACCENT = '#003D79';

export default function WorkoutSmoke() {
  const [running, setRunning] = useState(true);
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setT((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0E0E10', padding: 16 }}>
      <Text style={{ fontSize: 24, color: '#fff', marginBottom: 12 }}>Smoke Workout</Text>
      <Text style={{ fontSize: 18, color: '#fff', marginBottom: 12 }}>
        Timer: {t}s (running: {String(running)})
      </Text>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable
          onPress={() => setRunning((r) => !r)}
          style={{ padding: 10, backgroundColor: '#1F1F28', borderRadius: 8 }}
        >
          <Text style={{ color: '#fff' }}>{running ? 'Pause' : 'Start'}</Text>
        </Pressable>

        <Pressable
          onPress={() => setRunning(false)}
          style={{ padding: 10, backgroundColor: ACCENT, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff' }}>Finish</Text>
        </Pressable>
      </View>
    </View>
  );
}
