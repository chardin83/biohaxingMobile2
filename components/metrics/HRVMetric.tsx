import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { MetricDataStatus } from '@/components/metrics/MetricDataStatus';
import { ThemedText } from '@/components/ThemedText';
import { toDateKey } from '@/utils/dateUtils';
import { WearablePermission } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

interface HRVMetricProps {
  readonly showDivider?: boolean;
  readonly onPress?: () => void;
  readonly isSelected?: boolean;
}

export function HRVMetric({ showDivider = false, onPress, isSelected = false }: HRVMetricProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const { adapter } = useWearable();
  const [hasPermission, setHasPermission] = React.useState(true);
  const hrvData = getMetricHistory('hrv');

  React.useEffect(() => {
    adapter
      .hasPermission(WearablePermission.hrv)
      .then(setHasPermission)
      .catch(() => setHasPermission(false));
  }, [adapter]);

  const latest = hrvData.at(-1);
  const previous = hrvData.at(-2);
  const hrv = latest?.value;
  const hrvDelta = hrv !== undefined && previous?.value !== undefined ? ((hrv - previous.value) / previous.value) * 100 : undefined;
  const isLatestToday = latest?.recordedAt !== undefined && toDateKey(new Date(latest.recordedAt)) === toDateKey(new Date());

  const content = (
    <View style={styles.contentContainer}>
      <ThemedText type="label">
        {t('metrics:hrv.shortName', {
          defaultValue: t('metrics:hrv.name'),
        })}
      </ThemedText>
      {hrv !== undefined && (
        <View style={styles.metricValueContainer}>
          <ThemedText type="title2">{Math.round(hrv)}</ThemedText>
          <ThemedText type="caption"> ms</ThemedText>
        </View>
      )}
      <MetricDataStatus recordedAt={latest?.recordedAt} hasPermission={hasPermission} />
      {hrv !== undefined && isLatestToday && hrvDelta !== undefined && (
        <ThemedText type="explainer" style={{ color: colors.accentStrong }}>
          {hrvDelta > 0 ? '+' : ''}
          {Math.round(hrvDelta)}%
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
});
