import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

interface NumberStepperProps {
  value: number | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  compact?: boolean;
  inBottomSheet?: boolean;
  accessibilityLabel?: string;
}

function isNumericInput(text: string): boolean {
  let hasDecimalSeparator = false;
  for (let index = text.startsWith('-') ? 1 : 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '.' || character === ',') {
      if (hasDecimalSeparator) return false;
      hasDecimalSeparator = true;
    } else if (character < '0' || character > '9') {
      return false;
    }
  }
  return true;
}

export default function NumberStepper({
  value,
  onChange,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  disabled = false,
  compact = false,
  inBottomSheet = false,
  accessibilityLabel,
}: Readonly<NumberStepperProps>) {
  const { colors } = useTheme();
  const [text, setText] = useState(value === undefined ? '' : String(value));
  const lastValue = useRef(value);
  const Input = inBottomSheet ? BottomSheetTextInput : TextInput;
  const clamp = (number: number) => Math.min(max, Math.max(min, number));

  useEffect(() => {
    if (value !== lastValue.current) {
      setText(value === undefined ? '' : String(value));
      lastValue.current = value;
    }
  }, [value]);

  const emit = (number: number) => {
    lastValue.current = number;
    onChange(number);
  };

  const adjust = (delta: number) => {
    const parsed = Number(text.replace(',', '.'));
    const next = clamp((Number.isFinite(parsed) ? parsed : (value ?? 0)) + delta);
    setText(String(next));
    emit(next);
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ? `${accessibilityLabel}, −${step}` : `-${step}`}
        accessibilityState={{ disabled }}
        style={styles.adjustButton}
        disabled={disabled}
        onPress={() => adjust(-step)}
        hitSlop={10}
      >
        <ThemedText type="title2">−</ThemedText>
      </Pressable>

      <Input
        accessibilityLabel={accessibilityLabel}
        style={[styles.input, compact && styles.compactInput, { color: colors.text }]}
        value={text}
        placeholder="–"
        editable={!disabled}
        accessibilityState={{ disabled }}
        keyboardType="decimal-pad"
        selectTextOnFocus
        onChangeText={nextText => {
          if (disabled || !isNumericInput(nextText)) return;
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
          if (!text.trim() && value === undefined) return;
          const next = clamp(Number.isFinite(parsed) ? parsed : (value ?? 0));
          setText(String(next));
          if (next !== value) emit(next);
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ? `${accessibilityLabel}, +${step}` : `+${step}`}
        accessibilityState={{ disabled }}
        style={styles.adjustButton}
        disabled={disabled}
        onPress={() => adjust(step)}
        hitSlop={10}
      >
        <ThemedText type="title2">+</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  adjustButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  compactContainer: { gap: 8 },
  compactInput: { minWidth: 36, maxWidth: 64 },
  input: { minWidth: 48, maxWidth: 90, paddingVertical: 0, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
