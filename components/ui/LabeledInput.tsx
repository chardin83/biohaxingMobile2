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
  isOptional?: boolean;
  disabled?: boolean;
  suffix?: string;
};

const LabeledInput: React.FC<Props> = ({
  label,
  containerStyle,
  inputStyle,
  multilineInput = false,
  isOptional,
  disabled = false,
  suffix,
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

  let labelSuffix = '';

  if (isOptional === true) {
    labelSuffix = ` (${t('labeledInput.optional')})`;
  } else if (isOptional === false) {
    labelSuffix = ` (${t('labeledInput.required')})`;
  }

  const displayLabel = `${label}${labelSuffix}`;

  const effectivePlaceholder = typeof placeholder === 'string' && placeholder.trim() === label.trim() ? undefined : placeholder;

  const handleContentSizeChange: TextInputProps['onContentSizeChange'] = e => {
    if (!multilineInput) return;

    if (textValue.trim().length === 0) {
      setInputHeight(baseMinHeight);
      return;
    }

    setInputHeight(Math.max(baseMinHeight, e.nativeEvent.contentSize.height));
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <ThemedText type="label">{displayLabel}</ThemedText>

      <View
        style={[
          styles.inputContainer,
          disabled && styles.disabledInput,
          {
            borderColor: colors.border,
            height,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            multilineInput ? styles.inputMultiline : styles.inputSingleLine,
            {
              color: colors.text,
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

        {suffix ? (
          <ThemedText
            type="default"
            style={[
              styles.suffix,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {suffix}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
};

export default LabeledInput;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 8,
    minHeight: 40,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
  suffix: {
    paddingRight: 10,
    paddingLeft: 4,
  },
  keyboardAccessory: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
