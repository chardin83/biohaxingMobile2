import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';

interface RemSleepMetricProps {
  labelType?: 'label' | 'default';
  valueType?: 'title2' | 'title3';
  showDivider?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export function RemSleepMetric({
  labelType = 'label',
  valueType = 'title2',
  showDivider = false,
  onPress,
  isSelected = false,
}: Readonly<RemSleepMetricProps>) {
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const { colors } = useTheme();

  const latestRemSleep = React.useMemo(() => {
    const latestEntry = getMetricHistory('rem_sleep')
      .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
      .at(-1);

    if (!latestEntry) {
      return null;
    }

    return Math.round(latestEntry.value);
  }, [getMetricHistory]);

  const content = (
    <View style={styles.contentContainer}>
      <ThemedText type={labelType}>{t('metrics:sleepStages.remSleep.title')}</ThemedText>
      <ThemedText type={valueType}>{latestRemSleep ?? '\u2014'}</ThemedText>
      <ThemedText type="caption">{t('metrics:sleepStages.remSleep.minutes')}</ThemedText>
    </View>
  );

  const containerStyle = [
    styles.metricContainer,
    isSelected && { backgroundColor: colors.overlayLight, borderColor: colors.accentStrong },
    // showDivider && styles.divider,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          containerStyle,
          pressed && !isSelected && { backgroundColor: colors.overlayLight },
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
