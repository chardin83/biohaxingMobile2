import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';
import Badge from '@/components/ui/Badge';
import { IconSymbol } from '@/components/ui/IconSymbol';
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
  const { trainingPlanSettings, trainingEntries } = useStorage();

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
    <AppBox
      title={t('plan.trainingTargetsTitle')}
      leading={<IconSymbol name="target" size={18} color={colors.primary} />}
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
