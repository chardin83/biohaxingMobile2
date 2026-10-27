import { BottomSheetTextInput as NativeBottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

import { getInputLabel, InputLabel } from './InputLabel';

type Props = TextInputProps & {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  multilineInput?: boolean;
  isOptional?: boolean;
  disabled?: boolean;
  suffix?: string;
  errorText?: string;
};

const BottomSheetTextInput: React.FC<Props> = ({
  label,
  containerStyle,
  inputStyle,
  multilineInput = false,
  isOptional,
  disabled = false,
  suffix,
  errorText,
  ...textInputProps
}) => {
  const { colors } = useTheme();

  const { t } = useTranslation();

  const { placeholder, ...restProps } = textInputProps;

  const flattenedInputStyle = StyleSheet.flatten(inputStyle) as TextStyle | undefined;

  const baseMinHeight = multilineInput && typeof flattenedInputStyle?.minHeight === 'number' ? flattenedInputStyle.minHeight : 40;

  const [inputHeight, setInputHeight] = React.useState(baseMinHeight);

  const textValue = typeof restProps.value === 'string' ? restProps.value : '';

  const height = multilineInput ? Math.max(baseMinHeight, inputHeight) : 40;

  const displayLabel = getInputLabel(label, isOptional, t);

  const effectivePlaceholder = typeof placeholder === 'string' && placeholder.trim() === label.trim() ? undefined : placeholder;

  const handleContentSizeChange: TextInputProps['onContentSizeChange'] = event => {
    if (!multilineInput) {
      return;
    }

    if (textValue.trim().length === 0) {
      setInputHeight(baseMinHeight);

      return;
    }

    setInputHeight(Math.max(baseMinHeight, event.nativeEvent.contentSize.height));
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <InputLabel label={label} isOptional={isOptional} hasError={Boolean(errorText)} />

      <View style={styles.inputRow}>
        <NativeBottomSheetTextInput
          style={[
            styles.input,
            styles.flexInput,

            disabled && styles.disabledInput,

            multilineInput ? styles.inputMultiline : styles.inputSingleLine,

            {
              borderColor: errorText ? colors.error : colors.border,
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
          accessibilityLabel={restProps.accessibilityLabel ?? displayLabel}
          accessibilityHint={errorText ?? restProps.accessibilityHint}
          value={textValue}
        />

        {suffix ? (
          <ThemedText type="default" style={styles.suffix}>
            {suffix}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
};

export default BottomSheetTextInput;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  flexInput: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    minHeight: 40,
  },
  suffix: {
    flexShrink: 0,
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
