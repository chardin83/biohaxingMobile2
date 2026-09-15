import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import DailyProgressWeek from '@/components/calendar/progress/DailyProgressWeek';
import PastWeeksProgress, { PastWeekProgress } from '@/components/calendar/progress/PastWeekProgress';
import ProgressDateNavigator from '@/components/calendar/progress/ProgressDateNavigator';
import ProgressTipHeader from '@/components/calendar/progress/ProgressTipHeader';
import { Collapsible } from '@/components/Collapsible';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { useProgressWeeks } from '@/hooks/useWeekProgress';
import { tips } from '@/locales/tips';
import { getTargetProgress } from '@/services/targetProgress/targetProgressService';
import type { TargetPeriod, TrainingTargetDefinition } from '@/services/targetProgress/targetProgressTypes';
import { formatMonthDay, fromDateKey, toDateKey } from '@/utils/dateUtils';

type TrainingTipHistoryItem = {
  tipId: string;
  title: string;
  period: TargetPeriod;
  startedAt: string;
  targets: TrainingTargetDefinition[];
};

type CalculatedTrainingTarget = TrainingTargetDefinition & {
  current: number;
  target: number;
  isFulfilled: boolean;
};

const PARTIAL_PROGRESS_ICON = '◐';

const isDateKeyBefore = (left: string, right: string): boolean => left < right;

const getTargetRatio = (targets: CalculatedTrainingTarget[]): number => {
  if (targets.length === 0) {
    return 0;
  }

  const total = targets.reduce((sum, target) => {
    if (target.target <= 0) {
      return sum;
    }

    return sum + Math.min(target.current / target.target, 1);
  }, 0);

  return total / targets.length;
};

const isTipFulfilled = (targets: CalculatedTrainingTarget[]): boolean => {
  return targets.length > 0 && targets.every(target => target.isFulfilled);
};

export default function TrainingProgressScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();

  const { plans, dailyTrainingTracking, dailyNutritionTracking, weeklyNutritionTracking, dailyHabitTracking, takenDates } = useStorage();

  const language = i18n.resolvedLanguage ?? i18n.language;

  const {
    weeks: pastWeeks,
    selectedWeek,
    selectedWeekStart,
    setSelectedWeekStart,
    dayLabels,
    dateRangeLabel,
    goBackWeeks,
    goForwardWeeks,
    canGoForward,
  } = useProgressWeeks(language);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const [selectedTipDay, setSelectedTipDay] = useState(todayKey);

  const storage = useMemo(
    () => ({
      dailyTrainingTracking,
      dailyNutritionTracking,
      weeklyNutritionTracking,
      dailyHabitTracking,
      takenDates,
    }),
    [dailyTrainingTracking, dailyNutritionTracking, weeklyNutritionTracking, dailyHabitTracking, takenDates]
  );

  const trackedTips = useMemo<TrainingTipHistoryItem[]>(() => {
    return (plans.training ?? []).flatMap(plan => {
      const tip = tips.find(candidate => candidate.id === plan.tipId);

      if (!tip?.targetPeriod || !tip.activityTargets?.length) {
        return [];
      }

      return [
        {
          tipId: plan.tipId,
          title: t(`tips:${plan.tipId}.title`),
          period: tip.targetPeriod as TargetPeriod,
          startedAt: plan.startedAt,
          targets: tip.activityTargets.map(target => ({
            source: 'training' as const,
            trackingKey: target.trackingKey,
            amount: target.amount,
            unit: target.unit,
            activityTypes: target.activityTypes,
            period: tip.targetPeriod as TargetPeriod,
          })),
        },
      ];
    });
  }, [plans.training, t]);

  const dailyTips = useMemo(() => trackedTips.filter(tip => tip.period === 'daily'), [trackedTips]);

  const weeklyTips = useMemo(() => trackedTips.filter(tip => tip.period === 'weekly'), [trackedTips]);

  const getTargetsForDate = (tip: TrainingTipHistoryItem, dateKey: string): CalculatedTrainingTarget[] => {
    return tip.targets.map(target => {
      const progress = getTargetProgress({
        target,
        selectedDate: dateKey,
        storage,
      });

      return {
        ...target,
        current: progress.current,
        target: progress.target,
        isFulfilled: progress.isFulfilled,
      };
    });
  };

  const getProgressColor = (ratio: number): string => {
    if (ratio <= 0) {
      return colors.textMuted;
    }

    if (ratio < 1) {
      return colors.goldSoft;
    }

    return colors.accentColor;
  };

  const getStreakStatus = (
    tip: TrainingTipHistoryItem
  ): {
    streak: number;
    isYesterdayStreak: boolean;
  } => {
    const getFulfilled = (dateKey: string) => {
      return isTipFulfilled(getTargetsForDate(tip, dateKey));
    };

    const startFrom = new Date();
    let isYesterdayStreak = false;

    const todayDateKey = toDateKey(startFrom);

    if (!getFulfilled(todayDateKey)) {
      startFrom.setDate(startFrom.getDate() - 1);

      const yesterdayKey = toDateKey(startFrom);

      if (!getFulfilled(yesterdayKey)) {
        return {
          streak: 0,
          isYesterdayStreak: false,
        };
      }

      isYesterdayStreak = true;
    }

    let streak = 0;
    const cursor = new Date(startFrom);

    while (true) {
      const key = toDateKey(cursor);

      if (!getFulfilled(key)) {
        break;
      }

      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      streak,
      isYesterdayStreak,
    };
  };

  const renderTargetSummary = (target: CalculatedTrainingTarget) => {
    const current = Number.isInteger(target.current) ? target.current : Math.round(target.current * 10) / 10;

    return (
      <View key={`${target.trackingKey}-${target.unit}`} style={styles.targetRow}>
        <ThemedText type="caption" style={styles.targetName}>
          {t(`training:targets.${target.trackingKey}`, {
            defaultValue: target.trackingKey,
          })}
        </ThemedText>

        <View style={styles.targetValueRow}>
          <ThemedText
            type="caption"
            style={{
              color: target.isFulfilled ? colors.accentColor : colors.textMuted,
            }}
          >
            {`${current} / ${target.target} ${target.unit}`}
          </ThemedText>

          <ThemedText
            type="defaultSemiBold"
            style={{
              color: target.isFulfilled ? colors.accentColor : colors.textMuted,
            }}
          >
            {target.isFulfilled ? '✓' : '✗'}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderDailyTip = (tip: TrainingTipHistoryItem) => {
    const startDateKey = toDateKey(new Date(tip.startedAt));

    const weekBeforeStart = isDateKeyBefore(selectedWeek.end, startDateKey);

    const startLabel = formatMonthDay(fromDateKey(startDateKey), language);

    const isStartWeek = selectedWeek.start <= startDateKey && startDateKey <= selectedWeek.end;

    const visibleDays = selectedWeek.days.filter(dateKey => dateKey <= todayKey && !isDateKeyBefore(dateKey, startDateKey));

    const fulfilledDays = visibleDays.filter(dateKey => isTipFulfilled(getTargetsForDate(tip, dateKey)));

    const selectedTargets = selectedTipDay ? getTargetsForDate(tip, selectedTipDay) : [];

    const isSelectedDayBeforeStart = Boolean(selectedTipDay) && isDateKeyBefore(selectedTipDay, startDateKey);

    const { streak, isYesterdayStreak } = getStreakStatus(tip);

    const pastWeekProgress: PastWeekProgress[] = pastWeeks.map(week => {
      const availableDays = week.days.filter(dateKey => dateKey <= todayKey && !isDateKeyBefore(dateKey, startDateKey));

      return {
        start: week.start,
        label: week.label,
        completed: availableDays.filter(dateKey => isTipFulfilled(getTargetsForDate(tip, dateKey))).length,
        total: availableDays.length,
        days: week.days.map(dateKey => {
          const disabled = dateKey > todayKey || isDateKeyBefore(dateKey, startDateKey);

          const targets = getTargetsForDate(tip, dateKey);

          const fulfilled = isTipFulfilled(targets);

          const ratio = getTargetRatio(targets);

          return {
            date: dateKey,
            ratio: fulfilled ? 1 : ratio,
            fulfilled,
            disabled,
          };
        }),
      };
    });

    return (
      <View
        key={tip.tipId}
        style={[
          styles.tipBlock,
          {
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <ProgressTipHeader
          tipId={tip.tipId}
          title={tip.title}
          progress={`${fulfilledDays.length}/${visibleDays.length}`}
          progressColor={getProgressColor(visibleDays.length > 0 ? fulfilledDays.length / visibleDays.length : 0)}
        />

        <ThemedText
          type="caption"
          style={[
            styles.selectedWeekRange,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {selectedWeek.label}

          {isStartWeek && (
            <ThemedText
              type="pill"
              style={{
                color: colors.goldSuperSoft,
              }}
            >
              {` • ${t('common:progress.startsOn', {
                date: startLabel,
              })}`}
            </ThemedText>
          )}
        </ThemedText>

        {weekBeforeStart ? (
          <ThemedText
            type="default"
            style={[
              styles.notActiveText,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {t('common:progress.notActiveStarts', {
              date: startLabel,
            })}
          </ThemedText>
        ) : (
          <DailyProgressWeek
            days={selectedWeek.days}
            dayLabels={dayLabels}
            todayKey={todayKey}
            selectedDate={selectedTipDay}
            startDate={startDateKey}
            getStatus={dateKey => {
              const targets = getTargetsForDate(tip, dateKey);

              const fulfilled = isTipFulfilled(targets);

              const ratio = getTargetRatio(targets);

              if (fulfilled) {
                return {
                  state: 'fulfilled',
                  ratio: 1,
                };
              }

              if (ratio > 0) {
                return {
                  state: 'partial',
                  ratio,
                };
              }

              return {
                state: 'none',
                ratio: 0,
              };
            }}
            onSelectDate={dateKey => {
              if (dateKey > todayKey) {
                return;
              }

              setSelectedTipDay(previous => (previous === dateKey ? '' : dateKey));
            }}
          />
        )}

        {isSelectedDayBeforeStart && !weekBeforeStart && (
          <ThemedText
            type="default"
            style={[
              styles.notActiveText,
              styles.selectedDayInfoText,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {t('common:progress.notActiveStarts', {
              date: startLabel,
            })}
          </ThemedText>
        )}

        {!!selectedTipDay && !isSelectedDayBeforeStart && selectedTargets.length > 0 && (
          <View style={styles.targetSummaryBlock}>{selectedTargets.map(renderTargetSummary)}</View>
        )}

        {!weekBeforeStart && streak > 0 && (
          <View
            style={[
              styles.streakBadge,
              {
                backgroundColor: colors.accentWeak,
              },
            ]}
          >
            <View style={styles.streakMainRow}>
              <ThemedText type="explainer">
                {'🔥 '}
                {t('common:progress.currentStreak')}
              </ThemedText>

              <ThemedText
                type="default"
                style={{
                  color: colors.primary,
                }}
              >
                {t('common:progress.currentStreakDays', {
                  count: streak,
                })}
              </ThemedText>
            </View>

            {isYesterdayStreak && (
              <ThemedText type="explainer" style={styles.streakReminderText}>
                {t('common:progress.streakReminder')}
              </ThemedText>
            )}
          </View>
        )}

        <ThemedText type="explainer" style={styles.pastWeeksHeading}>
          {t('progress.last4Weeks')}
        </ThemedText>

        <PastWeeksProgress
          weeks={pastWeekProgress}
          selectedWeekStart={selectedWeekStart ?? pastWeeks[3].start}
          daysLabel={t('progress.days')}
          onSelectWeek={weekStart => {
            setSelectedWeekStart(weekStart);
            setSelectedTipDay('');
          }}
        />
      </View>
    );
  };

  const renderWeeklyTip = (tip: TrainingTipHistoryItem) => {
    const selectedTargets = getTargetsForDate(tip, selectedWeek.start);

    return (
      <View
        key={tip.tipId}
        style={[
          styles.tipBlock,
          {
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <ProgressTipHeader tipId={tip.tipId} title={tip.title} />

        <View style={styles.weekStatusRow}>
          {pastWeeks.map(week => {
            const targets = getTargetsForDate(tip, week.start);

            const fulfilled = isTipFulfilled(targets);

            const ratio = getTargetRatio(targets);

            const hasPartialProgress = !fulfilled && ratio > 0;

            const isSelected = (selectedWeekStart ?? pastWeeks[3].start) === week.start;

            let statusIcon = '✗';
            let statusColor = colors.textMuted;

            if (fulfilled) {
              statusIcon = '✓';
              statusColor = colors.primary;
            } else if (hasPartialProgress) {
              statusIcon = PARTIAL_PROGRESS_ICON;
              statusColor = colors.goldSoft;
            }

            return (
              <TouchableOpacity
                key={`${tip.tipId}-${week.start}`}
                onPress={() => setSelectedWeekStart(week.start)}
                style={[
                  styles.weekStatusCell,
                  {
                    backgroundColor: isSelected ? colors.background : colors.secondaryBackground,
                    borderColor: isSelected ? colors.primary : colors.textWeak,
                  },
                  isSelected && styles.weekStatusCellSelected,
                ]}
              >
                <ThemedText
                  type="caption"
                  style={[
                    styles.weekStatusDate,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  {week.label}
                </ThemedText>

                <View
                  style={[
                    styles.weekStatusIconRing,
                    {
                      backgroundColor: fulfilled ? colors.accentWeak : colors.overlayLight,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.weekStatusIcon,
                      {
                        color: statusColor,
                      },
                    ]}
                  >
                    {statusIcon}
                  </ThemedText>
                </View>

                <ThemedText
                  type="explainer"
                  style={[
                    styles.weekStatusText,
                    {
                      color: statusColor,
                    },
                  ]}
                >
                  {fulfilled ? t('progress.fulfilled') : hasPartialProgress ? t('progress.inProgress') : t('progress.notFulfilled')}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.targetSummaryBlock}>{selectedTargets.map(renderTargetSummary)}</View>
      </View>
    );
  };

  return (
    <Container background="default" showBackButton onBackPress={() => router.back()}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title2" style={styles.heading}>
          {t('progress.title')}
        </ThemedText>

        <ProgressDateNavigator
          label={dateRangeLabel}
          canGoForward={canGoForward}
          onBack={() => {
            goBackWeeks();
            setSelectedTipDay('');
          }}
          onForward={() => {
            goForwardWeeks();
            setSelectedTipDay('');
          }}
        />

        {dailyTips.length > 0 && (
          <Collapsible title={t('nutritionLogger.periodDaily')} titleType="title3" contentStyle={styles.collapsibleContent}>
            <Card style={styles.card} transparent={false}>
              {dailyTips.map(renderDailyTip)}
            </Card>
          </Collapsible>
        )}

        {weeklyTips.length > 0 && (
          <Collapsible title={t('nutritionLogger.periodWeekly')} titleType="title3" contentStyle={styles.collapsibleContent}>
            <Card style={styles.card} transparent={false}>
              {weeklyTips.map(renderWeeklyTip)}
            </Card>
          </Collapsible>
        )}

        {trackedTips.length === 0 && (
          <ThemedText
            type="caption"
            style={{
              color: colors.textMuted,
            }}
          >
            {t('progress.noTargets')}
          </ThemedText>
        )}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
    gap: 8,
  },
  heading: {
    marginBottom: -18,
    textAlign: 'center',
  },
  collapsibleContent: {
    marginLeft: 0,
    marginTop: 4,
  },
  card: {
    gap: 0,
  },
  tipBlock: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  selectedWeekRange: {
    fontSize: 11,
    marginBottom: 6,
    marginTop: -10,
  },
  notActiveText: {
    marginBottom: 10,
  },
  selectedDayInfoText: {
    marginTop: 10,
    marginBottom: 0,
  },
  targetSummaryBlock: {
    marginTop: 10,
    gap: 6,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  targetName: {
    flex: 1,
  },
  targetValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pastWeeksHeading: {
    marginTop: 10,
    marginBottom: 4,
  },
  streakBadge: {
    alignSelf: 'flex-start',
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 8,
  },
  streakMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakReminderText: {
    marginTop: 6,
  },
  weekStatusRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  weekStatusCell: {
    flex: 1,
    minHeight: 82,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  weekStatusCellSelected: {
    borderWidth: 1.5,
  },
  weekStatusDate: {
    fontSize: 9,
    textAlign: 'center',
  },
  weekStatusIconRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekStatusIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  weekStatusText: {
    fontSize: 10,
    textAlign: 'center',
  },
});
