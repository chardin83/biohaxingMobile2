import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet,View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';

import { MetricContainer } from './MetricContainer';

interface TotalActivityMetricProps {
  showDivider?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export function TotalActivityMetric({ showDivider = false, onPress, isSelected }: Readonly<TotalActivityMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();

  const activeMinutesFromStorage = React.useMemo(() => {
      const latestEntry = getMetricHistory('active_minutes')
        .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
        .at(-1);
      return latestEntry?.value ?? null;
    }, [getMetricHistory]);

  return (
    <MetricContainer
      showDivider={showDivider}
      isSelected={isSelected}
      onPress={onPress}
      borderColor={isSelected ? colors.primary : 'transparent'}
    >
      <View style={styles.contentContainer}>
        <ThemedText type="label">{t("metrics:activeMinutes.shortName")}</ThemedText>
        <ThemedText type="title2">{activeMinutesFromStorage ?? '—'}</ThemedText>
      </View>
    </MetricContainer>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
