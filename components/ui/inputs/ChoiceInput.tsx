import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

import { getInputLabel, InputLabel } from './InputLabel';

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
};

type ChoiceInputProps<T extends string> = {
  label: string;
  options: readonly ChoiceOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  isOptional?: boolean;
  disabled?: boolean;
  errorText?: string;
  showValidation?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function ChoiceInput<T extends string>({
  label, options, value, onChange, isOptional, disabled = false, errorText, showValidation = false, containerStyle,
}: Readonly<ChoiceInputProps<T>>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const hasValidSelection = options.some(option => option.value === value);
  const displayedError = errorText || (!disabled && showValidation && isOptional === false && !hasValidSelection ? t('labeledInput.requiredError') : undefined);
  const selectedStyle = { borderColor: colors.primary, backgroundColor: colors.primaryVeryWeak };
  const defaultStyle = { borderColor: colors.border, backgroundColor: 'transparent' };
  const errorStyle = { borderColor: colors.error };

  return (
    <View style={containerStyle}>
      <InputLabel label={label} isOptional={isOptional} hasError={Boolean(displayedError)} />
      <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel={getInputLabel(label, isOptional, t)}>
        {options.map(option => {
          const selected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.touchTarget, disabled && styles.disabled]}
              onPress={() => onChange(option.value)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityHint={displayedError}
              accessibilityState={{ checked: selected, disabled }}
            >
              <View style={[styles.option, selected ? selectedStyle : defaultStyle, displayedError && errorStyle]}>
                <ThemedText type="defaultSemiBold">{option.label}</ThemedText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  touchTarget: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'flex-start',
  },
  option: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 34,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  disabled: { opacity: 0.5 },
});
