// components/ui/OptionSelector.tsx

import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../ThemedText';
import { IconSymbolName } from './icon-symbol-map';
import { IconSymbol } from './IconSymbol';

export interface OptionSelectorOption<T extends string> {
  value: T;
  label: string;
  icon?: IconSymbolName;
}

interface OptionSelectorProps<T extends string> {
  options: OptionSelectorOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

const OptionSelector = <T extends string>({ options, value, onChange, disabled = false }: OptionSelectorProps<T>) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
        },
      ]}
    >
      {options.map(option => {
        const selected = option.value === value;
        const contentColor = selected ? colors.background : colors.text;

        return (
          <Pressable
            key={option.value}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              selected && {
                backgroundColor: colors.primary,
              },
              pressed && styles.pressed,
              disabled && styles.disabled,
            ]}
          >
            <View style={styles.optionContent}>
              {option.icon && <IconSymbol name={option.icon} size={20} color={contentColor} />}

              <ThemedText
                type="defaultSemiBold"
                numberOfLines={1}
                style={[
                  styles.optionText,
                  {
                    color: contentColor,
                  },
                ]}
              >
                {option.label}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    paddingHorizontal: 12,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  optionText: {
    fontSize: 16,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default OptionSelector;
