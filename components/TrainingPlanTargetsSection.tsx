import { useTheme } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { type TrainingBadgeItem, type TrainingIntensity } from '@/types/training';

import { ThemedText } from './ThemedText';
import Badge from './ui/Badge';
import { Card } from './ui/Card';
import { IconSymbol } from './ui/IconSymbol';

type TrainingPlanTargetsSectionProps = {
  selectedDate: string;
};

type TrainingTipProgress = {
  tipId: string;
  title: string;
  progress: number;
  isFulfilled: boolean;
  actual: number;
  target: number;
};

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);
const toLabelSuffix = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
const TRAINING_INTENSITY_RANK: Record<TrainingIntensity, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export const TrainingPlanTargetsSection: React.FC<TrainingPlanTargetsSectionProps> = ({ selectedDate }) => {
  const { t } = useTranslation(['common', 'tips']);
  const { colors } = useTheme();
  const { plans, trainingPlanSettings, trainingEntries } = useStorage();

  const weeklyTipProgress = useMemo(() => {
    const selected = new Date(`${selectedDate}T12:00:00`);
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

    const hasAnyTarget = (tipId: string) => {
      const target = trainingPlanSettings[tipId];
      if (!target) return false;

      return (
        typeof target.sessionsPerWeek === 'number' ||
        typeof target.sessionDurationMinutes === 'number' ||
        target.activityType !== undefined ||
        target.minimumIntensity !== undefined
      );
    };

    const tipsWithTargets = plans.training.filter(goal => goal.tipId && hasAnyTarget(goal.tipId));

    const progressItems: TrainingTipProgress[] = tipsWithTargets.map(goal => {
      const tipId = goal.tipId;
      const target = trainingPlanSettings[tipId] ?? {};

      const matchingEntries = weekEntries.filter(entry => {
        const hasDurationThreshold =
          typeof target.sessionDurationMinutes === 'number' && Number.isFinite(target.sessionDurationMinutes);
        const meetsDuration = !hasDurationThreshold || entry.durationMinutes >= (target.sessionDurationMinutes as number);

        const hasActivityFilter = Boolean(target.activityType && target.activityType !== 'any');
        const matchesActivity = !hasActivityFilter || entry.activityType === target.activityType;

        const hasIntensityFilter = Boolean(target.minimumIntensity && target.minimumIntensity !== 'any');
        const matchesIntensity =
          !hasIntensityFilter ||
          TRAINING_INTENSITY_RANK[entry.intensity] >=
            TRAINING_INTENSITY_RANK[target.minimumIntensity as TrainingIntensity];

        return meetsDuration && matchesActivity && matchesIntensity;
      });

      const targetSessions =
        typeof target.sessionsPerWeek === 'number' && Number.isFinite(target.sessionsPerWeek) && target.sessionsPerWeek > 0
          ? target.sessionsPerWeek
          : 1;

      const actual = matchingEntries.length;
      const progress = Math.min(actual / targetSessions, 1);
      const isFulfilled = actual >= targetSessions;

      return {
        tipId,
        title: t(`tips:${tipId}.title`),
        progress,
        isFulfilled,
        actual,
        target: targetSessions,
      };
    });

    return {
      weekStartKey,
      weekEndKey,
      tips: progressItems,
    };
  }, [plans.training, selectedDate, t, trainingEntries, trainingPlanSettings]);

  const fulfilledTips = weeklyTipProgress.tips.filter(tip => tip.isFulfilled);
  const inProgressTips = weeklyTipProgress.tips.filter(tip => !tip.isFulfilled);

  const buildTrainingBadges = (
    tipId: string,
    userSettings: (typeof trainingPlanSettings)[string]
  ): TrainingBadgeItem[] => {
    const badges: TrainingBadgeItem[] = [];

    if (typeof userSettings.sessionDurationMinutes === 'number' && !Number.isNaN(userSettings.sessionDurationMinutes)) {
      badges.push({
        key: `${tipId}-duration`,
        label: t('plan.trainingDurationMinutes', {
          minutes: userSettings.sessionDurationMinutes,
        }),
        icon: 'clock',
      });
    }

    if (userSettings.activityType && userSettings.activityType !== 'any') {
      badges.push({
        key: `${tipId}-activity`,
        label: t(`training:trainingType${toLabelSuffix(userSettings.activityType)}`),
        icon: 'trainingRunning',
      });
    }

    if (userSettings.minimumIntensity && userSettings.minimumIntensity !== 'any') {
      badges.push({
        key: `${tipId}-intensity`,
        label: t(`training:trainingIntensity${toLabelSuffix(userSettings.minimumIntensity)}`),
        icon: 'flame',
      });
    }

    return badges;
  };

  return (
    <Card style={{ borderRadius: globalStyles.borders.borderRadius }}>
      <ThemedText type="title3" style={styles.sectionTitle}>
        {t('plan.trainingTargetsSectionTitle')}
      </ThemedText>
      <ThemedText type="title3" style={styles.periodSectionHeading}>
        {t('nutritionLogger.periodWeekly')}
      </ThemedText>
      <ThemedText type="caption" style={{ color: colors.textTertiary }}>
        {t('plan.trainingTargetsWeekLabel', {
          weekStart: weeklyTipProgress.weekStartKey,
          weekEnd: weeklyTipProgress.weekEndKey,
        })}
      </ThemedText>

      {weeklyTipProgress.tips.length === 0 ? (
        <ThemedText type="explainer" style={[styles.emptyText, { color: colors.textMuted }]}>
          {t('plan.trainingTargetsEmptyDescription')}
        </ThemedText>
      ) : (
        <View style={styles.listWrap}>
          {[...fulfilledTips, ...inProgressTips].map(tip => {
            const userSettings = trainingPlanSettings[tip.tipId] ?? {};
            const badges = buildTrainingBadges(tip.tipId, userSettings);

            return (
              <View
                key={tip.tipId}
                style={[
                  styles.tipRow,
                  tip.isFulfilled
                    ? { backgroundColor: colors.accentVeryWeak, borderColor: colors.accentMedium }
                    : { borderColor: colors.borderLight },
                ]}
              >
                <View style={styles.tipHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.tipTitle}>
                    {tip.title}
                  </ThemedText>
                  {tip.isFulfilled ? <Icon source="check-circle" size={34} color={colors.xp} /> : null}
                </View>

                <ThemedText type="caption" style={styles.tipStatus}>
                  {t('plan.trainingWeeklyProgress', {
                    actual: tip.actual,
                    target: tip.target,
                  })}
                </ThemedText>

                {badges.length > 0 ? (
                  <View style={styles.trainingBadgesRow}>
                    {badges.map(({ key, label, icon }) => (
                      <Badge key={key} variant="overlay" style={styles.trainingBadge}>
                        <IconSymbol name={icon} size={14} color={colors.icon} style={styles.trainingBadgeIcon} />
                        <ThemedText type="caption">
                          {label}
                        </ThemedText>
                      </Badge>
                    ))}
                  </View>
                ) : null}

                <View style={[styles.progressTrack, { backgroundColor: colors.secondaryBackground }]}> 
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.round(tip.progress * 100)}%`,
                        backgroundColor: tip.isFulfilled ? colors.accentMedium : colors.icon,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 6,
  },
  periodSectionHeading: {
    marginBottom: 4,
    opacity: 0.9,
    textTransform: 'capitalize',
  },
  emptyText: {
    marginTop: 10,
  },
  listWrap: {
    marginTop: 10,
    gap: 8,
  },
  tipRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  tipTitle: {
    flex: 1,
  },
  tipStatus: {
    marginTop: 4,
    marginBottom: 4,
  },
  trainingBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  trainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  trainingBadgeIcon: {
    marginRight: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
