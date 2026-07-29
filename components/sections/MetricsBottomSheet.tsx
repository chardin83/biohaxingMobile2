import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { type MetricEntry, useStorage } from '@/app/context/StorageContext';
import { RegisterMetricBottomSheet } from '@/components/RegisterMetricBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { useBottomSheetDesign } from '@/components/ui/BottomSheetDesign';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MetricId, metrics, tipMetricLinks } from '@/locales/metrics';

import { MetricValuesTableSection } from './MetricValuesTableSection';

type MetricsBottomSheetProps = {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  tipId: string | null;
  forcedMetricId?: MetricId | null;
};



export const MetricsBottomSheet: React.FC<MetricsBottomSheetProps> = ({ bottomSheetRef, tipId, forcedMetricId }) => {
  const { t } = useTranslation(['metrics', 'common']);
  const { colors } = useTheme();
  const sheetDesign = useBottomSheetDesign(colors);
  const { addMetricEntry, getMetricHistory, setMetricEntries } = useStorage();
  const registerBottomSheetRef = useRef<BottomSheet>(null);
  const [selectedMetricId, setSelectedMetricId] = useState<MetricId | null>(null); // For detail view
  const [sheetIndex, setSheetIndex] = useState(1);
  const [isRegisterSheetVisible, setIsRegisterSheetVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MetricEntry | null>(null);
  const [metricDraftId, setMetricDraftId] = useState<MetricId | null>(null);
  const [metricValue, setMetricValue] = useState('');
  const [metricUnit, setMetricUnit] = useState('');
  const [metricNotes, setMetricNotes] = useState('');
  const [recordedAt, setRecordedAt] = useState(() => new Date());
  const isForcedMetricMode = forcedMetricId !== undefined;

  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  const getRegisteredEntries = (metricId: MetricId) => {
      return getMetricHistory(metricId);
  };

  const handleOpenAddMetricSheet = (metricId: MetricId) => {
    setEditingEntry(null);
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


    const nextEntry: MetricEntry = {
      metricId: metricDraftId,
      value,
      unit: metricUnit,
      recordedAt: recordedAt.toISOString(),
      notes: metricNotes || undefined,
    };

    if (editingEntry) {
      setMetricEntries(prev => {
        let replaced = false;
        const next = prev.map(entry => {
          if (
            !replaced
            && entry.metricId === editingEntry.metricId
            && entry.recordedAt === editingEntry.recordedAt
            && entry.value === editingEntry.value
            && entry.unit === editingEntry.unit
            && (entry.notes ?? '') === (editingEntry.notes ?? '')
          ) {
            replaced = true;
            return nextEntry;
          }

          return entry;
        });

        if (!replaced) {
          next.push(nextEntry);
        }

        return next;
      });
    } else {
      addMetricEntry(nextEntry);
    }

    handleCloseAddMetricSheet();
  };

  const handleCloseAddMetricSheet = () => {
    setIsRegisterSheetVisible(false);
    setEditingEntry(null);
    setMetricValue('');
    setMetricNotes('');
    setRecordedAt(new Date());
    setMetricDraftId(null);
  };

  const handleEditMetricEntry = (entry: MetricEntry) => {
    setEditingEntry(entry);
    setMetricDraftId(entry.metricId);
    setMetricValue(String(entry.value));
    setMetricUnit(entry.unit);
    setMetricNotes(entry.notes ?? '');

    const parsedDate = new Date(entry.recordedAt);
    setRecordedAt(Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate);

    setIsRegisterSheetVisible(true);
  };

  const performDeleteMetricEntry = (entry: MetricEntry) => {
    setMetricEntries(prev => {
      let removed = false;
      return prev.filter(current => {
        if (
          !removed
          && current.metricId === entry.metricId
          && current.recordedAt === entry.recordedAt
          && current.value === entry.value
          && current.unit === entry.unit
          && (current.notes ?? '') === (entry.notes ?? '')
        ) {
          removed = true;
          return false;
        }

        return true;
      });
    });
  };

  const handleDeleteMetricEntry = (entry: MetricEntry) => {
    Alert.alert(
      t('common:metricValuesBottomSheet.confirmDeleteTitle'),
      t('common:metricValuesBottomSheet.confirmDeleteMessage'),
      [
        {
          text: t('common:general.cancel'),
          style: 'cancel',
        },
        {
          text: t('common:metricValuesBottomSheet.confirmDeleteAction'),
          style: 'destructive',
          onPress: () => performDeleteMetricEntry(entry),
        },
      ]
    );
  };

  const handleSheetChange = (index: number) => {
    if (index >= 0) {
      setSheetIndex(index);
    }
  };

  React.useEffect(() => {
    console.log('[MetricsBottomSheet] tipId changed:', tipId);
  }, [tipId]);

  React.useEffect(() => {
    if (!isForcedMetricMode) return;
    setSelectedMetricId(forcedMetricId ?? null);
  }, [forcedMetricId, isForcedMetricMode]);

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
      console.log('registeredEntries', registeredEntries, 'selectedMetricId', selectedMetricId);
      detailView = (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          enablePanDownToClose
          backgroundStyle={sheetDesign.backgroundStyle}
          handleComponent={sheetDesign.handleComponent}
          animateOnMount
          index={-1}
          onChange={handleSheetChange}
        >
          <BottomSheetView style={[styles.contentContainer, { backgroundColor: colors.background }]}> 
            <View style={styles.headerWithBack}>
              {!isForcedMetricMode ? (
                <TouchableOpacity
                  onPress={() => setSelectedMetricId(null)}
                  style={styles.backButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <IconSymbol name="chevron.left" size={24} color={colors.text} />
                </TouchableOpacity>
              ) : null}
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
              onAddPress={() => handleOpenAddMetricSheet(selectedMetricId)}
              onEditEntry={handleEditMetricEntry}
              onDeleteEntry={handleDeleteMetricEntry}
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
                      {unit.unit}
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
    } else {
      setSelectedMetricId(null);
    }
  }

  return (
    <>
      {selectedMetricId ? detailView : (!isForcedMetricMode ? (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          enablePanDownToClose
          backgroundStyle={sheetDesign.backgroundStyle}
          handleComponent={sheetDesign.handleComponent}
          animateOnMount
          index={-1}
          onChange={handleSheetChange}
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
      ) : null)}
      <RegisterMetricBottomSheet
        bottomSheetRef={registerBottomSheetRef}
        isVisible={isRegisterSheetVisible}
        initialSnapIndex={sheetIndex}
        snapPoints={['25%', '50%', '90%']}
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
  metaTextSpacing: {
    marginTop: 4,
  },
});
