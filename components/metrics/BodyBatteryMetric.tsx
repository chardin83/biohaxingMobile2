import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { EnergySignal } from '@/wearables/types';

import { MetricContainer } from './MetricContainer';

interface BodyBatteryMetricProps {
  readonly energyData?: EnergySignal[];
  readonly showDivider?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export function BodyBatteryMetric({ energyData, showDivider = false, onPress, isSelected }: Readonly<BodyBatteryMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();

  const latestBodyBatteryFromWearable = React.useMemo(() => {
    if (!energyData || energyData.length === 0) {
      return null;
    }

    const latestEnergy = [...energyData].sort((left, right) => left.date.localeCompare(right.date)).at(-1);
    return latestEnergy?.bodyBatteryLevel ?? null;
  }, [energyData]);

  const latestBodyBatteryFromStorage = React.useMemo(() => {
    const latestEntry = getMetricHistory('body_battery')
      .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
      .at(-1);
    return latestEntry?.value ?? null;
  }, [getMetricHistory]);

  const latestBodyBattery = latestBodyBatteryFromStorage ?? latestBodyBatteryFromWearable;

  return (
    <MetricContainer
      showDivider={showDivider}
      isSelected={isSelected}
      onPress={onPress}
      borderColor={isSelected ? colors.chart?.mindBodyBattery || colors.primary : 'transparent'}
    >
        <ThemedText type="label">{t('metrics.bodyBattery.title')}</ThemedText>
        <View style={globalStyles.metricValueContainer}>
          <ThemedText type="title2">{latestBodyBattery ?? '—'}</ThemedText>
          <ThemedText type="caption">%</ThemedText>
        </View>
    </MetricContainer>
  );
}