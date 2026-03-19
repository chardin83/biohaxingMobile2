import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { SleepSummary } from '@/wearables/types';

interface SleepMetricProps {
  sleepData: SleepSummary[];
  showDivider?: boolean;
}

export function SleepMetric({ sleepData, showDivider = false }: Readonly<SleepMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const latestSleepWithDuration = React.useMemo(() => {
    const validSleepEntries = sleepData.filter(entry => typeof entry.durationMinutes === 'number');

    if (validSleepEntries.length === 0) {
      return undefined;
    }

    return validSleepEntries.reduce((latest, current) => {
      if (!latest) {
        return current;
      }

      return current.date > latest.date ? current : latest;
    }, validSleepEntries[0]);
  }, [sleepData]);
  const sleepMinutes = latestSleepWithDuration?.durationMinutes ?? null;
  const sleepHours = sleepMinutes ? Math.floor(sleepMinutes / 60) : null;
  const sleepMins = sleepMinutes ? sleepMinutes % 60 : null;
  const efficiency = latestSleepWithDuration?.efficiencyPct ?? null;

  return (
    <View
      style={[
        globalStyles.col,
        showDivider && [globalStyles.colWithDivider, { borderRightColor: colors.textWeak }],
      ]}
    >
      <ThemedText type="label">{t('metrics:sleep_duration.name')}</ThemedText>
      <View style={globalStyles.metricValueContainer}>
        {sleepMinutes === null ? (
          <ThemedText type="title2">—</ThemedText>
        ) : (
          <>
            <ThemedText type="title2">{sleepHours}</ThemedText>
            <ThemedText type="caption">h </ThemedText>
            <ThemedText type="title2">{String(sleepMins).padStart(2, '0')}</ThemedText>
            <ThemedText type="caption">m</ThemedText>
          </>
        )}
      </View>
      {efficiency !== null && (
        <ThemedText type="explainer" style={{ color: colors.accentStrong }}>
          {efficiency}% efficiency
        </ThemedText>
      )}
      {latestSleepWithDuration && latestSleepWithDuration.source !== 'none' && (
        <ThemedText type="explainer">
          {latestSleepWithDuration.source}
        </ThemedText>
      )}
    </View>
  );
}
