import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

type Props = TextInputProps & {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  multilineInput?: boolean; // <-- ny prop
};

const LabeledInput: React.FC<Props> = ({
  label,
  containerStyle,
  inputStyle,
  multilineInput = false,
  ...textInputProps
}) => {
  const { colors } = useTheme();
  const { placeholder, ...restProps } = textInputProps;
  const effectivePlaceholder = label ? undefined : placeholder;
  const [inputHeight, setInputHeight] = React.useState(40);

  const height = multilineInput ? inputHeight : 40;

  return (
    <View style={[styles.container, containerStyle]}>
      <ThemedText type="label">
        {label}
      </ThemedText>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: colors.border,
            color: colors.text,
            height: height,
          },
          inputStyle,
        ]}
        placeholderTextColor={colors.textMuted}
        placeholder={effectivePlaceholder}
        multiline={multilineInput}
        onContentSizeChange={
          multilineInput
            ? e => setInputHeight(Math.max(40, e.nativeEvent.contentSize.height))
            : undefined
        }
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
  input: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    minHeight: 40,
    textAlignVertical: 'top',
  },
});
