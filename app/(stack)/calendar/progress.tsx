import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { type DailyNutritionSummary,useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import TipTarget from '@/components/TipTarget';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { isAminoAcidTargetTag } from '@/constants/aminoAcids';
import { isMineralTargetTag } from '@/constants/minerals';
import { isVitaminTargetTag } from '@/constants/vitamins';
import { getTipTargetIconName, tips } from '@/locales/tips';
import { type NutritionTargetPeriod } from '@/types/nutritionTargets';

// ── Date helpers ───────────────────────────────────────────────────────────────

const toDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

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

const MONTH_ABBRS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

type PastWeek = { start: string; end: string; label: string; days: string[]; isCurrent: boolean };

const getLast4Weeks = (offsetWeeks = 0): PastWeek[] => {
  const currentWeekStart = getWeekStartMonday(new Date());
  return Array.from({ length: 4 }, (_, i) => {
    const weekStart = addDays(currentWeekStart, (-(3 - i) + offsetWeeks) * 7);
    const weekEnd = addDays(weekStart, 6);
    const s = weekStart;
    const e = weekEnd;
    const label = s.getMonth() === e.getMonth()
      ? `${MONTH_ABBRS[s.getMonth()]} ${s.getDate()}\u2013${e.getDate()}`
      : `${MONTH_ABBRS[s.getMonth()]} ${s.getDate()}\u2013${MONTH_ABBRS[e.getMonth()]} ${e.getDate()}`;
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
    else if (isVitaminTargetTag(tag)) total += meal.polyphenolByType?.[tag] ?? 0;
    else if (isAminoAcidTargetTag(tag)) total += meal.fiberByType?.[tag] ?? 0;
    else total += meal.polyphenolByType?.[tag] ?? 0;
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

export default function NutritionProgressScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { plans, nutritionXpClaims, dailyNutritionSummaries, weeklyTracking } = useStorage();

  const [weekOffset, setWeekOffset] = useState(0);
  const pastWeeks = useMemo(() => getLast4Weeks(weekOffset), [weekOffset]);
  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const goBackWeeks = () => {
    setWeekOffset(prev => prev - 4);
    setSelectedWeekStart(null);
  };
  const goForwardWeeks = () => {
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
      }];
    });
  }, [plans, t]);

  const dailyTips = useMemo(() => trackedTips.filter(tip => tip.period === 'daily'), [trackedTips]);
  const weeklyTips = useMemo(() => trackedTips.filter(tip => tip.period === 'weekly'), [trackedTips]);

  const isClaimed = (tipId: string, period: NutritionTargetPeriod, key: string) =>
    !!nutritionXpClaims?.[`${tipId}|${period}|${key}`];

  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);

  const getSelectedWeek = (): PastWeek =>
    pastWeeks.find(w => w.start === selectedWeekStart) ?? pastWeeks[3];

  const getStreak = (tipId: string): number => {
    let streak = 0;
    const cursor = new Date();
    while (true) {
      const key = toDateKey(cursor);
      if (!isClaimed(tipId, 'daily', key)) break;
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  };

  const renderDailyTip = (tip: TipHistoryItem) => {
    const selectedWeek = getSelectedWeek();
    const streak = getStreak(tip.tipId);
    const visibleDays = selectedWeek.days.filter((d: string) => d <= todayKey);
    const claimedDays = visibleDays.filter((d: string) => isClaimed(tip.tipId, 'daily', d));
    const claimedCount = claimedDays.length;
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
        <ThemedText type="title3" style={[styles.tipCount, { color: colors.primary } ]}>
          {`${claimedCount}`}
        </ThemedText>
        <ThemedText type="caption" style={[ { color: colors.textMuted }]}>
          {`/ ${visibleDays.length} ${t('common:progress.days')}`}
        </ThemedText>
      </View>
      <ThemedText type="caption" style={[styles.selectedWeekRange, { color: colors.textMuted }]}>
        {selectedWeek.label}
      </ThemedText>
      <View style={styles.weekRow}>
        {selectedWeek.days.map((dateKey: string, i: number) => {
          const fulfilled = isClaimed(tip.tipId, 'daily', dateKey);
          const isToday = dateKey === todayKey;
          const isFuture = dateKey > todayKey;
          let iconColor = colors.textMuted;
          if (fulfilled) iconColor = colors.background;
          if (isFuture) iconColor = colors.secondaryBackground;
          let iconChar = '\u2717';
          if (fulfilled) iconChar = '\u2713';
          if (isFuture) iconChar = '';
          return (
            <View key={dateKey} style={styles.dayColumn}>
              <ThemedText
                type="caption"
                style={[styles.dayLabel, { color: isToday ? colors.primary : colors.textMuted }]}
              >
                {DAY_LABELS[i].label}
              </ThemedText>
              <View
                style={[
                  styles.dayCell,
                  { backgroundColor: fulfilled && !isFuture ? colors.accentMedium : colors.secondaryBackground },
                  isToday && styles.dayCellToday,
                  isToday && { borderColor: colors.primary },
                ]}
              >
                <ThemedText style={[styles.dayCellIcon, { color: iconColor }]}>
                  {iconChar}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>
      {streak > 0 && (
        <Badge style={[styles.streakBadge, { backgroundColor: colors.accentWeak }]}>
          <ThemedText type="explainer" style={styles.streakBadgeText}>
            {'🔥 '}{t('common:progress.currentStreak')}
          </ThemedText>
           <ThemedText type="default" style={[styles.streakBadgeText, { color: colors.primary }]}>
            {t('common:progress.currentStreakDays', { count: streak })}
          </ThemedText>
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
          return (
            <TouchableOpacity
              key={week.start}
              onPress={() => setSelectedWeekStart(week.start)}
              style={[
                styles.pastWeekCell,
                { backgroundColor: colors.secondaryBackground },
                isSelected && styles.pastWeekCellCurrent,
                isSelected && { borderColor: colors.primary },
              ]}
            >
              <ThemedText type="caption" style={[styles.pastWeekLabel, { color: colors.textMuted }]}>
                {week.label}
              </ThemedText>
              <ThemedText type="title3" style={[styles.pastWeekCount, { color: count >= 7 ? colors.primary : colors.textMuted }]}>
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
            const isSelected = (selectedWeekStart ?? pastWeeks[3].start) === week.start;
            return (
              <TouchableOpacity
                key={`${tip.tipId}-${week.start}`}
                onPress={() => setSelectedWeekStart(week.start)}
                style={[
                  styles.weekStatusCell,
                  { backgroundColor: colors.secondaryBackground },
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
                      backgroundColor: fulfilled ? colors.accentWeak : colors.cardBackground,
                    },
                  ]}
                >
                  <ThemedText
                    style={[styles.weekStatusIcon, { color: fulfilled ? colors.primary : colors.textMuted }]}
                  >
                    {fulfilled ? '✓' : '✗'}
                  </ThemedText>
                </View>
                  <ThemedText type="explainer" style={[styles.weekStatusProgress, { color: colors.textMuted }]}> 
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
    <Container background="gradient" showBackButton onBackPress={() => router.back()}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title3" style={styles.heading}>
          {t('progress.title')}
        </ThemedText>
        <View style={styles.dateRangeRow}>
          <TouchableOpacity onPress={goBackWeeks} style={styles.navArrow}>
            <ThemedText type="caption" style={{ color: colors.primary }}>{'\u2039'}</ThemedText>
          </TouchableOpacity>
          <ThemedText type="caption" style={[styles.dateRange, { color: colors.textMuted }]}>
            {`${pastWeeks[0].label.split('\u2013')[0].trim()} \u2013 ${pastWeeks[3].label.split('\u2013')[1]?.trim() ?? pastWeeks[3].end}`}
          </ThemedText>
          <TouchableOpacity onPress={goForwardWeeks} style={styles.navArrow} disabled={weekOffset === 0}>
            <ThemedText type="caption" style={{ color: weekOffset === 0 ? colors.border : colors.primary }}>{'\u203a'}</ThemedText>
          </TouchableOpacity>
        </View>

        {dailyTips.length > 0 && (
          <>
            <ThemedText type="title3" style={[styles.periodHeading, { color: colors.textMuted }]}>
              {t('nutritionLogger.periodDaily')}
            </ThemedText>
            <Card style={styles.card}>
              {dailyTips.map(renderDailyTip)}
            </Card>
          </>
        )}

        {weeklyTips.length > 0 && (
          <>
            <ThemedText type="title3" style={[styles.periodHeading, { color: colors.textMuted }]}>
              {t('nutritionLogger.periodWeekly')}
            </ThemedText>
            <Card style={styles.card}>
              {weeklyTips.map(renderWeeklyTip)}
            </Card>
          </>
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
    marginBottom: 2,
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
  dayCell: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellToday: {
    borderWidth: 1.5,
  },
  dayCellIcon: {
    fontSize: 16,
    fontWeight: '700',
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
  streakBadgeText: {
  },
  pastWeeksRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  pastWeekCell: {
    flex: 1,
    borderRadius: 8,
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
