import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { toDateKey } from '@/utils/dateUtils';

import { IconSymbol } from '../ui/IconSymbol';

interface MetricDataStatusProps {
  readonly recordedAt?: string;
  readonly hasPermission: boolean;
}

export function MetricDataStatus({ recordedAt, hasPermission }: MetricDataStatusProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  if (recordedAt) {
    const isToday = toDateKey(new Date(recordedAt)) === toDateKey(new Date());

    if (isToday) {
      return null;
    }

    return (
      <View style={styles.warningContainer}>
        <IconSymbol name="warning" size={16} color={colors.gold} style={styles.warningIcon} />
        <ThemedText type="pill" style={{ color: colors.gold }}>
          {new Date(recordedAt).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
          })}
        </ThemedText>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.missingContainer}>
        <ThemedText type="title2">—</ThemedText>
        <View style={styles.warningContainer}>
          <IconSymbol name="warning" size={16} color={colors.gold} style={styles.warningIcon} />
          <ThemedText type="pill" style={{ color: colors.gold }}>
            {t('metrics:warnings.missing_permission')}
          </ThemedText>
        </View>
        <ThemedText type="pill" style={{ color: colors.accentStrong }}>
          {t('metrics:warnings.register_manually')}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.missingContainer}>
      <ThemedText type="title2">—</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  missingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    marginRight: 4,
  },
});
