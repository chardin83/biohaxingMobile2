import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

import { borders, colors } from '@/app/theme/styles';

export const ThemedTextInput = (props: TextInputProps) => {
  return <TextInput placeholderTextColor="#888" {...props} style={[styles.input, props.style]} />;
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borders.radius,
    padding: 12,
    backgroundColor: colors.inputBackground,
    color: colors.text,
  },
});
