import { useTheme } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { type TrainingActivityType, type TrainingIntensity } from '@/types/training';
import { DEFAULT_TRAINING_ACTIVITY, TRAINING_ACTIVITY_OPTIONS } from '@/types/trainingActivityOptions';

import { LoggedTrainingSection } from './LoggedTrainingSection';
import { ThemedText } from './ThemedText';
import { TrainingPlanTargetsSection } from './TrainingPlanTargetsSection';
import AppButton from './ui/AppButton';
import { CancelButton } from './ui/CancelButton';
import { IconSymbol } from './ui/IconSymbol';
import LabeledInput from './ui/LabeledInput';
import LabeledStepperInput from './ui/LabeledStepperInput';

type TrainingDaySectionProps = {
  selectedDate: string;
};

export const TrainingDaySection: React.FC<TrainingDaySectionProps> = ({ selectedDate }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { trainingEntries, addTrainingEntry, setTrainingEntries } = useStorage();

  const [selectedTrainingType, setSelectedTrainingType] = useState<TrainingActivityType>(DEFAULT_TRAINING_ACTIVITY);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [intensity, setIntensity] = useState('medium' as TrainingIntensity);
  const [trainingNotes, setTrainingNotes] = useState('');
  const [trainingFormError, setTrainingFormError] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const trainingOptions = useMemo(
    () => TRAINING_ACTIVITY_OPTIONS.map(option => ({ ...option, label: t(option.labelKey) })),
    [t]
  );

  const intensityOptions: Array<{ key: TrainingIntensity; label: string }> = [
    { key: 'low', label: t('training:trainingIntensityLow') },
    { key: 'medium', label: t('training:trainingIntensityMedium') },
    { key: 'high', label: t('training:trainingIntensityHigh') },
  ];

  const selectedChipStyle = {
    borderColor: colors.primary,
    backgroundColor: colors.primaryVeryWeak,
  };

  const defaultChipStyle = {
    borderColor: colors.border,
    backgroundColor: 'transparent',
  };

  const dayTrainingEntries = useMemo(() => trainingEntries[selectedDate] ?? [], [selectedDate, trainingEntries]);

  const resetForm = useCallback(() => {
    setSelectedTrainingType(DEFAULT_TRAINING_ACTIVITY);
    setDurationMinutes('');
    setDistanceKm('');
    setTrainingNotes('');
    setIntensity('medium');
    setTrainingFormError(null);
    setEditingEntryId(null);
    setIsFormOpen(false);
  }, []);

  const handleSaveTraining = useCallback(() => {
    const parsedDuration = Number.parseInt(durationMinutes, 10);
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      setTrainingFormError(t('training:trainingDurationError'));
      return;
    }

    let parsedDistance: number | undefined;
    const normalizedDistance = distanceKm.replace(',', '.').trim();
    if (normalizedDistance) {
      const distanceValue = Number.parseFloat(normalizedDistance);
        if (!Number.isFinite(distanceValue) || distanceValue < 0) {
        setTrainingFormError(t('training:trainingDistanceError'));
        return;
      }
      parsedDistance = distanceValue;
    }

    if (editingEntryId) {
      setTrainingEntries(prev => ({
        ...prev,
        [selectedDate]: (prev[selectedDate] ?? []).map(entry => {
          if (entry.id !== editingEntryId) {
            return entry;
          }

          return {
            ...entry,
            activityType: selectedTrainingType,
            durationMinutes: parsedDuration,
            distanceKm: parsedDistance,
            intensity,
            notes: trainingNotes.trim() || undefined,
          };
        }),
      }));
    } else {
      addTrainingEntry({
        date: selectedDate,
        activityType: selectedTrainingType,
        durationMinutes: parsedDuration,
        distanceKm: parsedDistance,
        intensity,
        notes: trainingNotes.trim() || undefined,
      });
    }

    resetForm();
  }, [addTrainingEntry, distanceKm, durationMinutes, editingEntryId, intensity, resetForm, selectedDate, selectedTrainingType, setTrainingEntries, t, trainingNotes]);

  const handleEditTraining = useCallback((entryId: string) => {
    const entry = dayTrainingEntries.find(item => item.id === entryId);
    if (!entry) {
      return;
    }

    setSelectedTrainingType(entry.activityType);
    setDurationMinutes(String(entry.durationMinutes));
    setDistanceKm(typeof entry.distanceKm === 'number' ? String(entry.distanceKm) : '');
    setIntensity(entry.intensity);
    setTrainingNotes(entry.notes ?? '');
    setTrainingFormError(null);
    setEditingEntryId(entry.id);
    setIsFormOpen(true);
  }, [dayTrainingEntries]);

  const handleDeleteTraining = useCallback((entryId: string) => {
    setTrainingEntries(prev => {
      const nextEntriesForDate = (prev[selectedDate] ?? []).filter(entry => entry.id !== entryId);
      const next = { ...prev };

      if (nextEntriesForDate.length === 0) {
        delete next[selectedDate];
      } else {
        next[selectedDate] = nextEntriesForDate;
      }

      return next;
    });

    if (editingEntryId === entryId) {
      resetForm();
    }
  }, [editingEntryId, resetForm, selectedDate, setTrainingEntries]);

  return (
    <View style={styles.trainingContainer}>
      {isFormOpen ? (
        <View style={styles.formContent}>
          <ThemedText type="label" style={styles.sectionLabel}>
            {t('training:trainingTypeLabel')}
          </ThemedText>
          <View style={styles.activityRow}>
            {trainingOptions.map(option => (
              <TouchableOpacity
                key={option.key}
                style={styles.activityOption}
                onPress={() => setSelectedTrainingType(option.key)}
                accessibilityRole="button"
                accessibilityLabel={option.label}
              >
                <View
                  style={[
                    styles.activityCircle,
                    selectedTrainingType === option.key ? selectedChipStyle : defaultChipStyle,
                  ]}
                >
                  <IconSymbol
                    name={option.icon}
                    size={24}
                    color={selectedTrainingType === option.key ? colors.primary : colors.text}
                  />
                </View>
                <ThemedText type="explainer" style={styles.activityLabel}>
                  {option.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <LabeledStepperInput
            label={t('training:trainingDurationLabel')}
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            icon="clock"
            unit={t('training:trainingMinutesUnit')}
            placeholder={t('training:trainingDurationPlaceholder')}
            keyboardType="number-pad"
            step={5}
            decimals={0}
            min={0}
            isOptional={false}
          />

          <LabeledStepperInput
            label={t('training:trainingDistanceLabel')}
            value={distanceKm}
            onChangeText={setDistanceKm}
            icon="chart"
            unit="km"
            placeholder={t('training:trainingDistancePlaceholder')}
            keyboardType="decimal-pad"
            step={0.5}
            decimals={1}
            min={0}
            isOptional
          />

          <ThemedText type="label" style={styles.sectionLabel}>
            {t('training:trainingIntensityLabel')}
          </ThemedText>
          <View style={styles.chipRow}>
            {intensityOptions.map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.chip,
                  intensity === option.key ? selectedChipStyle : defaultChipStyle,
                ]}
                onPress={() => setIntensity(option.key)}
              >
                <ThemedText type="defaultSemiBold">{option.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <LabeledInput
            label={t('training:trainingNotesLabel')}
            inputStyle={[styles.input, styles.notesInput]}
            value={trainingNotes}
            onChangeText={setTrainingNotes}
            placeholder={t('training:trainingNotesPlaceholder')}
            multilineInput
            isOptional
          />

          {trainingFormError ? (
            <ThemedText style={[styles.errorText, { color: colors.notification }]}> 
              {trainingFormError}
            </ThemedText>
          ) : null}

          <AppButton
            title={t('training:trainingSaveButton')}
            onPress={handleSaveTraining}
            style={styles.saveButton}
          />

          <CancelButton onPress={resetForm} />
        </View>
      ) : (
        <AppButton
          title={t('training:trainingOpenFormButton')}
          onPress={() => setIsFormOpen(true)}
          icon="trainingRunning"
          style={styles.openFormButton}
        />
      )}

      {dayTrainingEntries.length === 0 ? (
        <ThemedText style={{ color: colors.textTertiary }}>
          {t('training:trainingEmpty')}
        </ThemedText>
      ) : (
        <LoggedTrainingSection
          entries={dayTrainingEntries}
          onEdit={handleEditTraining}
          onDelete={handleDeleteTraining}
        />
      )}

      <TrainingPlanTargetsSection selectedDate={selectedDate} />
    </View>
  );
};

const styles = StyleSheet.create({
  trainingContainer: {
    gap: 10,
  },
  formContent: {
    gap: 10,
  },
  sectionLabel: {
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 12,
  },
  activityOption: {
    width: 76,
    alignItems: 'center',
    gap: 6,
  },
  activityCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityLabel: {
    textAlign: 'center',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    marginTop: 8,
  },
  notesInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  errorText: {
    marginTop: 2,
  },
  saveButton: {
    marginTop: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  openFormButton: {
    marginTop: 6,
  },
});
