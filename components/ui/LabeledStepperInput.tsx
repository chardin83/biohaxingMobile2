import { useTheme } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

import { type IconSymbolName } from './icon-symbol-map';
import { IconSymbol } from './IconSymbol';

type LabeledStepperInputProps = Omit<TextInputProps, 'onChange'> & {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: IconSymbolName;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  decimals?: number;
  isOptional?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

const sanitizeNumber = (raw: string): number | null => {
  const normalized = raw.replace(',', '.').trim();
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumber = (value: number, decimals: number): string => {
  if (decimals <= 0) {
    return String(Math.round(value));
  }

  return value.toFixed(decimals).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
};

const LabeledStepperInput: React.FC<LabeledStepperInputProps> = ({
  label,
  value,
  onChangeText,
  icon,
  unit,
  step = 1,
  min = 0,
  max,
  decimals = 0,
  isOptional,
  containerStyle,
  keyboardType = 'number-pad',
  ...textInputProps
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const parsedValue = useMemo(() => sanitizeNumber(value), [value]);
  const canDecrement = parsedValue !== null && parsedValue > min;

  let suffix = '';
  if (isOptional === true) {
    suffix = ` (${t('labeledInput.optional')})`;
  } else if (isOptional === false) {
    suffix = ` (${t('labeledInput.required')})`;
  }

  const displayLabel = `${label}${suffix}`;

  const applyStep = (direction: -1 | 1) => {
    const factor = 10 ** decimals;
    const stepScaled = Math.round(step * factor);
    const minScaled = Math.round(min * factor);
    const maxScaled = typeof max === 'number' ? Math.round(max * factor) : undefined;

    const currentScaled =
      parsedValue === null ? minScaled : Math.round(parsedValue * factor);

    let nextScaled = currentScaled + direction * stepScaled;

    if (nextScaled < minScaled) {
      nextScaled = minScaled;
    }
    if (typeof maxScaled === 'number' && nextScaled > maxScaled) {
      nextScaled = maxScaled;
    }

    onChangeText(formatNumber(nextScaled / factor, decimals));
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <ThemedText type="label">{displayLabel}</ThemedText>
      <View style={[styles.fieldRow, { borderColor: colors.border }]}> 
        <View style={styles.iconWrap}>
          <IconSymbol name={icon} size={20} color={colors.textTertiary} />
        </View>

        <View style={styles.valueWrap}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={value}
            onChangeText={onChangeText}
            placeholderTextColor={colors.textMuted}
            keyboardType={keyboardType}
            {...textInputProps}
          />

          {unit ? (
            <View style={styles.unitWrap}>
              <ThemedText type="default" style={{ color: colors.textTertiary }}>
                {unit}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.stepperWrap}>
          <TouchableOpacity
            style={[styles.stepperButton, { borderColor: colors.border }]}
            onPress={() => applyStep(-1)}
            disabled={!canDecrement}
            accessibilityRole="button"
            accessibilityLabel={`${label} minus`}
            accessibilityState={{ disabled: !canDecrement }}
          >
            <ThemedText type="defaultSemiBold" style={{ color: canDecrement ? colors.text : colors.textMuted }}>
              -
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stepperButton, { borderColor: colors.border }]}
            onPress={() => applyStep(1)}
            accessibilityRole="button"
            accessibilityLabel={`${label} plus`}
          >
            <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
              +
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default LabeledStepperInput;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  fieldRow: {
    marginTop: 8,
    borderWidth: 2,
    borderRadius: 10,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 8,
    gap: 8,
  },
  iconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 'auto',
  },
  input: {
    minWidth: 44,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  stepperWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  unitWrap: {
    marginLeft: 4,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
