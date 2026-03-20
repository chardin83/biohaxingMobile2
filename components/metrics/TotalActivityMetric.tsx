import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet,View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { DailyActivity } from '@/wearables/types';

import { MetricContainer } from './MetricContainer';

interface TotalActivityMetricProps {
  activityData?: DailyActivity[];
  showDivider?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export function TotalActivityMetric({ activityData, showDivider = false, onPress, isSelected }: Readonly<TotalActivityMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Summera alla aktivitetstyper (t.ex. steg, intensiva minuter, aktiva minuter)
  const totalActiveMinutes = React.useMemo(() => {
    if (!activityData || activityData.length === 0) return 0;
    return activityData.reduce((sum, act) => sum + (typeof act.activeMinutes === 'number' ? act.activeMinutes : 0), 0);
  }, [activityData]);


  return (
    <MetricContainer
      showDivider={showDivider}
      isSelected={isSelected}
      onPress={onPress}
      borderColor={isSelected ? colors.primary : 'transparent'}
    >
      <View style={styles.contentContainer}>
        <ThemedText type="label">{t("metrics:activeMinutes.shortName")}</ThemedText>
        <ThemedText type="title2">{totalActiveMinutes ?? '—'}</ThemedText>
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
