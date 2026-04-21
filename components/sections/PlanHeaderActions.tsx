import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleProp, StyleSheet,TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PlanEditActions from '@/components/ui/PlanEditActions';
import { tipMetricLinks } from '@/locales/metrics';

interface PlanHeaderActionsProps {
  tipId?: string | null;
  trainingSettingsKey: string;
  tipTitle: string | null;
  t: (key: string, options?: any) => string;
  openMetricsSheet: (key: string) => void;
  openTrainingSettingsModal: (key: string, title?: string | null) => void;
  styles: {
    headerActionsContainer: StyleProp<ViewStyle>;
    chartButton: StyleProp<ViewStyle>;
    chartEmoji: StyleProp<TextStyle>;
    chartEmojiDisabled: StyleProp<TextStyle>;
    planHeaderActions: StyleProp<ViewStyle>;
  };
}

export const PlanHeaderActions: React.FC<PlanHeaderActionsProps> = ({
  tipId,
  trainingSettingsKey,
  tipTitle,
  t,
  openMetricsSheet,
  openTrainingSettingsModal,
  styles,
}) => {
  const { colors } = useTheme();

  // Calculate metricCount here using tipMetricLinks
  const metricLinks = tipId && tipMetricLinks[tipId] ? tipMetricLinks[tipId] : [];
  const uniqueMetricIds = new Set(metricLinks.map(link => link.metricId));
  const metricCount = uniqueMetricIds.size;
  const chartDisabled = metricLinks.length === 0;

  return (
    <View style={styles.headerActionsContainer}>
      <TouchableOpacity
        onPress={chartDisabled ? undefined : () => openMetricsSheet(trainingSettingsKey)}
        style={[styles.chartButton, chartDisabled && localStyles.chartButtonDisabled]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        disabled={chartDisabled}
        accessibilityState={{ disabled: chartDisabled }}
      >
        <View style={localStyles.chartButtonRow}>
          <IconSymbol name="chart" size={28} color={colors.icon} style={chartDisabled ? localStyles.chartButtonDisabled : undefined} />

          {metricCount > 0 && (
            <ThemedText style={[styles.chartEmoji, chartDisabled && styles.chartEmojiDisabled]}> {metricCount}</ThemedText>
          )}
        </View>
      </TouchableOpacity>
      <PlanEditActions
        onEdit={() => openTrainingSettingsModal(trainingSettingsKey, tipTitle)}
        editLabel={t('plan.editTrainingSettings')}
        style={styles.planHeaderActions}
      />
    </View>
  );
};

const localStyles = StyleSheet.create({
  chartButtonDisabled: {
    opacity: 0.5,
  },
  chartButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
