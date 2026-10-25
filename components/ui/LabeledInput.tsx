import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, useWindowDimensions, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

import { IconSymbol } from './IconSymbol';

const InputRowErrorContext = React.createContext<((id: string, hasError: boolean) => void) | null>(null);

function InputHelp({ text }: Readonly<{ text: string }>) {
  const { colors } = useTheme();
  return (
    <View style={styles.helpRow}>
      <IconSymbol name="info" size={14} color={colors.textMuted} />
      <ThemedText type="caption" style={[styles.helpText, { color: colors.textMuted }]}>
        {text}
      </ThemedText>
    </View>
  );
}

/** Shared helper text spans the full width beneath adjacent inputs. */
export function LabeledInputRow({ children, helperText }: Readonly<{ children: React.ReactNode; helperText?: string }>) {
  const [errors, setErrors] = React.useState<Set<string>>(() => new Set());
  const reportError = React.useCallback((id: string, hasError: boolean) => {
    setErrors(current => {
      if (current.has(id) === hasError) return current;
      const next = new Set(current);
      if (hasError) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  return (
    <InputRowErrorContext.Provider value={reportError}>
      <View>
        <View style={styles.fieldsRow}>{children}</View>
        {helperText && errors.size === 0 && <InputHelp text={helperText} />}
      </View>
    </InputRowErrorContext.Provider>
  );
}

type Props = TextInputProps & {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  multilineInput?: boolean;
  isOptional?: boolean;
  disabled?: boolean;
  suffix?: string;
  helperText?: string;
  errorText?: string;
};

const LabeledInput: React.FC<Props> = ({
  label,
  containerStyle,
  inputStyle,
  multilineInput = false,
  isOptional,
  disabled = false,
  suffix,
  helperText,
  errorText,
  ...textInputProps
}) => {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const { t } = useTranslation();
  const { placeholder, ...restProps } = textInputProps;
  const flattenedInputStyle = StyleSheet.flatten(inputStyle) as TextStyle | undefined;
  const baseMinHeight = multilineInput && typeof flattenedInputStyle?.minHeight === 'number' ? flattenedInputStyle.minHeight : Math.max(48, 40 * fontScale);

  const [inputHeight, setInputHeight] = React.useState(baseMinHeight);
  const [hasEdited, setHasEdited] = React.useState(false);
  const textValue = typeof restProps.value === 'string' ? restProps.value : '';
  const displayedError = errorText || (!disabled && isOptional === false && hasEdited && textValue.trim() === '' ? t('labeledInput.requiredError') : undefined);
  const reportError = React.useContext(InputRowErrorContext);
  const inputId = React.useId();
  const hasError = Boolean(displayedError);
  React.useEffect(() => {
    reportError?.(inputId, hasError);
    return () => reportError?.(inputId, false);
  }, [reportError, inputId, hasError]);

  const height = multilineInput ? Math.max(baseMinHeight, inputHeight) : baseMinHeight;

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
            borderColor: displayedError ? colors.error : colors.border,
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
          accessibilityLabel={restProps.accessibilityLabel ?? `${displayLabel}${suffix ? `, ${suffix}` : ''}`}
          accessibilityHint={displayedError ?? helperText ?? restProps.accessibilityHint}
          accessibilityState={{ ...restProps.accessibilityState, disabled }}
          value={textValue}
          onChangeText={text => {
            setHasEdited(true);
            restProps.onChangeText?.(text);
          }}
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
      {displayedError && (
        <ThemedText type="caption" accessibilityLiveRegion="polite" style={[styles.errorText, { color: colors.error }]}>
          {displayedError}
        </ThemedText>
      )}
      {helperText && !displayedError && <InputHelp text={helperText} />}
    </View>
  );
};

export default LabeledInput;

const styles = StyleSheet.create({
  errorText: { marginTop: 4 },
  fieldsRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  helpRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
  helpText: { flex: 1, marginTop: -4 },
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
