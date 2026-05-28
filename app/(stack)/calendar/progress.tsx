import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { type DailyNutritionSummary, useStorage } from '@/app/context/StorageContext';
import { Collapsible } from '@/components/Collapsible';
import { ThemedText } from '@/components/ThemedText';
import TipTarget from '@/components/TipTarget';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { isAminoAcidTargetTag } from '@/constants/aminoAcids';
import { isFiberTargetTag } from '@/constants/fiber';
import { isMineralTargetTag } from '@/constants/minerals';
import { isPolyphenolTargetTag } from '@/constants/polyphenols';
import { isVitaminTargetTag } from '@/constants/vitamins';
import { getTipTargetIconName, tips } from '@/locales/tips';
import { type NutritionTargetPeriod } from '@/types/nutritionTargets';
import { formatMonthDay, formatMonthDayRange, fromDateKey, toDateKey } from '@/utils/dateUtils';

// ── Date helpers ───────────────────────────────────────────────────────────────

const getWeekStartMonday = (d: Date): Date => {
  const result = new Date(d);
  const diff = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (d: Date, n: number): Date => {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
};

const getCurrentWeek = (): string[] => {
  const weekStart = getWeekStartMonday(new Date());
  return Array.from({ length: 7 }, (_v, j) => toDateKey(addDays(weekStart, j)));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _getCurrentWeek = getCurrentWeek;

type PastWeek = { start: string; end: string; label: string; days: string[]; isCurrent: boolean };

const getLast4Weeks = (offsetWeeks = 0, language = 'en'): PastWeek[] => {
  const currentWeekStart = getWeekStartMonday(new Date());
  return Array.from({ length: 4 }, (_, i) => {
    const weekStart = addDays(currentWeekStart, (-(3 - i) + offsetWeeks) * 7);
    const weekEnd = addDays(weekStart, 6);
    const label = formatMonthDayRange(weekStart, weekEnd, language);
    return {
      start: toDateKey(weekStart),
      end: toDateKey(weekEnd),
      label,
      days: Array.from({ length: 7 }, (_v, j) => toDateKey(addDays(weekStart, j))),
      isCurrent: i === 3 && offsetWeeks === 0,
    };
  });
};

// ── Nutrient helpers ──────────────────────────────────────────────────────────

const sumMealsForTag = (meals: DailyNutritionSummary['meals'], tag: string): number => {
  let total = 0;
  for (const meal of meals) {
    if (isMineralTargetTag(tag)) total += meal.mineralsByType?.[tag] ?? 0;
    else if (isVitaminTargetTag(tag)) total += meal.vitaminsByType?.[tag] ?? 0;
    else if (isAminoAcidTargetTag(tag)) total += meal.aminoAcidsByType?.[tag] ?? 0;
    else if (isFiberTargetTag(tag)) total += meal.fiberByType?.[tag] ?? 0;
    else if (isPolyphenolTargetTag(tag)) total += meal.polyphenolByType?.[tag] ?? 0;
  }
  return total;
};

const getDayRatioForTip = (
  tipId: string,
  dateKey: string,
  summaries: Record<string, DailyNutritionSummary>
): number => {
  const tip = tips.find(t => t.id === tipId);
  if (!tip) return 0;
  const allTargets = [
    ...(tip.mineralTargets ?? []),
    ...(tip.vitaminTargets ?? []),
    ...(tip.aminoAcidTargets ?? []),
    ...(tip.polyphenolTargets ?? []),
    ...(tip.fiberTargets ?? []),
  ];
  if (allTargets.length === 0) return 0;
  const meals = summaries[dateKey]?.meals ?? [];
  if (meals.length === 0) return 0;
  let totalRatio = 0;
  for (const target of allTargets) {
    const tag = (target as { tag?: string }).tag ?? '';
    if (!tag || !target.amount) continue;
    totalRatio += Math.min(sumMealsForTag(meals, tag) / target.amount, 1);
  }
  return totalRatio / allTargets.length;
};

const getWeeklyProgressText = (
  tipId: string,
  weekStartISO: string,
  weeklyTracking: Record<string, Record<string, string[] | number>>
): string | null => {
  const tip = tips.find(t => t.id === tipId);
  if (!tip) return null;

  const trackingTargets = (tip.trackingTargets ?? []).filter(target =>
    Number.isFinite(target.amount) && (target.amount ?? 0) > 0
  );
  if (!trackingTargets.length) return null;

  const weekData = weeklyTracking[weekStartISO] ?? {};
  const getActual = (trackingKey: string): number => {
    const value = weekData[trackingKey];
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    return 0;
  };

  const preferredTarget =
    trackingTargets.find(target => getActual(target.trackingKey) < (target.amount ?? 0)) ??
    trackingTargets[0];

  const amount = preferredTarget.amount ?? 0;
  const actual = getActual(preferredTarget.trackingKey);
  return `${Math.round(actual)}/${Math.round(amount)}`;
};

// ── Types ──────────────────────────────────────────────────────────────────────

type TipHistoryItem = {
  tipId: string;
  title: string;
  period: NutritionTargetPeriod;
  startedAt: string;
};

type DailyTargetSummary = {
  tag: string;
  unit: 'mg' | 'g';
  period: 'daily';
  amount: number;
  actual: number;
  foodActual: number;
  supplementActual: number;
  isMet: boolean;
  label: string;
  supplementIds?: string[];
};

// ── Component ──────────────────────────────────────────────────────────────────

const DAY_LABELS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const isDateKeyBefore = (a: string, b: string): boolean => a < b;
const PARTIAL_PROGRESS_ICON = '◐';
const normalizeSupplementKey = (value: string | undefined): string =>
  (value ?? '').trim().toLowerCase();

const parseQuantity = (value: string | undefined): number | null => {
  const parsed = Number.parseFloat((value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeUnit = (value: string | undefined): string =>
  (value ?? '').trim().toLowerCase();

const toMilligrams = (quantity: number, unit: string): number | null => {
  if (unit === 'mg') return quantity;
  if (unit === 'g') return quantity * 1000;
  if (unit === 'mcg' || unit === 'ug' || unit === 'μg') return quantity / 1000;
  return null;
};

const toGrams = (quantity: number, unit: string): number | null => {
  if (unit === 'g') return quantity;
  if (unit === 'mg') return quantity / 1000;
  if (unit === 'mcg' || unit === 'ug' || unit === 'μg') return quantity / 1_000_000;
  return null;
};

const getNutritionLabelGroup = (tag: string, unit: 'mg' | 'g'):
  | 'aminoAcidLabels'
  | 'mineralLabels'
  | 'vitaminLabels'
  | 'fiberLabels'
  | 'polyphenolLabels' => {
  if (isAminoAcidTargetTag(tag)) return 'aminoAcidLabels';
  if (isMineralTargetTag(tag)) return 'mineralLabels';
  if (isVitaminTargetTag(tag)) return 'vitaminLabels';
  if (unit === 'g') return 'fiberLabels';
  return 'polyphenolLabels';
};

export default function NutritionProgressScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { plans, nutritionXpClaims, dailyNutritionSummaries, weeklyTracking, takenDates } = useStorage();
  const language = i18n.resolvedLanguage ?? i18n.language;

  const [weekOffset, setWeekOffset] = useState(0);
  const pastWeeks = useMemo(() => getLast4Weeks(weekOffset, language), [weekOffset, language]);
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const dateRangeLabel = useMemo(() => {
    const start = fromDateKey(pastWeeks[0].start);
    const end = fromDateKey(pastWeeks[3].end);
    return formatMonthDayRange(start, end, language);
  }, [pastWeeks, language]);

  const goBackWeeks = () => {
    setSelectedTipDay('');
    setWeekOffset(prev => prev - 4);
    setSelectedWeekStart(null);
  };
  const goForwardWeeks = () => {
    setSelectedTipDay('');
    setWeekOffset(prev => Math.min(prev + 4, 0));
    setSelectedWeekStart(null);
  };

  const trackedTips = useMemo<TipHistoryItem[]>(() => {
    return (plans?.nutrition ?? []).flatMap(entry => {
      const tip = tips.find(candidate => candidate.id === entry.tipId);
      if (!tip?.targetPeriod) return [];
      return [{
        tipId: entry.tipId,
        title: t(`tips:${entry.tipId}.title`),
        period: tip.targetPeriod as NutritionTargetPeriod,
        startedAt: entry.startedAt,
      }];
    });
  }, [plans, t]);

  const dailyTips = useMemo(() => trackedTips.filter(tip => tip.period === 'daily'), [trackedTips]);
  const weeklyTips = useMemo(() => trackedTips.filter(tip => tip.period === 'weekly'), [trackedTips]);

  const isClaimed = (tipId: string, period: NutritionTargetPeriod, key: string) =>
    !!nutritionXpClaims?.[`${tipId}|${period}|${key}`];

  const getProgressColor = (actual: number, total: number): string => {
    if (!Number.isFinite(actual) || !Number.isFinite(total) || total <= 0 || actual <= 0) {
      return colors.textMuted;
    }
    if (actual < total) return colors.goldSoft;
    return colors.accentColor;
  };

  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);
  const [selectedTipDay, setSelectedTipDay] = useState<string>('');

  React.useEffect(() => {
    setSelectedTipDay(todayKey);
  }, [todayKey]);

  const getSelectedWeek = (): PastWeek =>
    pastWeeks.find(w => w.start === selectedWeekStart) ?? pastWeeks[3];

  const getStreakStatus = (tipId: string): { streak: number; isYesterdayStreak: boolean } => {
    const today = new Date();
    const todayDateKey = toDateKey(today);

    const startFrom = new Date(today);
    let isYesterdayStreak = false;

    if (!isClaimed(tipId, 'daily', todayDateKey)) {
      startFrom.setDate(startFrom.getDate() - 1);
      const yesterdayKey = toDateKey(startFrom);
      if (!isClaimed(tipId, 'daily', yesterdayKey)) {
        return { streak: 0, isYesterdayStreak: false };
      }
      isYesterdayStreak = true;
    }

    let streak = 0;
    const cursor = new Date(startFrom);
    while (true) {
      const key = toDateKey(cursor);
      if (!isClaimed(tipId, 'daily', key)) break;
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return { streak, isYesterdayStreak };
  };

  const toggleSelectedTipDay = (dateKey: string, isDisabled: boolean) => {
    if (isDisabled) return;
    setSelectedTipDay(prev => prev === dateKey ? '' : dateKey);
  };

  const buildDailyTipTargets = (tipId: string, dateKey: string): DailyTargetSummary[] => {
    const tip = tips.find(candidate => candidate.id === tipId);
    if (!tip) return [];

    const targetConfigs = [
      ...(tip.mineralTargets ?? []),
      ...(tip.vitaminTargets ?? []),
      ...(tip.aminoAcidTargets ?? []),
      ...(tip.polyphenolTargets ?? []),
      ...(tip.fiberTargets ?? []),
    ].filter(target => (target.unit === 'mg' || target.unit === 'g') && Number.isFinite(target.amount));

    const tipSupplementIds = (tip.supplements ?? [])
      .map(entry => normalizeSupplementKey(entry.id))
      .filter(Boolean);

    const supplementsForDay = takenDates[dateKey] ?? [];

    return targetConfigs.map(target => {
      const tag = (target as { tag?: string }).tag ?? '';
      const amount = target.amount ?? 0;
      const foodActual = tag ? sumMealsForTag(dailyNutritionSummaries[dateKey]?.meals ?? [], tag) : 0;

      const explicitTargetSupplementIds = ((target as { supplementIds?: string[] }).supplementIds ?? [])
        .map(id => normalizeSupplementKey(id))
        .filter(Boolean);
      let matchedSupplementIds = tipSupplementIds;
      if (explicitTargetSupplementIds.length > 0) {
        matchedSupplementIds = explicitTargetSupplementIds;
      }
      const matchedSet = new Set(matchedSupplementIds);

      let supplementActual = 0;
      supplementsForDay.forEach(supplement => {
        const idKey = normalizeSupplementKey(supplement.id);
        const nameKey = normalizeSupplementKey(supplement.name);
        if (!matchedSet.has(idKey) && !matchedSet.has(nameKey)) return;

        const quantity = parseQuantity(supplement.quantity);
        if (quantity === null) return;

        const sourceUnit = normalizeUnit(supplement.unit);
        let converted: number | null;
        if (target.unit === 'mg') {
          converted = toMilligrams(quantity, sourceUnit);
        } else {
          converted = toGrams(quantity, sourceUnit);
        }
        if (converted === null) return;

        supplementActual += converted;
      });

      const labelGroup = getNutritionLabelGroup(tag, target.unit);

      const actual = foodActual + supplementActual;
      return {
        tag,
        unit: target.unit,
        period: 'daily' as const,
        amount,
        actual,
        foodActual,
        supplementActual,
        isMet: actual >= amount,
        label: t(`nutritionLogger.${labelGroup}.${tag}`),
        supplementIds: (target as { supplementIds?: string[] }).supplementIds,
      };
    });
  };

  const renderDailyTip = (tip: TipHistoryItem) => {
    const selectedWeek = getSelectedWeek();
    const startDateKey = toDateKey(new Date(tip.startedAt));
    const weekBeforeStart = isDateKeyBefore(selectedWeek.end, startDateKey);
    const startLabel = formatMonthDay(fromDateKey(startDateKey), language);
    const isStartWeek = selectedWeek.start <= startDateKey && startDateKey <= selectedWeek.end;
    const { streak, isYesterdayStreak } = getStreakStatus(tip.tipId);
    const visibleDays = selectedWeek.days.filter(
      (d: string) => d <= todayKey && !isDateKeyBefore(d, startDateKey)
    );
    const claimedDays = visibleDays.filter((d: string) => isClaimed(tip.tipId, 'daily', d));
    const claimedCount = claimedDays.length;
    const countColor = getProgressColor(claimedCount, visibleDays.length);
    const isSelectedDayBeforeStart = !!selectedTipDay && isDateKeyBefore(selectedTipDay, startDateKey);
    const selectedDayTargets = selectedTipDay ? buildDailyTipTargets(tip.tipId, selectedTipDay) : [];
    return (
      <View key={tip.tipId} style={styles.tipBlock}>
        <View style={styles.tipHeader}>
          {getTipTargetIconName(tip.tipId) && (
            <View style={[styles.iconCircle, { backgroundColor: colors.accentWeak }]}>
              <IconSymbol name={getTipTargetIconName(tip.tipId)!} size={20} color={colors.textMuted} />
            </View>
          )}
          <ThemedText type="defaultSemiBold" style={styles.tipTitle}>
            {tip.title}
          </ThemedText>
          {!weekBeforeStart && (
            <>
              <ThemedText type="title3" style={[styles.tipCount, { color: countColor }]}>
                {`${claimedCount}`}
              </ThemedText>
              <ThemedText type="caption" style={[{ color: colors.textMuted }]}>
                {`/ ${visibleDays.length} ${t('common:progress.days')}`}
              </ThemedText>
            </>
          )}
        </View>
        <ThemedText type="caption" style={[styles.selectedWeekRange, { color: colors.textMuted }]}>
          {selectedWeek.label}
          {isStartWeek && (
            <ThemedText type="pill" style={{ color: colors.goldSuperSoft }}>
              {` • ${t('common:progress.startsOn', { date: startLabel })}`}
            </ThemedText>
          )}
        </ThemedText>
        {weekBeforeStart ? (
          <ThemedText type="default" style={[styles.notActiveText, { color: colors.textMuted }]}>
            {t('common:progress.notActiveStarts', { date: startLabel })}
          </ThemedText>
        ) : (
          <View style={styles.weekRow}>
            {selectedWeek.days.map((dateKey: string, i: number) => {
              const fulfilled = isClaimed(tip.tipId, 'daily', dateKey);
              const ratio = getDayRatioForTip(tip.tipId, dateKey, dailyNutritionSummaries);
              const hasPartialProgress = ratio > 0;
              const isToday = dateKey === todayKey;
              const isSelectedDay = selectedTipDay === dateKey;
              const isFuture = dateKey > todayKey;
              const isBeforeStart = isDateKeyBefore(dateKey, startDateKey);
              const isStartDay = dateKey === startDateKey;
              let dayLabelColor = colors.textMuted;
              if (isToday) {
                dayLabelColor = colors.accentColor;
              }
              if (isStartDay) {
                dayLabelColor = colors.goldSoft;
              }
              let iconColor = colors.textMuted;
              let cellBackground = colors.overlayLight;

              let iconChar = '\u2717';

              if (fulfilled) {
                iconChar = '\u2713';

                // BEST STATE
                iconColor = colors.progressSuccessIcon;
                cellBackground = colors.progressSuccessCell;
              } else if (hasPartialProgress) {
                iconChar = PARTIAL_PROGRESS_ICON;

                // PARTIAL
                iconColor = colors.progressPartialIcon;
                cellBackground = colors.overlayLight;
              }

              if (isFuture || isBeforeStart) {
                iconChar = '';
                iconColor = colors.secondaryBackground;
                cellBackground = colors.overlayLight;
              }
              return (
                <View
                  key={dateKey}
                  style={styles.dayColumn}
                >
                  <ThemedText
                    type="caption"
                    style={[
                      styles.dayLabel,
                      (isToday || isStartDay) && styles.dayLabelUnderlined,
                      { color: dayLabelColor },
                    ]}
                  >
                    {DAY_LABELS[i].label}
                  </ThemedText>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => toggleSelectedTipDay(dateKey, isFuture)}
                    style={[
                      styles.dayCell,
                      { backgroundColor: cellBackground },
                      isBeforeStart && styles.dayCellBeforeStart,
                      isSelectedDay && styles.dayCellSelected,
                      isSelectedDay && { borderColor: colors.accentColor },
                    ]}
                  >
                    <ThemedText style={[styles.dayCellIcon, { color: iconColor }]}>
                      {iconChar}
                    </ThemedText>
                  </TouchableOpacity>
                  {isSelectedDay && (
                    <ThemedText type="title2" style={[styles.dayCellArrow, { color: colors.accentColor }]}>
                      {'⌵'}
                    </ThemedText>
                  )}
                </View>
              );
            })}
          </View>
        )}
        {isSelectedDayBeforeStart && !weekBeforeStart && (
          <ThemedText type="default" style={[styles.notActiveText, styles.selectedDayInfoText, { color: colors.textMuted }] }>
            {t('common:progress.notActiveStarts', { date: startLabel })}
          </ThemedText>
        )}
        {!!selectedTipDay && !isSelectedDayBeforeStart && selectedDayTargets.length > 0 && (
          <View style={styles.weekSummaryBlock}>
            {selectedDayTargets.map(target => (
              <TipTarget
                key={`${tip.tipId}-${selectedTipDay}-${target.tag}`}
                tip={{ tipId: tip.tipId, title: tip.title, dateKey: selectedTipDay }}
                target={target}
                colors={colors}
              />
            ))}
          </View>
        )}
        {!weekBeforeStart && streak > 0 && (
          <Badge style={[styles.streakBadge, { backgroundColor: colors.accentWeak }]}>
            <View style={styles.streakMainRow}>
              <ThemedText type="explainer" style={styles.streakBadgeText}>
                {'🔥 '}{t('common:progress.currentStreak')}
              </ThemedText>
              <ThemedText type="default" style={[styles.streakBadgeText, { color: colors.primary }]}>
                {t('common:progress.currentStreakDays', { count: streak })}
              </ThemedText>
            </View>
            {isYesterdayStreak && (
              <ThemedText type="explainer" style={[styles.streakReminderText, { color: colors.textMuted }]}>
                {t('common:progress.streakReminder')}
              </ThemedText>
            )}
          </Badge>
        )}
        <ThemedText type="caption" style={[styles.pastWeeksHeading, { color: colors.textMuted }]}>
          {t('progress.last4Weeks')}
        </ThemedText>
        <View style={styles.pastWeeksRow}>
          {pastWeeks.map(week => {
            const pastDays = week.days.filter((d: string) => d <= todayKey);
            const count = pastDays.filter((d: string) => isClaimed(tip.tipId, 'daily', d)).length;
            const total = pastDays.length;
            const isSelected = (selectedWeekStart ?? pastWeeks[3].start) === week.start;
            const pastCountColor = getProgressColor(count, total);
            return (
              <TouchableOpacity
                key={week.start}
                onPress={() => setSelectedWeekStart(week.start)}
                style={[
                  styles.pastWeekCell,
                  {
                    backgroundColor: isSelected ? colors.background : colors.secondaryBackground,
                    borderColor: isSelected ? colors.primary : colors.textWeak,
                  },
                  isSelected && styles.pastWeekCellCurrent,
                ]}
              >
                <ThemedText type="caption" style={[styles.pastWeekLabel, { color: colors.textMuted }]}>
                  {week.label}
                </ThemedText>
                <ThemedText type="title3" style={[styles.pastWeekCount, { color: pastCountColor }]}>
                  {`${count}/${total}`}
                </ThemedText>
                <ThemedText type="explainer" style={styles.pastWeekDaysLabel}>
                  {t('progress.days')}
                </ThemedText>
                <View style={styles.miniBarRow}>
                  {week.days.map((d: string) => {
                    const isFutureDay = d > todayKey;
                    if (isFutureDay) return <View key={d} style={styles.miniBarTrack} />;
                    const done = isClaimed(tip.tipId, 'daily', d);
                    const ratio = getDayRatioForTip(tip.tipId, d, dailyNutritionSummaries);
                    let fillHeight: number;
                    if (ratio > 0) {
                      fillHeight = Math.max(Math.round(ratio * 26), 2);
                    } else if (done) {
                      fillHeight = 26;
                    } else {
                      fillHeight = 1;
                    }
                    return (
                      <View key={d} style={styles.miniBarTrack}>
                        <View
                          style={[
                            styles.miniBarFill,
                            { height: fillHeight, backgroundColor: done ? colors.accentMedium : colors.border },
                          ]}
                        />
                      </View>
                    );
                  })}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderWeeklyTip = (tip: TipHistoryItem) => {
    const selectedWeek = getSelectedWeek();
    const weekData = weeklyTracking[selectedWeek.start] ?? {};
    const tipObj = tips.find(candidate => candidate.id === tip.tipId);
    const summaryTargets: Array<{
      tag: string;
      unit: 'items' | 'count';
      period: 'weekly';
      amount: number;
      actual: number;
      isMet: boolean;
      label: string;
      trackedItems?: string[];
    }> = [];

    for (const target of tipObj?.trackingTargets ?? []) {
      const value = weekData[target.trackingKey];
      let actual = 0;
      if (Array.isArray(value)) {
        actual = value.length;
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        actual = value;
      }

      const amount = target.amount ?? 0;
      if (amount <= 0) {
        continue;
      }

      summaryTargets.push({
        tag: target.trackingKey,
        unit: target.unit,
        period: 'weekly',
        amount,
        actual,
        isMet: actual >= amount,
        label: t(`nutritionLogger.weeklyTrackingLabels.${target.trackingKey}`),
        trackedItems: Array.isArray(value) ? value : undefined,
      });
    }

    return (
      <View key={tip.tipId} style={[styles.tipBlock, { borderBottomColor: colors.borderLight }]}>
        <ThemedText type="defaultSemiBold" style={styles.tipTitle}>
          {tip.title}
        </ThemedText>
        <View style={styles.weekStatusRow}>
          {pastWeeks.map(week => {
            const fulfilled = Boolean(isClaimed(tip.tipId, 'weekly', week.start));
            const weekProgressText = getWeeklyProgressText(tip.tipId, week.start, weeklyTracking);
            let weekProgressColor = colors.textMuted;
            let weekActual = 0;
            if (weekProgressText) {
              const [actualRaw, amountRaw] = weekProgressText.split('/');
              const actual = Number(actualRaw);
              const amount = Number(amountRaw);
              weekActual = actual;
              weekProgressColor = getProgressColor(actual, amount);
            }
            const hasPartialProgress = weekActual > 0;
            const isSelected = (selectedWeekStart ?? pastWeeks[3].start) === week.start;
            let weekStatusIconColor = colors.textMuted;
            if (fulfilled) {
              weekStatusIconColor = colors.primary;
            } else if (hasPartialProgress) {
              weekStatusIconColor = colors.goldSoft;
            }
            let weekStatusIcon = '✗';
            if (fulfilled) {
              weekStatusIcon = '✓';
            } else if (hasPartialProgress) {
              weekStatusIcon = PARTIAL_PROGRESS_ICON;
            }
            return (
              <TouchableOpacity
                key={`${tip.tipId}-${week.start}`}
                onPress={() => setSelectedWeekStart(week.start)}
                style={[
                  styles.weekStatusCell,
                  { backgroundColor: isSelected ? colors.background : colors.secondaryBackground, borderColor: colors.textWeak },
                  isSelected && styles.weekStatusCellSelected,
                  isSelected && { borderColor: colors.primary },
                ]}
              >
                <ThemedText type="caption" style={[styles.weekStatusDate, { color: colors.textMuted }]}>
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
                      { color: weekStatusIconColor },
                    ]}
                  >
                    {weekStatusIcon}
                  </ThemedText>
                </View>
                <ThemedText type="explainer" style={[styles.weekStatusProgress, { color: weekProgressColor }]}>
                  {weekProgressText}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.weekSummaryBlock}>
          {summaryTargets.map(target => (
            <TipTarget
              key={`${tip.tipId}-${target.tag}-${target.period}`}
              tip={tip}
              target={target}
              colors={colors}
            />
          ))}
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
        <View style={styles.dateRangeRow}>
          <TouchableOpacity onPress={goBackWeeks} style={styles.navArrow}>
            <ThemedText type="title" style={{ color: colors.primary }}>{'\u2039'}</ThemedText>
          </TouchableOpacity>
          <ThemedText type="caption" style={[styles.dateRange, { color: colors.textMuted }]}>
            {dateRangeLabel}
          </ThemedText>
          <TouchableOpacity onPress={goForwardWeeks} style={styles.navArrow} disabled={weekOffset === 0}>
            <ThemedText type="title" style={{ color: weekOffset === 0 ? colors.border : colors.primary }}>{'\u203a'}</ThemedText>
          </TouchableOpacity>
        </View>

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
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
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
  periodHeading: {
    marginTop: 8,
    textTransform: 'capitalize',
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
  tipTitle: {
    flex: 1,
    marginBottom: 0,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCount: {
    marginRight: 2,
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
  weekRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    maxWidth: 36,
  },
  dayLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  dayLabelUnderlined: {
    textDecorationLine: 'underline',
  },
  dayCell: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    borderWidth: 1.5,
  },
  dayCellBeforeStart: {
    opacity: 0.6,
  },
  dayCellIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  dayCellArrow: {
    marginTop: -14,
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
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  streakBadgeText: {
  },
  streakMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakReminderText: {
    marginTop: 6,
  },
  pastWeeksRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  pastWeekCell: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 2,
  },
  pastWeekCellCurrent: {
    borderWidth: 2,
  },
  pastWeekLabel: {
    fontSize: 9,
    textAlign: 'center',
  },
  pastWeekCount: {
  },
  pastWeekDaysLabel: {
    marginTop: -6,
  },
  miniBarRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'flex-end',
    height: 26,
    marginTop: 4,
    width: '100%',
  },
  miniBarTrack: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  miniBarFill: {
    width: '100%',
    borderRadius: 2,
  },
  miniBarDone: {
    height: 16,
  },
  miniBarMiss: {
    height: 3,
  },
  miniBarFuture: {
    height: 0,
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
  weekStatusProgress: {
    fontSize: 10,
    marginTop: -2,
  },
  weekSummaryBlock: {
    marginTop: 10,
    gap: 4,
  },
});
