import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/ThemedText';

type Props = Readonly<{
  seconds?: number;
  onComplete: () => void;
  accessibilityLabel?: string;
}>;

export function CountdownCircle({ seconds = 5, onComplete, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const duration = Math.max(1, seconds);
  const [remaining, setRemaining] = useState(duration);
  const [progress, setProgress] = useState(1);
  const complete = useRef(onComplete);
  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const startedAt = Date.now();
    setRemaining(duration);
    setProgress(1);
    const timer = setInterval(() => {
      const left = Math.max(0, duration - (Date.now() - startedAt) / 1000);
      setRemaining(Math.ceil(left));
      setProgress(left / duration);
      if (left === 0) {
        clearInterval(timer);
        complete.current();
      }
    }, 100);
    return () => clearInterval(timer);
  }, [duration]);

  const circumference = 2 * Math.PI * 23;
  return (
    <View
      style={styles.circle}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: duration, now: remaining }}
      testID="countdown-circle"
    >
      <Svg width={54} height={54} style={StyleSheet.absoluteFill}>
        <Circle cx={27} cy={27} r={23} stroke={colors.dashboardSync.innerBorder} strokeWidth={3} fill="none" />
        <Circle
          cx={27}
          cy={27}
          r={23}
          stroke={colors.dashboardSync.accent}
          strokeWidth={3}
          fill="none"
          strokeDasharray={[circumference, circumference]}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          transform="rotate(-90 27 27)"
        />
      </Svg>
      <ThemedText style={[styles.number, { color: colors.dashboardSync.text }]}>{remaining}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  number: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
});
