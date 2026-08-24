import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Portal } from 'react-native-paper';

import { useStorage } from '@/app/context/StorageContext';
import TrainingSettingsModal from '@/components/modals/TrainingSettingsModal';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';
import Badge from '@/components/ui/Badge';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PlanEditActions from '@/components/ui/PlanEditActions';
import { type TrainingActivityFilter, type TrainingIntensityFilter } from '@/types/training';
import { toDateKey } from '@/utils/dateUtils';
import { calculateTrainingWeeklyProgress } from '@/utils/trainingProgress';

export type TrainingPlanDetailsTarget = {
  key: string;
  tag: string;
  unit: 'g' | 'mg' | 'plants' | 'items' | 'count';
  period: 'daily' | 'weekly';
  amount: number;
  label: string;
};

export type TrainingPlanDetailsProgress = {
  weekStartKey: string;
  weekEndKey: string;
  actual: number;
  target: number;
  progress: number;
  isFulfilled: boolean;
};

type Props = {
  cardData?: { badges?: Array<{ label: string; icon?: string }> };
  tipId?: string;
};

export const TrainingPlanDetailsSection: React.FC<Props> = ({
  cardData,
  tipId,
}) => {
  const { t } = useTranslation(['common', 'areas', 'tips']);
  const { colors } = useTheme();
  const { trainingPlanSettings, trainingEntries, setTrainingPlanSettings } = useStorage();
  const [trainingSettingsVisible, setTrainingSettingsVisible] = React.useState(false);
  const [trainingSessionsInput, setTrainingSessionsInput] = React.useState('');
  const [trainingDurationInput, setTrainingDurationInput] = React.useState('');
  const [trainingActivityTypeInput, setTrainingActivityTypeInput] = React.useState('any' as TrainingActivityFilter);
  const [trainingMinimumIntensityInput, setTrainingMinimumIntensityInput] = React.useState('any' as TrainingIntensityFilter);

  const trainingTitle = React.useMemo(() => {
    if (!tipId) return null;
    return t(`tips:${tipId}.title`);
  }, [t, tipId]);

  const openTrainingSettingsModal = React.useCallback(() => {
    if (!tipId) return;

    const existing = trainingPlanSettings[tipId];
    setTrainingSessionsInput(existing?.sessionsPerWeek === undefined ? '' : existing.sessionsPerWeek.toString());
    setTrainingDurationInput(
      typeof existing?.sessionDurationMinutes === 'number' ? existing.sessionDurationMinutes.toString() : ''
    );
    setTrainingActivityTypeInput(existing?.activityType ?? 'any');
    setTrainingMinimumIntensityInput(existing?.minimumIntensity ?? 'any');
    setTrainingSettingsVisible(true);
  }, [tipId, trainingPlanSettings]);

  const closeTrainingSettingsModal = React.useCallback(() => {
    setTrainingSettingsVisible(false);
    setTrainingSessionsInput('');
    setTrainingDurationInput('');
    setTrainingActivityTypeInput('any');
    setTrainingMinimumIntensityInput('any');
  }, []);

  const handleSaveTrainingSettings = React.useCallback(() => {
    if (!tipId) {
      closeTrainingSettingsModal();
      return;
    }

    const parseNumericInput = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = Number.parseInt(trimmed, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    const sessionsValue = parseNumericInput(trainingSessionsInput);
    const durationValue = parseNumericInput(trainingDurationInput);
    const activityTypeValue = trainingActivityTypeInput === 'any' ? undefined : trainingActivityTypeInput;
    const minimumIntensityValue = trainingMinimumIntensityInput === 'any' ? undefined : trainingMinimumIntensityInput;

    setTrainingPlanSettings(prev => {
      const next = { ...prev };
      if (
        sessionsValue === undefined &&
        durationValue === undefined &&
        activityTypeValue === undefined &&
        minimumIntensityValue === undefined
      ) {
        delete next[tipId];
      } else {
        next[tipId] = {
          sessionsPerWeek: sessionsValue,
          sessionDurationMinutes: durationValue,
          activityType: activityTypeValue,
          minimumIntensity: minimumIntensityValue,
        };
      }
      return next;
    });

    closeTrainingSettingsModal();
  }, [closeTrainingSettingsModal, setTrainingPlanSettings, tipId, trainingActivityTypeInput, trainingDurationInput, trainingMinimumIntensityInput, trainingSessionsInput]);

  const trainingWeeklyProgress = React.useMemo<TrainingPlanDetailsProgress | null>(() => {
    if (!tipId) return null;

    const target = trainingPlanSettings[tipId];
    if (!target) return null;

    const hasAnyTarget =
      typeof target.sessionsPerWeek === 'number' ||
      typeof target.sessionDurationMinutes === 'number' ||
      target.activityType !== undefined ||
      target.minimumIntensity !== undefined;

    if (!hasAnyTarget) return null;

    const selected = new Date();
    const day = selected.getDay();
    const mondayDiff = day === 0 ? -6 : 1 - day;

    const weekStart = new Date(selected);
    weekStart.setDate(selected.getDate() + mondayDiff);
    const weekStartKey = toDateKey(weekStart);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekEndKey = toDateKey(weekEnd);

    const weekEntries = Object.entries(trainingEntries)
      .filter(([dateKey]) => dateKey >= weekStartKey && dateKey <= weekEndKey)
      .flatMap(([, entries]) => entries);

    const progressInfo = calculateTrainingWeeklyProgress({
      entries: weekEntries,
      target,
    });

    return {
      weekStartKey,
      weekEndKey,
      actual: progressInfo.actual,
      target: progressInfo.target,
      progress: progressInfo.progress,
      isFulfilled: progressInfo.isFulfilled,
    };
  }, [tipId, trainingEntries, trainingPlanSettings]);

  const shouldShowTrainingTargetsUnset = !cardData?.badges?.length && !trainingWeeklyProgress;

  return (
    <>
      <AppBox
        title={t('plan.trainingTargetsTitle')}
        leading={<IconSymbol name="target" size={18} color={colors.primary} />}
        headerRight={tipId ? (
          <PlanEditActions
            onEdit={openTrainingSettingsModal}
            editLabel={t('plan.editTrainingTargets')}
          />
        ) : undefined}
      >
      {!!cardData?.badges?.length && (
        <View style={styles.badgeRow}>
          {cardData.badges.map(badge => (
            <Badge key={`${badge.label}-${badge.icon ?? 'default'}`} variant="overlay" style={styles.inlineBadge}>
              {badge.icon ? (
                <IconSymbol
                  name={badge.icon as React.ComponentProps<typeof IconSymbol>['name']}
                  size={14}
                  color={colors.icon}
                  style={styles.badgeIcon}
                />
              ) : null}
              <ThemedText type="caption">{badge.label}</ThemedText>
            </Badge>
          ))}
        </View>
      )}

      {trainingWeeklyProgress && (
        <View style={styles.trainingProgressContainer}>
          <ThemedText type="caption" style={styles.trainingProgressWeekLabel}>
            {t('plan.trainingTargetsWeekLabel', {
              weekStart: trainingWeeklyProgress.weekStartKey,
              weekEnd: trainingWeeklyProgress.weekEndKey,
            })}
          </ThemedText>
          <ThemedText type="caption" style={styles.trainingProgressStatus}>
            {t('plan.trainingWeeklyProgress', {
              actual: trainingWeeklyProgress.actual,
              target: trainingWeeklyProgress.target,
            })}
          </ThemedText>
          <View style={[styles.progressTrack, { backgroundColor: colors.secondaryBackground }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(trainingWeeklyProgress.progress * 100)}%`,
                  backgroundColor: trainingWeeklyProgress.isFulfilled ? colors.accentMedium : colors.icon,
                },
              ]}
            />
          </View>
        </View>
      )}

      {shouldShowTrainingTargetsUnset && (
        <ThemedText type="default" style={styles.emptyText}>
          {t('plan.trainingTargetsUnset')}
        </ThemedText>
      )}
      </AppBox>

      <Portal>
        <TrainingSettingsModal
          visible={trainingSettingsVisible}
          title={t('plan.trainingTargetsTitle')}
          trainingTitle={trainingTitle}
          sessionsPlaceholder={t('plan.trainingSessionsPlaceholder')}
          durationPlaceholder={t('plan.trainingDurationPlaceholder')}
          sessionsLabel={t('plan.trainingSessionsPlaceholder')}
          durationLabel={t('plan.trainingDurationPlaceholder')}
          sessionsValue={trainingSessionsInput}
          durationValue={trainingDurationInput}
          activityTypeValue={trainingActivityTypeInput}
          minimumIntensityValue={trainingMinimumIntensityInput}
          onChangeSessions={setTrainingSessionsInput}
          onChangeDuration={setTrainingDurationInput}
          onChangeActivityType={setTrainingActivityTypeInput}
          onChangeMinimumIntensity={setTrainingMinimumIntensityInput}
          onSave={handleSaveTrainingSettings}
          onClose={closeTrainingSettingsModal}
          saveLabel={t('general.save')}
          cancelLabel={t('general.cancel')}
        />
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  inlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeIcon: {
    marginRight: 2,
  },
  trainingProgressContainer: {
    marginTop: 10,
    marginBottom: 8,
    gap: 4,
  },
  trainingProgressWeekLabel: {
    opacity: 0.8,
  },
  trainingProgressStatus: {
    opacity: 0.85,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  emptyText: {
    marginTop: 6,
    lineHeight: 20,
  },
});

export default TrainingPlanDetailsSection;
