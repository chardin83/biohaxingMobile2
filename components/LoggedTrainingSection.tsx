import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { isImportedTraining } from '@/app/context/storage/training/trainingImport';
import { type TrainingLogEntry } from '@/app/context/storage/training/trainingTypes';
import { globalStyles } from '@/app/theme/globalStyles';
import { TRAINING_ACTIVITY_LABEL_KEYS } from '@/types/trainingActivityOptions';

import { Collapsible } from './Collapsible';
import { ThemedText } from './ThemedText';
import { Card } from './ui/Card';
import { SwipeableRow } from './ui/SwipeableRow';

type LoggedTrainingSectionProps = {
  entries: TrainingLogEntry[];
  onEdit: (entryId: string) => void;
  onDelete: (entryId: string) => void;
};

export const LoggedTrainingSection: React.FC<LoggedTrainingSectionProps> = ({ entries, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const formatTrainingActivity = (activity: TrainingLogEntry['activityType']) => t(TRAINING_ACTIVITY_LABEL_KEYS[activity]);

  const formatTrainingIntensity = (value: TrainingLogEntry['intensity']) => {
    if (value === 'low') return t('training:trainingIntensityLow');
    if (value === 'medium') return t('training:trainingIntensityMedium');
    return t('training:trainingIntensityHigh');
  };

  return (
    <Card style={{ borderRadius: globalStyles.borders.borderRadius }}>
      <View style={styles.loggedTrainingSection}>
        <Collapsible title={`${t('training:trainingListTitle')} (${entries.length})`} titleType="default" initialCollapsed>
          {entries.map(entry => (
            <SwipeableRow key={entry.id} onEdit={isImportedTraining(entry) ? undefined : () => onEdit(entry.id)} onDelete={() => onDelete(entry.id)} containerStyle={styles.loggedTrainingSwipeContent}>
              <TouchableOpacity style={styles.loggedTrainingPressable} onPress={isImportedTraining(entry) ? undefined : () => onEdit(entry.id)} disabled={isImportedTraining(entry)} activeOpacity={0.8}>
                <View style={styles.loggedTrainingRow}>
                  <View style={styles.loggedTrainingMain}>
                    <ThemedText type="defaultSemiBold" style={styles.loggedTrainingName}>
                      {entry.activityType === 'other' && entry.activityName ? entry.activityName : formatTrainingActivity(entry.activityType)}
                    </ThemedText>
                    <ThemedText type="explainer" style={{ color: colors.textTertiary }}>
                      {Math.round(entry.durationMinutes)} {t('training:trainingMinutesUnit')}{entry.intensity ? ` • ${formatTrainingIntensity(entry.intensity)}` : ''}
                    </ThemedText>
                    {typeof entry.distanceKm === 'number' && (
                      <ThemedText type="explainer" style={{ color: colors.textTertiary }}>
                        {Number(entry.distanceKm.toFixed(2))} km
                      </ThemedText>
                    )}
                    {isImportedTraining(entry) && (
                      <ThemedText type="explainer" style={{ color: colors.textTertiary }}>
                        {entry.sourceName ?? entry.sourceId ?? t(`metrics:origins.${entry.origin}`)}
                      </ThemedText>
                    )}
                    {entry.notes ? (
                      <ThemedText type="explainer" style={{ color: colors.textTertiary }}>
                        {entry.notes}
                      </ThemedText>
                    ) : null}
                  </View>
                  <ThemedText type="explainer" style={{ color: colors.textTertiary }}>
                    ⋮
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </SwipeableRow>
          ))}
        </Collapsible>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  loggedTrainingSection: {
    marginTop: 2,
  },
  loggedTrainingPressable: {
    width: '100%',
    justifyContent: 'center',
  },
  loggedTrainingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  loggedTrainingSwipeContent: {
    minHeight: 58,
    justifyContent: 'center',
    width: '100%',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  loggedTrainingMain: {
    flex: 1,
    gap: 2,
  },
  loggedTrainingName: {
    marginBottom: 2,
  },
  loggedTrainingIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
});
