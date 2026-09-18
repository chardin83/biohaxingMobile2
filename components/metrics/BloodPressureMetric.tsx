import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { MetricDataStatus } from '@/components/metrics/MetricDataStatus';
import { ThemedText } from '@/components/ThemedText';
import { WearablePermission } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

import { MetricContainer } from './MetricContainer';
import { getLatestMetricEntry } from './metricDateUtils';

interface BloodPressureMetricProps {
  readonly showDivider?: boolean;
  readonly onPress?: () => void;
  readonly isSelected?: boolean;
}

type BloodPressureStatus = 'low' | 'optimal' | 'elevated' | 'high' | 'unknown';

function getBloodPressureStatus(systolic?: number, diastolic?: number): BloodPressureStatus {
  if (systolic == null && diastolic == null) {
    return 'unknown';
  }
  if ((systolic != null && systolic >= 140) || (diastolic != null && diastolic >= 90)) {
    return 'high';
  }
  if ((systolic != null && systolic < 90) || (diastolic != null && diastolic < 60)) {
    return 'low';
  }
  if ((systolic != null && systolic >= 120) || (diastolic != null && diastolic >= 80)) {
    return 'elevated';
  }
  return 'optimal';
}

export function BloodPressureMetric({ showDivider = false, onPress, isSelected = false }: Readonly<BloodPressureMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const { adapter } = useWearable();
  const [hasPermission, setHasPermission] = React.useState(true);

  React.useEffect(() => {
    adapter
      .hasPermission(WearablePermission.bloodPressure)
      .then(setHasPermission)
      .catch(() => setHasPermission(false));
  }, [adapter]);

  const systolic = React.useMemo(() => getLatestMetricEntry(getMetricHistory('systolic_bp')), [getMetricHistory]);

  const diastolic = React.useMemo(() => getLatestMetricEntry(getMetricHistory('diastolic_bp')), [getMetricHistory]);

  const status = getBloodPressureStatus(systolic?.value, diastolic?.value);

  const styles = React.useMemo(() => createStyles(colors), [colors]);

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

  const hasReading = systolic?.value != null && diastolic?.value != null;

  const recordedAt = systolic?.recordedAt ?? diastolic?.recordedAt;

  return (
    <MetricContainer showDivider={showDivider} isSelected={isSelected} onPress={onPress} borderColor={isSelected ? colors.accentStrong : 'transparent'}>
      <View style={styles.contentContainer}>
        <ThemedText type="label" numberOfLines={1} ellipsizeMode="tail" style={styles.label}>
          {t('metrics:bloodPressure.name', {
            defaultValue: 'Blodtryck',
          })}
        </ThemedText>

        {hasReading && (
          <>
            <ThemedText type="title2" style={statusStyle}>
              {statusLabel}
            </ThemedText>

            <View style={styles.valueRow}>
              <ThemedText type="caption">
                {Math.round(systolic.value)}/{Math.round(diastolic.value)}
              </ThemedText>

              <ThemedText type="caption" style={styles.unit}>
                mmHg
              </ThemedText>
            </View>
          </>
        )}

        <MetricDataStatus recordedAt={recordedAt} hasPermission={hasPermission} />
      </View>
    </MetricContainer>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    contentContainer: {
      flex: 1,
    },
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
      color: colors.warningColor,
    },
    statusOptimal: {
      marginTop: 2,
      fontWeight: '600',
      color: colors.positiveColor,
    },
    statusLow: {
      marginTop: 2,
      fontWeight: '600',
      color: colors.infoColor,
    },
  });
