import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { Colors } from '@/app/theme/Colors';
import { ThemedModal } from '@/components/ThemedModal';
import { ThemedText } from '@/components/ThemedText';
import LabeledInput from '@/components/ui/LabeledInput';
import { type TrainingActivityFilter, type TrainingIntensityFilter } from '@/types/training';
import { TRAINING_ACTIVITY_OPTIONS } from '@/types/trainingActivityOptions';

type TrainingSettingsModalProps = {
  visible: boolean;
  title: string;
  sessionsPlaceholder: string;
  durationPlaceholder: string;
  sessionsLabel: string;
  durationLabel: string;
  sessionsValue: string;
  durationValue: string;
  activityTypeValue: TrainingActivityFilter;
  minimumIntensityValue: TrainingIntensityFilter;
  onChangeSessions: (value: string) => void;
  onChangeDuration: (value: string) => void;
  onChangeActivityType: (value: TrainingActivityFilter) => void;
  onChangeMinimumIntensity: (value: TrainingIntensityFilter) => void;
  onSave: () => void;
  onClose: () => void;
  saveLabel: string;
  cancelLabel: string;
  trainingTitle?: string | null;
};

const TrainingSettingsModal: React.FC<TrainingSettingsModalProps> = ({
  visible,
  title,
  sessionsPlaceholder,
  durationPlaceholder,
  sessionsLabel,
  durationLabel,
  sessionsValue,
  durationValue,
  activityTypeValue,
  minimumIntensityValue,
  onChangeSessions,
  onChangeDuration,
  onChangeActivityType,
  onChangeMinimumIntensity,
  onSave,
  onClose,
  saveLabel,
  cancelLabel,
  trainingTitle,
}) => {
  const { t } = useTranslation('common');

  const activityTypeOptions: Array<{ key: TrainingActivityFilter; label: string }> = useMemo(
    () => [
      { key: 'any', label: t('plan.trainingAnyActivity') },
      ...TRAINING_ACTIVITY_OPTIONS.map(option => ({
        key: option.key,
        label: t(option.labelKey),
      })),
    ],
    [t]
  );

  const intensityOptions: Array<{ key: TrainingIntensityFilter; label: string }> = [
    { key: 'any', label: t('plan.trainingAnyIntensity') },
    { key: 'low', label: t('plan.trainingIntensityLowOrHigher') },
    { key: 'medium', label: t('plan.trainingIntensityMediumOrHigher') },
    { key: 'high', label: t('training:trainingIntensityHigh') },
  ];

  useEffect(() => {
    if (!visible) {
      Keyboard.dismiss();
    }
  }, [visible]);

  return (
    <ThemedModal
      visible={visible}
      title={title}
      onSave={onSave}
      onClose={onClose}
      okLabel={saveLabel}
      cancelLabel={cancelLabel}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.content}>
          {trainingTitle ? (
            <ThemedText type="defaultSemiBold" style={styles.trainingTitle}>
              {trainingTitle}
            </ThemedText>
          ) : null}
          <LabeledInput
            label={sessionsLabel}
            keyboardType="number-pad"
            placeholder={sessionsPlaceholder === sessionsLabel ? undefined : sessionsPlaceholder}
            value={sessionsValue}
            isOptional={false}
            onChangeText={onChangeSessions}
            containerStyle={styles.fieldBlock}
            returnKeyType="done"
          />
          <LabeledInput
            label={durationLabel}
            keyboardType="number-pad"
            placeholder={durationPlaceholder === durationLabel ? undefined : durationPlaceholder}
            value={durationValue}
            isOptional={false}
            onChangeText={onChangeDuration}
            containerStyle={styles.fieldBlock}
            returnKeyType="done"
          />

          <View style={styles.fieldBlock}>
            <ThemedText type="label">{t('plan.trainingActivityType')}</ThemedText>
            <View style={styles.optionRow}>
              {activityTypeOptions.map(option => {
                const isSelected = activityTypeValue === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                    onPress={() => onChangeActivityType(option.key)}
                  >
                    <ThemedText type="explainer">{option.label}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <ThemedText type="label">{t('plan.trainingMinimumIntensity')}</ThemedText>
            <View style={styles.optionRow}>
              {intensityOptions.map(option => {
                const isSelected = minimumIntensityValue === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                    onPress={() => onChangeMinimumIntensity(option.key)}
                  >
                    <ThemedText type="explainer">{option.label}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ThemedModal>
  );
};

export default TrainingSettingsModal;

const styles = StyleSheet.create({
  trainingTitle: {
    marginBottom: 4,
    color: Colors.dark.text,
  },
  content: {
    width: '100%',
  },
  fieldBlock: {
    width: '100%',
    marginTop: 10,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  optionChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderColor: Colors.dark.borderLight,
  },
  optionChipSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(50, 209, 166, 0.10)',
  },
});
