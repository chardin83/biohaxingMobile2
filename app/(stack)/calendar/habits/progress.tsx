import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
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
import { PastWeek, useProgressWeeks } from '@/hooks/useWeekProgress';
import { HabitInputMode, TargetPeriod, tips } from '@/locales/tips';
import { formatMonthDay, fromDateKey, toDateKey } from '@/utils/dateUtils';
import { getUnitLabel } from '@/utils/metrics';

type HabitProgressTarget = {
  tipId: string;
  trackingKey: string;
  title: string;
  description: string;
  amount: number;
  unit: string;
  period: TargetPeriod;
  inputMode?: HabitInputMode;
  buttonLabels: string[];
  startedAt: string;
};

export default function HabitProgressScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { plans, dailyHabitTracking } = useStorage();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const isDateKeyBefore = (a: string, b: string): boolean => a < b;

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

  const translateUnit = useCallback(
    (unit: string) => {
      return getUnitLabel(unit, t);
    },
    [t]
  );

  const targets = useMemo<HabitProgressTarget[]>(() => {
    return (plans.other ?? []).flatMap(plan => {
      const tip = tips.find(candidate => candidate.id === plan.tipId);

      if (!tip || !tip.targetPeriod) {
        return [];
      }

      const period: 'daily' | 'weekly' = tip.targetPeriod === 'weekly' ? 'weekly' : 'daily';

      return (tip.habitTargets ?? []).map(target => ({
        tipId: tip.id,
        trackingKey: target.trackingKey,
        title: t(`tips:${tip.id}.title`, {
          defaultValue: tip.id,
        }),
        description: t(`tips:${tip.id}.habitTargets.description`, {
          defaultValue: '',
        }),
        amount: target.amount,
        unit: target.unit,
        period,
        inputMode: target.inputMode,
        buttonLabels: target.buttonLabels ?? [],
        startedAt: plan.startedAt,
      }));
    });
  }, [plans.other, t]);

  const dailyTargets = useMemo(() => targets.filter(target => target.period === 'daily'), [targets]);

  const weeklyTargets = useMemo(() => targets.filter(target => target.period === 'weekly'), [targets]);

  const getDailyValue = (target: HabitProgressTarget, dateKey: string): number => {
    return dailyHabitTracking[dateKey]?.[target.trackingKey]?.value ?? 0;
  };

  const getWeekValue = (target: HabitProgressTarget, week: PastWeek): number => {
    return week.days.reduce((total, dateKey) => total + getDailyValue(target, dateKey), 0);
  };

  const getProgressColor = (actual: number, target: number): string => {
    if (actual <= 0) {
      return colors.textMuted;
    }

    if (actual < target) {
      return colors.goldSoft;
    }

    return colors.accentColor;
  };

  const renderSelectedDay = (target: HabitProgressTarget) => {
    if (!selectedDay) {
      return null;
    }

    const value = getDailyValue(target, selectedDay);

    const hasValue = dailyHabitTracking[selectedDay]?.[target.trackingKey]?.value !== undefined;

    if (!hasValue) {
      return null;
    }

    return (
      <View
        style={[
          styles.dayDetails,
          {
            backgroundColor: colors.overlayLight,
          },
        ]}
      >
        <ThemedText
          type="caption"
          style={{
            color: colors.textMuted,
          }}
        >
          {formatMonthDay(fromDateKey(selectedDay), language)}
        </ThemedText>
        {target.inputMode === 'number' ? (
          <ThemedText type="defaultSemiBold">{`${value} ${translateUnit(target.unit)}`}</ThemedText>
        ) : (
          <ThemedText
            type="defaultSemiBold"
            style={{
              color: colors.accentColor,
            }}
          >
            {'✓ '}
            {t('common:general.registered', {
              defaultValue: 'Registrerat',
            })}
          </ThemedText>
        )}
      </View>
    );
  };

  const renderDailyTarget = (target: HabitProgressTarget) => {
    const startDateKey = toDateKey(new Date(target.startedAt));

    const weekBeforeStart = isDateKeyBefore(selectedWeek.end, startDateKey);

    const isStartWeek = selectedWeek.start <= startDateKey && startDateKey <= selectedWeek.end;

    const startLabel = formatMonthDay(fromDateKey(startDateKey), language);

    const visibleDays = selectedWeek.days.filter(dateKey => dateKey <= todayKey && !isDateKeyBefore(dateKey, startDateKey));

    const completedDays = visibleDays.filter(dateKey => getDailyValue(target, dateKey) >= target.amount);

    const pastWeekProgress: PastWeekProgress[] = pastWeeks.map(week => {
      const validDays = week.days.filter(dateKey => dateKey <= todayKey && !isDateKeyBefore(dateKey, startDateKey));

      return {
        start: week.start,
        label: week.label,
        completed: validDays.filter(dateKey => getDailyValue(target, dateKey) >= target.amount).length,
        total: validDays.length,
        days: week.days.map(dateKey => {
          const disabled = dateKey > todayKey || isDateKeyBefore(dateKey, startDateKey);

          const value = getDailyValue(target, dateKey);
          const ratio = target.amount > 0 ? Math.min(value / target.amount, 1) : 0;

          return {
            date: dateKey,
            ratio,
            fulfilled: value >= target.amount,
            disabled,
          };
        }),
      };
    });

    return (
      <View
        key={`${target.tipId}-${target.trackingKey}`}
        style={[
          styles.tipBlock,
          {
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <ProgressTipHeader
          tipId={target.tipId}
          title={target.title}
          progress={`${completedDays.length}/${visibleDays.length}`}
          progressColor={getProgressColor(completedDays.length, visibleDays.length)}
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
            style={{
              color: colors.textMuted,
            }}
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
            selectedDate={selectedDay}
            startDate={startDateKey}
            getStatus={dateKey => {
              const value = getDailyValue(target, dateKey);

              if (value >= target.amount) {
                return {
                  state: 'fulfilled',
                  ratio: 1,
                };
              }

              if (value > 0) {
                return {
                  state: 'partial',
                  ratio: target.amount > 0 ? value / target.amount : 0,
                };
              }

              return {
                state: 'none',
                ratio: 0,
              };
            }}
            onSelectDate={dateKey => setSelectedDay(previous => (previous === dateKey ? '' : dateKey))}
          />
        )}
        {!weekBeforeStart && renderSelectedDay(target)}
        <ThemedText type="explainer" style={[styles.pastWeeksHeading]}>
          {t('progress.last4Weeks')}
        </ThemedText>

        <PastWeeksProgress
          weeks={pastWeekProgress}
          selectedWeekStart={selectedWeekStart ?? pastWeeks[3].start}
          daysLabel={t('progress.days')}
          onSelectWeek={weekStart => {
            setSelectedWeekStart(weekStart);
            setSelectedDay('');
          }}
        />
      </View>
    );
  };

  const renderWeeklyTarget = (target: HabitProgressTarget) => {
    const selectedActual = getWeekValue(target, selectedWeek);

    return (
      <View
        key={`${target.tipId}-${target.trackingKey}`}
        style={[
          styles.tipBlock,
          {
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <ProgressTipHeader tipId={target.tipId} title={target.title} />
        <View style={styles.weekStatusRow}>
          {pastWeeks.map(week => {
            const actual = getWeekValue(target, week);

            const fulfilled = actual >= target.amount;

            const hasProgress = actual > 0;

            const isSelected = (selectedWeekStart ?? pastWeeks[3].start) === week.start;

            const icon = fulfilled ? '✓' : hasProgress ? '◐' : '✗';

            const iconColor = fulfilled ? colors.progressSuccessIcon : hasProgress ? colors.progressPartialIcon : colors.textMuted;

            return (
              <TouchableOpacity
                key={week.start}
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
                        color: iconColor,
                      },
                    ]}
                  >
                    {icon}
                  </ThemedText>
                </View>
                <ThemedText
                  type="explainer"
                  style={{
                    color: getProgressColor(actual, target.amount),
                  }}
                >
                  {`${actual}/${target.amount}`}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
        <View
          style={[
            styles.weekSummary,
            {
              backgroundColor: colors.overlayLight,
            },
          ]}
        >
          <View>
            <ThemedText
              type="caption"
              style={{
                color: colors.textMuted,
              }}
            >
              {selectedWeek.label}
            </ThemedText>
            <ThemedText type="title3">{`${selectedActual} / ${target.amount} ${getUnitLabel(target.unit, t)}`}</ThemedText>
          </View>
          {selectedActual >= target.amount && (
            <ThemedText
              type="title2"
              style={{
                color: colors.progressSuccessIcon,
              }}
            >
              ✓
            </ThemedText>
          )}
        </View>
        <View style={styles.weekHistory}>
          {selectedWeek.days
            .filter(dateKey => getDailyValue(target, dateKey) > 0)
            .map(dateKey => {
              const value = getDailyValue(target, dateKey);

              return (
                <TouchableOpacity
                  key={dateKey}
                  onPress={() => setSelectedDay(dateKey)}
                  style={[
                    styles.historyValue,
                    {
                      backgroundColor: colors.overlayLight,
                    },
                  ]}
                >
                  <ThemedText type="explainer">{formatMonthDay(fromDateKey(dateKey), language)}</ThemedText>
                  {target.inputMode === 'number' ? <ThemedText type="caption">{`${value} ${getUnitLabel(target.unit, t)}`}</ThemedText> : null}
                </TouchableOpacity>
              );
            })}
        </View>
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
            setSelectedDay('');
          }}
          onForward={() => {
            goForwardWeeks();
            setSelectedDay('');
          }}
        />
        {dailyTargets.length > 0 && (
          <Collapsible title={t('nutritionLogger.periodDaily')} titleType="title3" contentStyle={styles.collapsibleContent}>
            <Card style={styles.card} transparent={false}>
              {dailyTargets.map(renderDailyTarget)}
            </Card>
          </Collapsible>
        )}
        {weeklyTargets.length > 0 && (
          <Collapsible title={t('nutritionLogger.periodWeekly')} titleType="title3" contentStyle={styles.collapsibleContent}>
            <Card style={styles.card} transparent={false}>
              {weeklyTargets.map(renderWeeklyTarget)}
            </Card>
          </Collapsible>
        )}
        {targets.length === 0 && (
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
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateRange: {
    textAlign: 'center',
  },
  navArrow: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    flex: 1,
  },
  selectedWeekRange: {
    fontSize: 11,
    marginBottom: 6,
    marginTop: -10,
  },
  dayDetails: {
    marginTop: 10,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pastWeeksHeading: {
    marginTop: 10,
    marginBottom: 4,
  },
  weekStatusRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  weekStatusCell: {
    flex: 1,
    minHeight: 72,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  weekStatusDate: {
    fontSize: 9,
    textAlign: 'center',
  },
  weekStatusCellSelected: {
    borderWidth: 1.5,
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
  weekSummary: {
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekHistory: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  historyValue: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
    alignItems: 'center',
  },
});
