import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { MetricDataStatus } from '@/components/metrics/MetricDataStatus';
import { ThemedText } from '@/components/ThemedText';
import { WearablePermission } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

import { getLatestMetricEntry } from '@/utils/metricDateUtils';

interface RemSleepMetricProps {
  readonly labelType?: 'label' | 'default';
  readonly valueType?: 'title2' | 'title3';
  readonly showDivider?: boolean;
  readonly onPress?: () => void;
  readonly isSelected?: boolean;
}

export function RemSleepMetric({ labelType = 'label', valueType = 'title2', showDivider = false, onPress, isSelected = false }: RemSleepMetricProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { getMetricHistory } = useStorage();
  const { adapter } = useWearable();
  const [hasPermission, setHasPermission] = React.useState(true);
  const remSleepData = getMetricHistory('rem_sleep');

  React.useEffect(() => {
    adapter
      .hasPermission(WearablePermission.sleep)
      .then(setHasPermission)
      .catch(() => setHasPermission(false));
  }, [adapter]);

  const latest = React.useMemo(() => getLatestMetricEntry(remSleepData), [remSleepData]);
  const remSleep = latest?.value;

  const content = (
    <View style={styles.contentContainer}>
      <ThemedText type={labelType}>{t('metrics:sleepStages.remSleep.title')}</ThemedText>
      {remSleep !== undefined && (
        <>
          <ThemedText type={valueType}>{Math.round(remSleep)}</ThemedText>
          <ThemedText type="caption">{t('metrics:sleepStages.remSleep.minutes')}</ThemedText>
        </>
      )}
      <MetricDataStatus recordedAt={latest?.recordedAt} hasPermission={hasPermission} />
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
        {showDivider && <View pointerEvents="none" style={[styles.dividerBar, { backgroundColor: colors.borderLight }]} />}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle}>
      {content}
      {showDivider && <View pointerEvents="none" style={[styles.dividerBar, { backgroundColor: colors.borderLight }]} />}
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
  dividerBar: {
    position: 'absolute',
    top: 16,
    right: 0,
    bottom: 16,
    width: 1,
  },
});
