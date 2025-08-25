import { Audio } from 'expo-audio';
import React, { useEffect, useRef, useState } from 'react';
import { Text, Vibration, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

async function playBeep() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/beep.wav') // or .mp3
    );
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((s) => {
      if (s.didJustFinish) sound.unloadAsync();
    });
  } catch {
    Vibration.vibrate(300);
  }
}

/**
 * RestSquareTimer
 * - Overlay square border that "eats itself" clockwise as time elapses.
 * - Controlled via ref: ref.current.start(seconds), stop(), reset(seconds)
 * - You can hide inline text with showText={false} and read remaining via onTick.
 */
const RestSquareTimer = React.forwardRef(function RestSquareTimer(
    {
      // visuals
      color = '#1e90ff',
      thickness = 4,
      margin = 6,
      // behavior
      initialSeconds = 90,
      visible = true,
      onTick,               // (remainingSeconds: number) => void
      onDone,               // () => void
      // optional readout
      showText = true,
      textStyle = { color: '#CFCFF5', fontWeight: '700' },
      // layout: how far below the top to start the square outline
      topOffset = 0,
    },
    ref
) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [duration, setDuration] = useState(initialSeconds);

  // measure parent so overlay matches full screen container
  const [size, setSize] = useState({ w: 0, h: 0 });
  const tickRef = useRef(null);

  function clearTick() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  React.useImperativeHandle(ref, () => ({
    start: (seconds) => {
      const n = Math.max(1, Number(seconds || initialSeconds || 0));
      setDuration(n);
      setRemaining(n);
      clearTick();
      tickRef.current = setInterval(() => {
        setRemaining((r) => {
          const next = r <= 1 ? 0 : r - 1;
          if (onTick) onTick(next);
          if (next === 0) {
            clearTick();
            playBeep();
            onDone && onDone();
          }
          return next;
        });
      }, 1000);
    },
    reset: (seconds) => {
      clearTick();
      const n = Math.max(0, Number(seconds || initialSeconds || 0));
      setDuration(n);
      setRemaining(n);
      if (onTick) onTick(n);
    },
  }));

  useEffect(() => () => clearTick(), []);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  // perimeter calc from measured size
  const w = Math.max(0, size.w - margin * 2);
  const h = Math.max(0, size.h - margin * 2);
  const perimeter = Math.max(1, 2 * (w + h));
  const visibleLen = duration > 0 ? Math.max(0, (remaining / duration) * perimeter) : 0;
  const dashArray = `${visibleLen}, ${perimeter}`;
  
  return (
    <>
      {showText ? <Text style={textStyle}>{mm}:{ss}</Text> : null}
  
      {visible ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: topOffset,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 9999,      // keep above all UI
            elevation: 9999,   // Android z-index
          }}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setSize({ w: width, h: height });
          }}
        >
          {size.w > 0 && size.h > 0 ? (
            <Svg width="100%" height="100%">
              <Rect
                x={margin}
                y={margin}
                width={size.w - margin * 2}
                height={size.h - margin * 2}
                fill="none"
                stroke={color}
                strokeWidth={thickness}
                strokeLinecap="butt"
                // epsilon prevents a tiny rounding gap on the top edge
                strokeDasharray={`${Math.max(0, visibleLen - 0.001)} ${perimeter}`}
                strokeDashoffset={0.001}
              />
            </Svg>
          ) : null}
        </View>
      ) : null}
    </>
  );  
});

export default RestSquareTimer;
