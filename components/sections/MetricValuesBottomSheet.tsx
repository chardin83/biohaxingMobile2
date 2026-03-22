import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Portal } from 'react-native-paper';

import { useStorage } from '@/app/context/StorageContext';
import { RegisterMetricBottomSheet } from '@/components/RegisterMetricBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { metrics } from '@/locales/metrics';

type MetricValueEntry = {
  metricId: string;
  value: number;
  unit: string;
  recordedAt: string;
  notes?: string;
};

type MetricValuesTableSectionProps = {
  entries: MetricValueEntry[];
  colors: any;
  emptyText: string;
  onAddPress: () => void;
};

export function MetricValuesTableSection({ entries, colors, emptyText, onAddPress }: Readonly<MetricValuesTableSectionProps>) {
  return (
    <>
      <AppButton
        onPress={onAddPress}
        style={styles.addButton}
        title="+ Registrera nytt värde"
      />

      {entries.length === 0 ? (
        <ThemedText type="default" style={{ color: colors.textMuted }}>
          {emptyText}
        </ThemedText>
      ) : (
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
            {entries.map((entry, index) => (
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
    </>
  );
}

type MetricValuesBottomSheetProps = {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  metricId: string | null;
  metricName?: string;
};

export function MetricValuesBottomSheet({ bottomSheetRef, metricId, metricName }: Readonly<MetricValuesBottomSheetProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { addMetricEntry, getMetricHistory } = useStorage();

  const registerBottomSheetRef = React.useRef<BottomSheet>(null);
  const [sheetIndex, setSheetIndex] = React.useState(1);
  const [isRegisterSheetVisible, setIsRegisterSheetVisible] = React.useState(false);
  const [metricValue, setMetricValue] = React.useState('');
  const [metricUnit, setMetricUnit] = React.useState('');
  const [metricNotes, setMetricNotes] = React.useState('');
  const [recordedAt, setRecordedAt] = React.useState(() => new Date());

  const snapPoints = React.useMemo(() => ['30%', '55%', '90%'], []);

  const registeredEntries = React.useMemo(() => {
    if (!metricId) return [];

    return [...getMetricHistory(metricId)].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  }, [getMetricHistory, metricId]);

  const handleOpenAddMetricSheet = React.useCallback(() => {
    if (!metricId) return;
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
  }, [metricId]);

  const handleCloseAddMetricSheet = React.useCallback(() => {
    setIsRegisterSheetVisible(false);
    setMetricValue('');
    setMetricNotes('');
    setRecordedAt(new Date());
  }, []);

  const handleSaveMetric = React.useCallback(() => {
    if (!metricId || !metricValue) return;

    const value = Number.parseFloat(metricValue);
    if (Number.isNaN(value)) return;

    const metric = metrics[metricId];

    addMetricEntry({
      metricId,
      value,
      unit: metricUnit || metric?.canonicalUnit || '',
      recordedAt: recordedAt.toISOString(),
      notes: metricNotes || undefined,
    });

    handleCloseAddMetricSheet();
  }, [addMetricEntry, handleCloseAddMetricSheet, metricId, metricNotes, metricUnit, metricValue, recordedAt]);

  const handleSheetChange = React.useCallback((index: number) => {
    if (index >= 0) {
      setSheetIndex(index);
    }
  }, []);

  if (!metricId) {
    return null;
  }

  return (
    <Portal>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.background }}
        animateOnMount
        index={-1}
        onChange={handleSheetChange}
      >
        <BottomSheetView style={[styles.contentContainer, { backgroundColor: colors.background }]}> 
          <ThemedText type="title3" style={styles.title}>
            {metricName ?? t(`metrics:${metricId}.name`)}
          </ThemedText>

          <MetricValuesTableSection
            entries={registeredEntries}
            colors={colors}
            emptyText={t('metrics:trendChart.empty', { metric: metricName ?? t(`metrics:${metricId}.name`) })}
            onAddPress={handleOpenAddMetricSheet}
          />
        </BottomSheetView>
      </BottomSheet>

      <RegisterMetricBottomSheet
        bottomSheetRef={registerBottomSheetRef}
        isVisible={isRegisterSheetVisible}
        initialSnapIndex={sheetIndex}
        snapPoints={['30%', '55%', '90%']}
        onClose={handleCloseAddMetricSheet}
        onSave={handleSaveMetric}
        metricId={metricId}
        metricName={metricName ?? t(`metrics:${metricId}.name`)}
        metricValue={metricValue}
        setMetricValue={setMetricValue}
        metricUnit={metricUnit}
        setMetricUnit={setMetricUnit}
        metricNotes={metricNotes}
        setMetricNotes={setMetricNotes}
        recordedAt={recordedAt}
        setRecordedAt={setRecordedAt}
        colors={colors}
        units={metricId && metrics[metricId]?.units ? metrics[metricId].units : []}
      />
    </Portal>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    marginBottom: 16,
  },
  addButton: {
    marginTop: 4,
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
});
