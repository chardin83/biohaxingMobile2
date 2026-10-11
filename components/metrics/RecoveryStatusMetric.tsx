import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import { MetricContainer } from '@/components/metrics/MetricContainer';
import { MetricStatusLabel } from '@/components/metrics/MetricStatusLabel';
import { ThemedText } from '@/components/ThemedText';
import { getRecoveryLevel } from '@/utils/recoveryStatus';

export function RecoveryStatusMetric({
  showDivider = false,
  onPress,
  isSelected = false,
}: Readonly<{ showDivider?: boolean; onPress?: () => void; isSelected?: boolean }>) {
  const { colors } = useTheme();
  const { t } = useTranslation('metrics');
  const { getMetricHistory } = useStorage();
  const score = getMetricHistory('recovery_status').at(-1)?.value ?? null;
  const level = score === null ? null : getRecoveryLevel(score);
  const statusByLevel = {
    wellRecovered: 'optimal',
    normalRecovery: 'good',
    reducedRecovery: 'moderate',
    lowRecovery: 'low',
  } as const;

  return (
    <MetricContainer showDivider={showDivider} onPress={onPress} isSelected={isSelected} borderColor={isSelected ? colors.accentStrong : 'transparent'}>
      <ThemedText type="label">{t('recoveryStatus.title')}</ThemedText>
      <MetricStatusLabel status={level === null ? 'unknown' : statusByLevel[level]} label={level === null ? undefined : t(`recoveryStatus.${level}`)} />
      <ThemedText type="caption">{score === null ? t('recoveryStatus.insufficientData') : t('recoveryStatus.score', { score })}</ThemedText>
    </MetricContainer>
  );
}
