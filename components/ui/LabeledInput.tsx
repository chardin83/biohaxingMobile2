import React from 'react';
import { StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';

import { Colors } from '@/app/theme/Colors';
import { ThemedText } from '@/components/ThemedText';

type Props = TextInputProps & {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

const LabeledInput: React.FC<Props> = ({ label, containerStyle, inputStyle, ...textInputProps }) => {
  const { placeholder, ...restProps } = textInputProps;
  const effectivePlaceholder = label ? undefined : placeholder;

  return (
    <View style={[styles.container, containerStyle]}>
      <ThemedText type="caption" style={styles.label}>
        {label}
      </ThemedText>
      <TextInput
        style={[styles.input, inputStyle]}
        placeholderTextColor={Colors.dark.textMuted}
        placeholder={effectivePlaceholder}
        {...restProps}
      />
    </View>
  );
};

export default LabeledInput;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 6,
    color: Colors.dark.textLight,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.dark.border,
    borderRadius: 5,
    padding: 10,
    color: Colors.dark.text,
  },
});
