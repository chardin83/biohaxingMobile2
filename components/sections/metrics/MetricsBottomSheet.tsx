import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { type MetricEntry, useStorage } from '@/app/context/StorageContext';
import { RegisterMetricBottomSheet } from '@/components/RegisterMetricBottomSheet';
import { MetricId, metrics, tipMetricLinks } from '@/locales/metrics';

import { MetricDetailBottomSheet } from './MetricDetailBottomSheet';

type MetricsBottomSheetProps = {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  tipId: string | null;
  metricId?: MetricId | null;
};

export const MetricsBottomSheet: React.FC<MetricsBottomSheetProps> = ({ bottomSheetRef, tipId, metricId }) => {
  const { t } = useTranslation(['metrics', 'common']);
  const { colors } = useTheme();
  const { addMetricEntry, getMetricHistory, setMetricEntries } = useStorage();
  const registerBottomSheetRef = useRef<BottomSheet>(null);
  const [sheetIndex, setSheetIndex] = useState(1);
  const [isRegisterSheetVisible, setIsRegisterSheetVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MetricEntry | null>(null);
  const [metricDraftId, setMetricDraftId] = useState<MetricId | null>(null);
  const [metricValue, setMetricValue] = useState('');
  const [metricUnit, setMetricUnit] = useState('');
  const [metricNotes, setMetricNotes] = useState('');
  const [recordedAt, setRecordedAt] = useState(() => new Date());

  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  const getRegisteredEntries = (targetMetricId: MetricId) => {
      return getMetricHistory(targetMetricId);
  };

  const handleOpenAddMetricSheet = (targetMetricId: MetricId) => {
    setEditingEntry(null);
    setMetricDraftId(targetMetricId);
    const metric = metrics[targetMetricId];
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

  if (!tipId || !metricId) {
    return null;
  }

  const metricLinks = tipMetricLinks[tipId];
  if (!metricLinks?.some(link => link.metricId === metricId)) {
    return null;
  }

  const selectedMetric = metrics[metricId];
  if (!selectedMetric) {
    return null;
  }


  return (
    <>
      <MetricDetailBottomSheet
        selectedMetricId={metricId}
        bottomSheetRef={bottomSheetRef}
        snapPoints={snapPoints}
        colors={colors}
        onAddMetric={handleOpenAddMetricSheet}
        onEditEntry={handleEditMetricEntry}
        onDeleteEntry={handleDeleteMetricEntry}
        metric={selectedMetric}
        registeredEntries={getRegisteredEntries(metricId)}
        t={t}
        handleSheetChange={handleSheetChange}
      />
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
