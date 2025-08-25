import { Audio } from 'expo-audio';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, TextInput, Vibration, View } from 'react-native';


async function playBeep() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/beep.wav') // or .mp3 if that’s your file
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      Vibration.vibrate(300); // fallback if audio fails
    }
  }
  

/**
 * RestBubbleTimer
 * - Shows a circular blue ring that shrinks to nothing as the countdown runs.
 * - Accepts a digits-only seconds input.
 * - Beeps (or vibrates) when done.
 */
export default function RestBubbleTimer({ initial = 90, onDone }) {
  const [input, setInput] = useState(String(initial));      // digits-only
  const [duration, setDuration] = useState(initial);        // seconds
  const [remaining, setRemaining] = useState(initial);      // seconds
  const [running, setRunning] = useState(false);

  const intervalRef = useRef(null);
  const ring = useRef(new Animated.Value(1)).current;       // 1 → 0 as time elapses

  // Update numeric input -> duration (only digits)
  const onChangeDigits = (t) => {
    const digits = t.replace(/[^0-9]/g, '');
    setInput(digits);
    const n = Math.max(0, Number(digits || 0));
    setDuration(n);
    if (!running) setRemaining(n);
  };

  // Start timer
  const start = () => {
    const n = Math.max(1, Number(input || duration || 0));
    setDuration(n);
    setRemaining(n);
    setRunning(true);
    ring.stopAnimation();
    ring.setValue(1);
    Animated.timing(ring, {
      toValue: 0,
      duration: n * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setRunning(false);
        setRemaining(0);
        playBeep();
        onDone && onDone();
      }
    });
  };

  // Tick remaining once per second (for the text display)
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [running, duration]);

  const size = 36;  // outer circle size
  const borderWidth = 3;

  // Shrinking ring: interpolate size from 100% → 0%
  const ringSize = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size], // shrinks to nothing
  });

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* base circle border */}
          <View
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: borderWidth,
              borderColor: '#1e90ff', // blue base ring
              opacity: 0.25,          // faint base
            }}
          />
          {/* shrinking blue ring */}
          <Animated.View
            style={{
              position: 'absolute',
              width: ringSize,
              height: ringSize,
              borderRadius: size / 2,
              borderWidth: borderWidth,
              borderColor: '#1e90ff',
            }}
          />
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
            {mm}:{ss}
          </Text>
        </View>
      </View>

      {/* digits-only seconds input */}
      <TextInput
        keyboardType="number-pad"
        value={input}
        onChangeText={onChangeDigits}
        placeholder="sec"
        placeholderTextColor="#8C8C96"
        maxLength={4}
        style={{
          width: 64,
          textAlign: 'center',
          color: '#fff',
          borderWidth: 1,
          borderColor: '#2C2C36',
          borderRadius: 10,
          paddingVertical: 6,
          paddingHorizontal: 8,
          backgroundColor: '#1F1F28',
        }}
      />

      {/* start button */}
      <Pressable
        onPress={start}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: '#1e90ff',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '800' }}>Start</Text>
      </Pressable>
    </View>
  );
}
