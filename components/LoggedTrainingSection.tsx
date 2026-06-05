import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { type TrainingLogEntry } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';

import { Collapsible } from './Collapsible';
import { ThemedText } from './ThemedText';
import { TRAINING_ACTIVITY_LABEL_KEYS } from './trainingActivityOptions';
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
        <Collapsible
          title={`${t('training:trainingListTitle')} (${entries.length})`}
          titleType="default"
          initialCollapsed
        >
          {entries.map(entry => (
            <SwipeableRow
              key={entry.id}
              onEdit={() => onEdit(entry.id)}
              onDelete={() => onDelete(entry.id)}
              containerStyle={styles.loggedTrainingSwipeContent}
            >
              <TouchableOpacity
                style={styles.loggedTrainingPressable}
                onPress={() => onEdit(entry.id)}
                activeOpacity={0.8}
              >
                <View style={styles.loggedTrainingRow}>
                  <View style={styles.loggedTrainingMain}>
                    <ThemedText type="defaultSemiBold" style={styles.loggedTrainingName}>
                      {formatTrainingActivity(entry.activityType)}
                    </ThemedText>
                    <ThemedText type="explainer" style={{ color: colors.textTertiary }}>
                      {entry.durationMinutes} {t('training:trainingMinutesUnit')} • {formatTrainingIntensity(entry.intensity)}
                    </ThemedText>
                    {typeof entry.distanceKm === 'number' && (
                      <ThemedText type="explainer" style={{ color: colors.textTertiary }}>
                        {entry.distanceKm} km
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
