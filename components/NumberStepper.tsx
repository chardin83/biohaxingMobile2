import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  inBottomSheet?: boolean;
  accessibilityLabel?: string;
}

export default function NumberStepper({
  value,
  onChange,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  disabled = false,
  inBottomSheet = false,
  accessibilityLabel,
}: Readonly<NumberStepperProps>) {
  const { colors } = useTheme();
  const [text, setText] = useState(String(value));
  const lastValue = useRef(value);
  const Input = inBottomSheet ? BottomSheetTextInput : TextInput;
  const clamp = (number: number) => Math.min(max, Math.max(min, number));

  useEffect(() => {
    if (value !== lastValue.current) {
      setText(String(value));
      lastValue.current = value;
    }
  }, [value]);

  const emit = (number: number) => {
    lastValue.current = number;
    onChange(number);
  };

  const adjust = (delta: number) => {
    const parsed = Number(text.replace(',', '.'));
    const next = clamp((Number.isFinite(parsed) ? parsed : value) + delta);
    setText(String(next));
    emit(next);
  };

  return (
    <View style={styles.container}>
      <Pressable accessibilityRole="button" accessibilityLabel={`-${step}`} disabled={disabled} onPress={() => adjust(-step)} hitSlop={10}>
        <ThemedText type="title2">−</ThemedText>
      </Pressable>

      <Input
        accessibilityLabel={accessibilityLabel}
        style={[styles.input, { color: colors.text }]}
        value={text}
        editable={!disabled}
        keyboardType="decimal-pad"
        selectTextOnFocus
        onChangeText={nextText => {
          if (disabled || !/^-?\d*[.,]?\d*$/.test(nextText)) return;
          const parsed = Number(nextText.replace(',', '.'));
          if (Number.isFinite(parsed)) {
            const next = clamp(parsed);
            setText(next === parsed ? nextText : String(next));
            emit(next);
          } else {
            setText(nextText);
          }
        }}
        onBlur={() => {
          const parsed = Number(text.replace(',', '.'));
          const next = clamp(Number.isFinite(parsed) ? parsed : value);
          setText(String(next));
          if (next !== value) emit(next);
        }}
      />

      <Pressable accessibilityRole="button" accessibilityLabel={`+${step}`} disabled={disabled} onPress={() => adjust(step)} hitSlop={10}>
        <ThemedText type="title2">+</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { minWidth: 48, maxWidth: 90, paddingVertical: 0, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
