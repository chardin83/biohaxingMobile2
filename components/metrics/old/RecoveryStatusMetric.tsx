import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { useStoredHRVData } from '@/hooks/useStoredHRVData';
import { calculateHRVMetrics } from '@/utils/hrvCalculations';

function getRecoveryStatus(hrv: number | null, sleepHours: number | null, t: (key: string) => string): string {
  if (hrv && hrv >= 65 && sleepHours && sleepHours >= 7.5) {
    return t('recoveryStatus.readyForActivity');
  } else if (hrv && hrv >= 50 && sleepHours && sleepHours >= 6.5) {
    return t('recoveryStatus.goodRecovery');
  } else {
    return t('recoveryStatus.needRecovery');
  }
}
//* Fitbit and Garmin does not expose Recovery, REMOVE?!
// Recovery score finns i Whoop
//Oura har en "Readiness Score" som är lik 

export function RecoveryStatusMetric() {
  const { t } = useTranslation('metrics');
  const { getMetricHistory } = useStorage();
  const hrvData = useStoredHRVData();
  const sleepHours = React.useMemo(() => {
    const latestEntry = getMetricHistory('sleep_duration')
      .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
      .at(-1);

    if (!latestEntry) {
      return null;
    }

    if (latestEntry.unit === 'hours') {
      return latestEntry.value;
    }

    return latestEntry.value / 60;
  }, [getMetricHistory]);

  const hrv = hrvData.length > 0 ? calculateHRVMetrics(hrvData).hrv : null;
  const recoveryStatus = getRecoveryStatus(hrv, sleepHours, t);

  return (
    <View style={globalStyles.col}>
      <ThemedText type="label">{t('recoveryStatus.title')}</ThemedText>
      <ThemedText type="title3">{recoveryStatus}</ThemedText>
      <ThemedText type="caption">
        {sleepHours ? `${sleepHours.toFixed(1)}h ${t('recoveryStatus.sleep')}` : t('recoveryStatus.noSleepData')}
      </ThemedText>
    </View>
  );
}