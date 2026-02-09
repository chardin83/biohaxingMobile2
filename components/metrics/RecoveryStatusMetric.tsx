import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { calculateHRVMetrics } from '@/utils/hrvCalculations';
import { HRVSummary } from '@/wearables/types';

interface RecoveryStatusMetricProps {
  hrvData: HRVSummary[];
  sleepHours: number | null;
}

function getRecoveryStatus(hrv: number | null, sleepHours: number | null, t: (key: string) => string): string {
  if (hrv && hrv >= 65 && sleepHours && sleepHours >= 7.5) {
    return t('metrics.readyForActivity');
  } else if (hrv && hrv >= 50 && sleepHours && sleepHours >= 6.5) {
    return t('metrics.goodRecovery');
  } else {
    return t('metrics.needRecovery');
  }
}

export function RecoveryStatusMetric({ hrvData, sleepHours }: Readonly<RecoveryStatusMetricProps>) {
  const { t } = useTranslation();
  const hrv = hrvData.length > 0 ? calculateHRVMetrics(hrvData).hrv : null;
  const recoveryStatus = getRecoveryStatus(hrv, sleepHours, t);

  return (
    <View style={globalStyles.col}>
      <ThemedText type="label">{t("metrics.recoveryStatus.title")}</ThemedText>
      <ThemedText type="title3">{recoveryStatus}</ThemedText>
      <ThemedText type="caption">
        {sleepHours ? `${sleepHours.toFixed(1)}h ${t("metrics.sleep")}` : t("metrics.noSleepData")}
      </ThemedText>
    </View>
  );
}