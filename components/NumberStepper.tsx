import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function NumberStepper({
  value,
  onChange,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
}: Readonly<NumberStepperProps>) {
  const decrease = () => {
    onChange(Math.max(min, value - step));
  };

  const increase = () => {
    onChange(Math.min(max, value + step));
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={decrease} hitSlop={10}>
        <ThemedText type="title2">−</ThemedText>
      </Pressable>

      <ThemedText type="title3">{value}</ThemedText>

      <Pressable onPress={increase} hitSlop={10}>
        <ThemedText type="title2">+</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});