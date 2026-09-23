import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { MetricStatus } from '@/types/metricStatuses';

interface MetricStatusLabelProps {
  readonly status: MetricStatus;
}

export function MetricStatusLabel({ status }: Readonly<MetricStatusLabelProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const config = {
    unknown: {
      label: '—',
      color: colors.metricStatus.neutral,
    },
    low: {
      label: t('metrics:metricStatus.low'),
      color: colors.metricStatus.low,
    },
    moderate: {
      label: t('metrics:metricStatus.moderate'),
      color: colors.metricStatus.moderate,
    },
    good: {
      label: t('metrics:metricStatus.good'),
      color: colors.metricStatus.good,
    },
    optimal: {
      label: t('metrics:metricStatus.optimal'),
      color: colors.metricStatus.optimal,
    },
    elevated: {
      label: t('metrics:metricStatus.elevated'),
      color: colors.metricStatus.elevated,
    },
    high: {
      label: t('metrics:metricStatus.high'),
      color: colors.metricStatus.high,
    },
    closeToBedtime: {
      label: t('metrics:metricStatus.closeToBedtime'),
      color: colors.metricStatus.elevated,
    },
    tooCloseToBedtime: {
      label: t('metrics:metricStatus.tooCloseToBedtime'),
      color: colors.metricStatus.high,
    },
  } satisfies Record<MetricStatus, { label: string; color: string }>;

  const { label, color } = config[status];

  return (
    <View style={styles.statusContainer}>
      <ThemedText type="title3" style={{ color }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  statusContainer: {
    minHeight: 32,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
});
