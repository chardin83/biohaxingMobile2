import i18n from '@/app/i18n';
import { isMineralTargetTag, MINERAL_DISPLAY_UNITS } from '@/constants/minerals';
import { isVitaminTargetTag, VITAMIN_DISPLAY_UNITS } from '@/constants/vitamins';

const getTranslatedUnit = (unit: string): string => {
  return i18n.t(`common:general.targetUnits.${unit}`, {
    defaultValue: unit,
  });
};

export const formatAmount = (value: number): string => {
  if (value === 0) return '0';
  if (value < 1) return value.toFixed(2);
  if (value < 10) return value.toFixed(1);
  return value.toFixed(0);
};

export const formatMilligramAmount = (value: number): string => {
  if (value === 0) return '0';
  if (value < 0.01) return value.toFixed(4);
  if (value < 0.1) return value.toFixed(3);
  if (value < 1) return value.toFixed(2);
  if (value < 10) return value.toFixed(1);
  return value.toFixed(0);
};

export const formatValue = (valueMg: number, displayUnit: string): string => {
  if (displayUnit === 'μg') {
    const mcgValue = valueMg * 1000;
    const translatedUnit = getTranslatedUnit(displayUnit);
    if (mcgValue === 0) return `0${translatedUnit}`;
    if (mcgValue < 10) return `${mcgValue.toFixed(2)}${translatedUnit}`;
    return `${mcgValue.toFixed(1)}${translatedUnit}`;
  }
  // Default mg formatting
  return `${formatMilligramAmount(valueMg)}${getTranslatedUnit('mg')}`;
};

export const formatWithUnit = (value: number, unit: string, tag?: string): string => {
  // Check if this is a vitamin with a custom display unit
  if (tag && isVitaminTargetTag(tag)) {
    const displayUnit = VITAMIN_DISPLAY_UNITS[tag];
    return formatValue(value, displayUnit);
  }

  // Check if this is a mineral with a custom display unit
  if (tag && isMineralTargetTag(tag)) {
    const displayUnit = MINERAL_DISPLAY_UNITS[tag];
    return formatValue(value, displayUnit);
  }

  if (unit === 'items' || unit === 'count' || unit === 'plants') {
    const amount = `${Math.round(value)}`;
    const translatedUnit = getTranslatedUnit(unit);
    return `${amount} ${translatedUnit}`;
  }

  const amount = unit === 'mg' ? formatMilligramAmount(value) : formatAmount(value);
  if (!unit) return amount;
  if (unit === 'mg' || unit === 'g') return `${amount}${getTranslatedUnit(unit)}`;
  return `${amount} ${unit}`;
};
