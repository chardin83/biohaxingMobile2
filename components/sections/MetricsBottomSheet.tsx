import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { RegisterMetricBottomSheet } from '@/components/RegisterMetricBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { metrics, tipMetricLinks } from '@/locales/metrics';

type MetricsBottomSheetProps = {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  tipId: string | null;
  planTipId?: string;
};

const GLOBAL_METRIC_IDS = new Set(['hrv', 'resting_hr']);

function isGlobalMetric(metricId: string): boolean {
  return GLOBAL_METRIC_IDS.has(metricId);
}

export const MetricsBottomSheet: React.FC<MetricsBottomSheetProps> = ({ bottomSheetRef, tipId, planTipId }) => {
  const { t } = useTranslation(['metrics']);
  const { colors } = useTheme();
  const { addMetricEntry, getMetricHistory, getMetricsForPlanTip } = useStorage();
  const registerBottomSheetRef = useRef<BottomSheet>(null);
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null); // For detail view
  const [isRegisterSheetVisible, setIsRegisterSheetVisible] = useState(false);
  const [metricDraftId, setMetricDraftId] = useState<string | null>(null);
  const [metricValue, setMetricValue] = useState('');
  const [metricUnit, setMetricUnit] = useState('');
  const [metricNotes, setMetricNotes] = useState('');
  const [recordedAt, setRecordedAt] = useState(() => new Date());

  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  const getRegisteredEntries = (metricId: string) => {
    if (isGlobalMetric(metricId)) {
      return getMetricHistory(metricId);
    }

    if (!planTipId) {
      return [];
    }

    return getMetricsForPlanTip(planTipId).filter(entry => entry.metricId === metricId);
  };

  const handleOpenAddMetricSheet = (metricId: string) => {
    setMetricDraftId(metricId);
    const metric = metrics[metricId];
    if (metric && metric.units.length > 0) {
      setMetricUnit(metric.units[0].unit);
    } else {
      setMetricUnit('');
    }
    setMetricValue('');
    setMetricNotes('');
    setRecordedAt(new Date());
    setIsRegisterSheetVisible(true);
  };

  const handleSaveMetric = () => {
    if (!metricDraftId || !metricValue) return;

    const value = Number.parseFloat(metricValue);
    if (Number.isNaN(value)) return;

    const targetPlanTipId = isGlobalMetric(metricDraftId) ? undefined : planTipId;

    console.log('Sparar metricEntry', { metricId: metricDraftId, value, unit: metricUnit, planTipId: targetPlanTipId });

    addMetricEntry({
      metricId: metricDraftId,
      value,
      unit: metricUnit,
      recordedAt: recordedAt.toISOString(),
      notes: metricNotes || undefined,
      planTipId: targetPlanTipId,
    });

    handleCloseAddMetricSheet();
  };

  const handleCloseAddMetricSheet = () => {
    setIsRegisterSheetVisible(false);
    setMetricValue('');
    setMetricNotes('');
    setRecordedAt(new Date());
    setMetricDraftId(null);
  };

  React.useEffect(() => {
    console.log('[MetricsBottomSheet] tipId changed:', tipId);
  }, [tipId]);

  if (!tipId) {
    console.log('[MetricsBottomSheet] tipId is null, returning null');
    return null;
  }

  const metricLinks = tipMetricLinks[tipId];
  console.log('[MetricsBottomSheet] metricLinks:', metricLinks);
  if (!metricLinks || metricLinks.length === 0) {
    console.log('[MetricsBottomSheet] no metric links, returning null');
    return null;
  }

  let detailView = null;
  if (selectedMetricId) {
    const metric = metrics[selectedMetricId];
    if (metric) {
      const registeredEntries = getRegisteredEntries(selectedMetricId);
      console.log('registeredEntries', registeredEntries, 'planTipId', planTipId, 'selectedMetricId', selectedMetricId);
      detailView = (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          enablePanDownToClose
          backgroundStyle={{ backgroundColor: colors.background }}
          animateOnMount
          index={-1}
        >
          <BottomSheetView style={[styles.contentContainer, { backgroundColor: colors.background }]}> 
            <View style={styles.headerWithBack}>
              <TouchableOpacity
                onPress={() => setSelectedMetricId(null)}
                style={styles.backButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <IconSymbol name="chevron.left" size={24} color={colors.text} />
              </TouchableOpacity>
              <ThemedText type="title3" style={styles.title}>
                {t(`metrics:${selectedMetricId}.name`)}
              </ThemedText>
            </View>

            <ThemedText type="default" style={styles.description}>
              {t(`metrics:${selectedMetricId}.description`)}
            </ThemedText>

            <AppButton
              onPress={() => handleOpenAddMetricSheet(selectedMetricId)}
              style={styles.addButton}
              title="+ Registrera nytt värde"
            />

            {/* Tabell över redan registrerade värden */}
            {registeredEntries.length > 0 && (
              <View style={styles.registeredEntriesSection}>
                <ThemedText type="defaultSemiBold" style={styles.registeredEntriesTitle}>
                  Registrerade värden
                </ThemedText>
                <View style={[styles.registeredEntriesTable, { borderColor: colors.border }]}>
                  <View style={[styles.registeredEntriesRow, { backgroundColor: colors.cardBackground }]}>
                    <ThemedText style={styles.tableCellSmall} type="caption">Datum</ThemedText>
                    <ThemedText style={styles.tableCellSmall} type="caption">Värde</ThemedText>
                    <ThemedText style={styles.tableCellSmall} type="caption">Enhet</ThemedText>
                    <ThemedText style={styles.tableCellLarge} type="caption">Notering</ThemedText>
                  </View>
                  {registeredEntries.map((entry, index) => (
                    <View
                      key={`${entry.metricId}-${entry.recordedAt}-${entry.value}`}
                      style={[styles.registeredEntriesRow, { backgroundColor: index % 2 === 0 ? colors.background : colors.cardBackground }]}
                    >
                      <ThemedText style={styles.tableCellSmall} type="caption">{entry.recordedAt.slice(0, 10)}</ThemedText>
                      <ThemedText style={styles.tableCellSmall} type="caption">{entry.value}</ThemedText>
                      <ThemedText style={styles.tableCellSmall} type="caption">{entry.unit}</ThemedText>
                      <ThemedText style={styles.tableCellLarge} type="caption">{entry.notes || ''}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <ThemedText type="defaultSemiBold" style={styles.unitsTitle}>
              Enheter
            </ThemedText>
            <View style={styles.metricsContainer}>
              {metric.units.map(unit => (
                <View key={`${unit.system}-${unit.unit}`} style={[styles.unitItem, { backgroundColor: colors.cardBackground }]}> 
                  <View style={styles.unitRow}>
                    <ThemedText type="defaultSemiBold">
                      {unit.unit}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>
                      {unit.system}
                    </ThemedText>
                  </View>
                  {unit.precision !== undefined && (
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
    } else {
      setSelectedMetricId(null);
    }
  }

  return (
    <>
      {selectedMetricId ? detailView : (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          enablePanDownToClose
          backgroundStyle={{ backgroundColor: colors.background }}
          animateOnMount
          index={-1}
        >
          <BottomSheetView style={[styles.contentContainer, { backgroundColor: colors.background }]}> 
            <ThemedText type="title3" style={styles.title}>
              Intressanta mätvärden
            </ThemedText>
            <View style={styles.metricsContainer}>
              {metricLinks.map(link => {
                const metric = metrics[link.metricId];
                if (!metric) return null;
                return (
                  <TouchableOpacity
                    key={link.metricId}
                    onPress={() => setSelectedMetricId(link.metricId)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.metricItem, { backgroundColor: colors.cardBackground }]}> 
                      <View style={styles.metricItemContent}>
                        <ThemedText type="defaultSemiBold">
                          {t(`metrics:${link.metricId}.name`)}
                        </ThemedText>
                        <ThemedText type="caption" style={styles.metricDescription}>
                          {t(`metrics:${link.metricId}.description`)}
                        </ThemedText>
                        <ThemedText type="caption" style={[styles.metricKind, { color: colors.text }]}> 
                          {link.kind}
                        </ThemedText>
                      </View>
                      <IconSymbol name="chevron.right" size={20} color={colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetView>
        </BottomSheet>
      )}
      <RegisterMetricBottomSheet
        bottomSheetRef={registerBottomSheetRef}
        isVisible={isRegisterSheetVisible}
        onClose={handleCloseAddMetricSheet}
        onSave={handleSaveMetric}
        metricName={metricDraftId ? t(`metrics:${metricDraftId}.name`) : undefined}
        metricValue={metricValue}
        setMetricValue={setMetricValue}
        metricUnit={metricUnit}
        setMetricUnit={setMetricUnit}
        metricNotes={metricNotes}
        setMetricNotes={setMetricNotes}
        recordedAt={recordedAt}
        setRecordedAt={setRecordedAt}
        colors={colors}
        units={metricDraftId && metrics[metricDraftId]?.units ? metrics[metricDraftId].units : []}
      />
    </>
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
  addButton: {
    marginTop: 12,
    marginBottom: 8,
  },
  registeredEntriesSection: {
    marginVertical: 12,
  },
  registeredEntriesTitle: {
    marginBottom: 4,
  },
  registeredEntriesTable: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  registeredEntriesRow: {
    flexDirection: 'row',
  },
  tableCellSmall: {
    flex: 1,
    padding: 8,
  },
  tableCellLarge: {
    flex: 2,
    padding: 8,
  },
  metaTextSpacing: {
    marginTop: 4,
  },
});
