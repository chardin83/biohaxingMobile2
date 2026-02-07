import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { EnergySignal } from '@/wearables/types';

interface BodyBatteryMetricProps {
  readonly energyData: EnergySignal[];
  readonly showDivider?: boolean;
}

export function BodyBatteryMetric({ energyData, showDivider = false }: BodyBatteryMetricProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Plocka ut senaste bodyBatteryLevel från energyData
  const latestBodyBattery = energyData.length > 0
    ? energyData.at(-1)?.bodyBatteryLevel ?? null
    : null;

  return (
    <View
      style={[
        globalStyles.col,
        showDivider && [globalStyles.colWithDivider, { borderRightColor: colors.textWeak }],
      ]}
    >
      <ThemedText type="label">{t('metrics.bodyBattery.title')}</ThemedText>
      <View style={globalStyles.metricValueContainer}>
        <ThemedText type="title2">{latestBodyBattery ?? '—'}</ThemedText>
        <ThemedText type="caption">%</ThemedText>
      </View>
    </View>
  );
}