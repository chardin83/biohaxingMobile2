import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import { toDateKey } from '@/utils/dateUtils';
import { WearablePermission } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

import { MetricDataStatus } from './MetricDataStatus';
import { getLatestMetricEntry } from './metricDateUtils';

interface RestingHRMetricProps {
  showDivider?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export function RestingHRMetric({ showDivider = false, onPress, isSelected = false }: Readonly<RestingHRMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const { adapter } = useWearable();
  const [hasPermission, setHasPermission] = React.useState(true);
  const restingHRData = getMetricHistory('resting_hr');

  React.useEffect(() => {
    adapter
      .hasPermission(WearablePermission.restingHeartRate)
      .then(setHasPermission)
      .catch(() => setHasPermission(false));
  }, [adapter]);

  const latest = React.useMemo(() => getLatestMetricEntry(restingHRData), [restingHRData]);
  const isLatestToday = latest?.recordedAt && toDateKey(new Date(latest.recordedAt)) === toDateKey(new Date());
  const previous = restingHRData.at(-2);
  const restingHR = latest?.value;
  const restingHRDelta = restingHR !== undefined && previous?.value !== undefined ? restingHR - previous.value : undefined;

  const content = (
    <View style={styles.contentContainer}>
      <ThemedText type="label">
        {t('metrics:resting_hr.shortName', {
          defaultValue: t('metrics:resting_hr.name'),
        })}
      </ThemedText>
      {restingHR !== undefined && (
        <View style={styles.metricValueContainer}>
          <ThemedText type="title2">{restingHR}</ThemedText>
          <ThemedText type="caption"> bpm</ThemedText>
        </View>
      )}

      <MetricDataStatus recordedAt={latest?.recordedAt} hasPermission={hasPermission} />

      {restingHR !== undefined && isLatestToday && restingHRDelta !== undefined && (
        <ThemedText type="explainer" style={{ color: colors.accentStrong }}>
          {restingHRDelta > 0 ? '+' : ''}
          {restingHRDelta} bpm
        </ThemedText>
      )}
    </View>
  );

  const containerStyle = [
    styles.metricContainer,
    isSelected && {
      backgroundColor: colors.overlayLight,
      borderColor: colors.accentStrong,
    },
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          containerStyle,
          pressed &&
            !isSelected && {
              backgroundColor: colors.overlayLight,
            },
        ]}
      >
        {content}
        {showDivider && <View pointerEvents="none" style={[styles.divider, { backgroundColor: colors.textWeak }]} />}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle}>
      {content}
      {showDivider && <View pointerEvents="none" style={[styles.divider, { backgroundColor: colors.textWeak }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  metricContainer: {
    flex: 1,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 16,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  divider: {
    position: 'absolute',
    top: 16,
    right: 0,
    bottom: 16,
    width: 1,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricMissingValueContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
