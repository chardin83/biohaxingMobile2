import { isVitaminTargetTag, VITAMIN_DISPLAY_UNITS, type VitaminType } from '@/constants/vitamins';

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

export const formatVitaminValue = (valueMg: number, displayUnit: string): string => {
  if (displayUnit === 'mcg') {
    const mcgValue = valueMg * 1000;
    if (mcgValue === 0) return `0${displayUnit}`;
    if (mcgValue < 10) return `${mcgValue.toFixed(2)}${displayUnit}`;
    return `${mcgValue.toFixed(1)}${displayUnit}`;
  }
  // Default mg formatting
  return `${formatMilligramAmount(valueMg)}mg`;
};

export const formatWithUnit = (value: number, unit: string, tag?: string): string => {
  // Check if this is a vitamin with a custom display unit
  if (tag && isVitaminTargetTag(tag)) {
    const displayUnit = VITAMIN_DISPLAY_UNITS[tag as VitaminType];
    return formatVitaminValue(value, displayUnit);
  }

  const amount = unit === 'mg' ? formatMilligramAmount(value) : formatAmount(value);
  if (!unit) return amount;
  if (unit === 'mg' || unit === 'g') return `${amount}${unit}`;
  return `${amount} ${unit}`;
};
