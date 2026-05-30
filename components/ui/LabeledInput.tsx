import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

type Props = TextInputProps & {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  multilineInput?: boolean;
  isOptional?: boolean; // <-- ny prop för optional/mandatory
  disabled?: boolean;
};

const LabeledInput: React.FC<Props> = ({
  label,
  containerStyle,
  inputStyle,
  multilineInput = false,
  isOptional,
  disabled = false,
  ...textInputProps
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { placeholder, ...restProps } = textInputProps;
  const [inputHeight, setInputHeight] = React.useState(40);
  const textValue = typeof restProps.value === 'string' ? restProps.value : '';

  const height = multilineInput ? inputHeight : 40;

  let suffix = '';
  if (isOptional === true) {
    suffix = ` (${t('labeledInput.optional')})`;
  } else if (isOptional === false) {
    suffix = ` (${t('labeledInput.required')})`;
  }
  const displayLabel = `${label}${suffix}`;

  // Visa inte placeholder om det är samma som label
  const effectivePlaceholder =
    typeof placeholder === 'string' && placeholder.trim() === label.trim()
      ? undefined
      : placeholder;

  const handleContentSizeChange: TextInputProps['onContentSizeChange'] = e => {
    if (!multilineInput) return;

    // Keep a compact single-line field until user has entered text.
    if (textValue.trim().length === 0) {
      setInputHeight(40);
      return;
    }

    setInputHeight(Math.max(40, e.nativeEvent.contentSize.height));
  };

    return (
    <View style={[styles.container, containerStyle]}>
      <ThemedText type="label">
        {displayLabel}
      </ThemedText>
      <TextInput
        style={[
          styles.input,
          disabled && styles.disabledInput,
           multilineInput ? styles.inputMultiline : styles.inputSingleLine,
          {
            borderColor: colors.border,
            color: colors.text,
            height,
          },
          inputStyle,
        ]}
        placeholderTextColor={colors.textMuted}
        placeholder={effectivePlaceholder}
        multiline={multilineInput}
        onContentSizeChange={handleContentSizeChange}
        editable={!disabled}
        {...restProps}
        value={textValue}
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
  },
  disabledInput: {
    opacity: 0.5,
  },
  inputSingleLine: {
    textAlignVertical: 'center',
  },
  inputMultiline: {
    textAlignVertical: 'top',
  },
});
