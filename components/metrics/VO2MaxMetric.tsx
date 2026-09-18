import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { MetricDataStatus } from '@/components/metrics/MetricDataStatus';
import { ThemedText } from '@/components/ThemedText';
import { toDateKey } from '@/utils/dateUtils';
import { getLatestMetricEntry } from '@/utils/metricDateUtils';
import { WearablePermission } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

interface VO2MaxMetricProps {
  readonly trend?: number;
  readonly showDivider?: boolean;
  readonly onPress?: () => void;
  readonly isSelected?: boolean;
}

export function VO2MaxMetric({ trend, showDivider = false, onPress, isSelected = false }: VO2MaxMetricProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const { adapter } = useWearable();
  const [hasPermission, setHasPermission] = React.useState(true);
  const vo2maxData = getMetricHistory('vo2_max');

  React.useEffect(() => {
    adapter
      .hasPermission(WearablePermission.vo2Max)
      .then(setHasPermission)
      .catch(() => setHasPermission(false));
  }, [adapter]);

  const latest = React.useMemo(() => getLatestMetricEntry(vo2maxData), [vo2maxData]);

  const vo2max = latest?.value;

  const isLatestToday = latest?.recordedAt !== undefined && toDateKey(new Date(latest.recordedAt)) === toDateKey(new Date());
  const content = (
    <View style={styles.contentContainer}>
      <ThemedText type="label">{t('metrics:vo2_max.shortName')}</ThemedText>
      {vo2max !== undefined && (
        <View style={styles.metricValueContainer}>
          <ThemedText type="title2">{vo2max}</ThemedText>
          <ThemedText type="caption"> ml/kg/min</ThemedText>
        </View>
      )}
      <MetricDataStatus recordedAt={latest?.recordedAt} hasPermission={hasPermission} />
      {vo2max !== undefined && isLatestToday && trend !== undefined && (
        <ThemedText type="explainer" style={{ color: colors.accentStrong }}>
          {trend > 0 ? '+' : ''}
          {trend}% trend
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
        {showDivider && <View pointerEvents="none" style={[styles.divider, { backgroundColor: colors.borderLight }]} />}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle}>
      {content}
      {showDivider && <View pointerEvents="none" style={[styles.divider, { backgroundColor: colors.borderLight }]} />}
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
