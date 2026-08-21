import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { type MetricEntry } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import { MetricId, metrics } from '@/locales/metrics';
import { translateMetricUnit } from '@/utils/translateMetricUnit';

import { MetricValuesTableSection } from './MetricValuesTableSection';


export type MetricDetailBottomSheetProps = {
  selectedMetricId: MetricId;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  snapPoints: string[];
  colors: ReturnType<typeof useTheme>['colors'];
  onAddMetric: (metricId: MetricId) => void;
  onEditEntry: (entry: MetricEntry) => void;
  onDeleteEntry: (entry: MetricEntry) => void;
  metric: (typeof metrics)[MetricId];
  registeredEntries: MetricEntry[];
  t: (key: string, options?: Record<string, unknown>) => string;
  handleSheetChange: (index: number) => void;
};

export const MetricDetailBottomSheet: React.FC<MetricDetailBottomSheetProps> = ({
  selectedMetricId,
  bottomSheetRef,
  snapPoints,
  colors,
  onAddMetric,
  onEditEntry,
  onDeleteEntry,
  metric,
  registeredEntries,
  t,
  handleSheetChange,
}) => {
  return (
    <BottomSheet
    ref={bottomSheetRef}
    snapPoints={snapPoints}
    enablePanDownToClose
    backgroundStyle={{ backgroundColor: colors.background }}
    handleComponent={null}
    animateOnMount
    index={-1}
    onChange={handleSheetChange}
  >
    <BottomSheetView style={[styles.contentContainer, { backgroundColor: colors.background }]}> 
      <View style={styles.headerWithBack}>
        <ThemedText type="title3" style={styles.title}>
          {t(`metrics:${selectedMetricId}.name`)}
        </ThemedText>
      </View>

      <ThemedText type="default" style={styles.description}>
        {t(`metrics:${selectedMetricId}.description`)}
      </ThemedText>

      <MetricValuesTableSection
        entries={registeredEntries}
        colors={colors}
        emptyText={t('metrics:trendChart.empty', { metric: t(`metrics:${selectedMetricId}.name`) })}
        onAddPress={() => onAddMetric(selectedMetricId)}
        onEditEntry={onEditEntry}
        onDeleteEntry={onDeleteEntry}
        registeredValuesTitle={t('common:metricValuesBottomSheet.registeredValuesTitle')}
        dateLabel={t('common:metricValuesBottomSheet.columns.date')}
        valueLabel={t('common:metricValuesBottomSheet.columns.value')}
        notesLabel={t('common:metricValuesBottomSheet.columns.notes')}
      />

      <ThemedText type="defaultSemiBold" style={styles.unitsTitle}>
        Enheter
      </ThemedText>
      <View style={styles.metricsContainer}>
        {metric.units.map(unit => (
          <View key={`${unit.system}-${unit.unit}`} style={[styles.unitItem, { backgroundColor: colors.cardBackground }]}> 
            <View style={styles.unitRow}>
              <ThemedText type="defaultSemiBold">
                {translateMetricUnit(unit.unit, t, 'metrics:units')}
              </ThemedText>
              {metric.units.length > 1 && (
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  {unit.system}
                </ThemedText>
              )}
            </View>
            {'precision' in unit && (
              <ThemedText type="caption" style={[styles.metaTextSpacing, { color: colors.textMuted }]}>
                Precision: {unit.precision} decimaler
              </ThemedText>
            )}
          </View>
        ))}
      </View>

      <View style={styles.metaInfo}>
        <View style={styles.metaItem}>
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            Källa
          </ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.metaTextSpacing}>
            {metric.source}
          </ThemedText>
        </View>
        {metric.suggestedFrequency && (
          <View style={styles.metaItem}>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              Rekommenderad frekvens
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.metaTextSpacing}>
              {metric.suggestedFrequency}
            </ThemedText>
          </View>
        )}
      </View>
    </BottomSheetView>
  </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    marginBottom: 16,
  },
  metricsContainer: {
    gap: 12,
  },
  metricItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricItemContent: {
    flex: 1,
  },
  metricDescription: {
    marginTop: 4,
  },
  metricKind: {
    marginTop: 4,
    textTransform: 'capitalize',
  },
  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 8,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  unitsTitle: {
    marginBottom: 12,
    marginTop: 16,
  },
  unitItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  unitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    marginTop: 20,
    gap: 16,
  },
  metaItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  metaTextSpacing: {
    marginTop: 4,
  },
});
