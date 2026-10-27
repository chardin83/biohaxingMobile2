import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, TextStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

export type InputLabelProps = {
  label: string;
  style?: StyleProp<TextStyle>;
  isOptional?: boolean;
  hasError?: boolean;
};

/** Shared wording for input accessibility labels. */
export function getInputLabel(label: string, isOptional: boolean | undefined, t: (key: string) => string): string {
  if (isOptional === undefined) return label;
  return `${label} · ${t(isOptional ? 'labeledInput.optional' : 'labeledInput.required')}`;
}

/** Only the required word changes color; the separator inherits the label color. */
export function InputLabel({ label, style, isOptional, hasError = false }: Readonly<InputLabelProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <ThemedText type="label" style={[styles.label, style]}>
      {label}
      {isOptional !== undefined && (
        <>
          {' · '}
          <ThemedText type="label" style={!isOptional && hasError ? { color: colors.error } : undefined}>
            {t(isOptional ? 'labeledInput.optional' : 'labeledInput.required')}
          </ThemedText>
        </>
      )}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 4 },
});
