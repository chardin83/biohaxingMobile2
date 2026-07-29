import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';

import { MetricContainer } from './MetricContainer';

interface BloodPressureMetricProps {
  showDivider?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

type BloodPressureStatus =
  | 'low'
  | 'optimal'
  | 'elevated'
  | 'high'
  | 'unknown';

interface MetricHistoryEntry {
  recordedAt: string;
  value: number;
}

interface BloodPressureReading {
  systolic?: number;
  diastolic?: number;
  recordedAt?: string;
}

function getLatestEntry(
  entries: MetricHistoryEntry[],
): MetricHistoryEntry | undefined {
  return entries.reduce<MetricHistoryEntry | undefined>(
    (latest, entry) => {
      if (!latest) {
        return entry;
      }

      return new Date(entry.recordedAt).getTime() >
        new Date(latest.recordedAt).getTime()
        ? entry
        : latest;
    },
    undefined,
  );
}

function getLatestBloodPressureReading(
  systolicHistory: MetricHistoryEntry[],
  diastolicHistory: MetricHistoryEntry[],
): BloodPressureReading {
  const latestSystolic = getLatestEntry(systolicHistory);
  const latestDiastolic = getLatestEntry(diastolicHistory);

  if (!latestSystolic && !latestDiastolic) {
    return {};
  }

  const latestRecordedAt = [
    latestSystolic?.recordedAt,
    latestDiastolic?.recordedAt,
  ]
    .filter((value): value is string => Boolean(value))
    .sort(
      (first, second) =>
        new Date(second).getTime() -
        new Date(first).getTime(),
    )[0];

  return {
    systolic: latestSystolic?.value,
    diastolic: latestDiastolic?.value,
    recordedAt: latestRecordedAt,
  };
}

function getBloodPressureStatus(
  systolic?: number,
  diastolic?: number,
): BloodPressureStatus {
  if (systolic == null && diastolic == null) {
    return 'unknown';
  }

  if (
    (systolic != null && systolic >= 140) ||
    (diastolic != null && diastolic >= 90)
  ) {
    return 'high';
  }

  if (
    (systolic != null && systolic < 90) ||
    (diastolic != null && diastolic < 60)
  ) {
    return 'low';
  }

  if (
    (systolic != null && systolic >= 120) ||
    (diastolic != null && diastolic >= 80)
  ) {
    return 'elevated';
  }

  return 'optimal';
}

export function BloodPressureMetric({
  showDivider = false,
  onPress,
  isSelected = false,
}: Readonly<BloodPressureMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();

  const styles = React.useMemo(
    () => createStyles(colors),
    [colors],
  );

  const reading = React.useMemo(() => {
    const systolicHistory =
      getMetricHistory('systolic_bp');

    const diastolicHistory =
      getMetricHistory('diastolic_bp');

    return getLatestBloodPressureReading(
      systolicHistory,
      diastolicHistory,
    );
  }, [getMetricHistory]);

  const status = getBloodPressureStatus(
    reading.systolic,
    reading.diastolic,
  );

  const statusLabel = React.useMemo(() => {
    switch (status) {
      case 'high':
        return t('metrics:common.high');

      case 'elevated':
        return t('metrics:common.elevated', {
          defaultValue: 'Förhöjt',
        });

      case 'low':
        return t('metrics:common.low');

      case 'optimal':
        return t('metrics:common.optimal');

      default:
        return '—';
    }
  }, [status, t]);

  const statusStyle = React.useMemo(() => {
    switch (status) {
      case 'high':
        return styles.statusHigh;

      case 'elevated':
        return styles.statusElevated;

      case 'low':
        return styles.statusLow;

      case 'optimal':
        return styles.statusOptimal;

      default:
        return styles.statusNeutral;
    }
  }, [status, styles]);

  const formattedReading =
    reading.systolic != null &&
    reading.diastolic != null
      ? `${Math.round(reading.systolic)}/${Math.round(
          reading.diastolic,
        )}`
      : '—';

  const hasData =
    reading.systolic != null ||
    reading.diastolic != null;

  return (
    <MetricContainer
      showDivider={showDivider}
      isSelected={isSelected}
      onPress={onPress}
      borderColor={
        isSelected
          ? colors.accentStrong
          : 'transparent'
      }
    >
      <ThemedText
        type="label"
        numberOfLines={1}
        ellipsizeMode="tail"
        style={styles.label}
      >
        {t('metrics:bloodPressure.name', {
          defaultValue: 'Blodtryck',
        })}
      </ThemedText>

      <ThemedText
        type="title2"
        style={statusStyle}
      >
        {statusLabel}
      </ThemedText>

      <View style={styles.valueRow}>
        <ThemedText type="caption">
          {formattedReading}
        </ThemedText>

        {hasData && (
          <ThemedText
            type="caption"
            style={styles.unit}
          >
            mmHg
          </ThemedText>
        )}
      </View>

      {hasData && (
        <View style={styles.footer}>
          <ThemedText type="caption">
            {t(
              'metrics:bloodPressure.latestMeasurement',
              {
                defaultValue: 'Senaste mätning',
              },
            )}
          </ThemedText>
        </View>
      )}
    </MetricContainer>
  );
}

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
) =>
  StyleSheet.create({
    label: {
      flexShrink: 1,
      marginRight: 8,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      flexWrap: 'nowrap',
    },
    unit: {
      marginLeft: 4,
      color: colors.textSecondary,
    },
    footer: {
      marginTop: 2,
    },
    statusNeutral: {
      marginTop: 2,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    statusHigh: {
      marginTop: 2,
      fontWeight: '600',
      color: colors.warmColor,
    },
    statusElevated: {
      marginTop: 2,
      fontWeight: '600',
      color: colors.warmColor,
    },
    statusOptimal: {
      marginTop: 2,
      fontWeight: '600',
      color: colors.successColor,
    },
    statusLow: {
      marginTop: 2,
      fontWeight: '600',
      color: colors.infoColor,
    },
  });