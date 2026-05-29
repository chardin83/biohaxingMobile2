import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { globalStyles } from '@/app/theme/globalStyles';
import TipTarget from '@/components/TipTarget';
import {
  type NutritionTargetPeriod,
  type NutritionTargetUnit,
} from '@/types/nutritionTargets';
import { formatMonthDay, toDateKey } from '@/utils/dateUtils';

import { type WeeklyTrackingItem } from './nutritionTargets.logic';
import { ThemedText } from './ThemedText';
import AppButton from './ui/AppButton';
import { Card } from './ui/Card';
import DiscreetButton from './ui/DiscreetButton';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TipTargetUnit = NutritionTargetUnit;
export type TipTargetPeriod = NutritionTargetPeriod;

export type TipProgressItem = {
  tipId: string;
  title: string;
  areaId?: string;
  dateKey?: string;
  startedAt?: string;
  period: TipTargetPeriod;
  targets: Array<{
    tag: string;
    unit: TipTargetUnit;
    period: TipTargetPeriod;
    amount: number;
    actual: number;
    foodActual?: number;
    supplementActual?: number;
    isMet: boolean;
    label: string;
    trackedItems?: WeeklyTrackingItem[];
    supplementIds?: string[];
  }>;
  metCount: number;
  totalCount: number;
  isFulfilled: boolean;
  progress: number;
};

type CurrentRef<T> = { current: T };
type ThemeColors = ReturnType<typeof useTheme>['colors'];

export const getTipProgressKey = (tip: TipProgressItem): string =>
  `${tip.tipId}|${tip.period}`;

// ── Props ──────────────────────────────────────────────────────────────────────

export type NutritionPlanTargetsSectionProps = {
  fulfilledTipsSectionYRef: CurrentRef<number>;
  periodSectionYRef: CurrentRef<Record<TipTargetPeriod, number>>;
  nutritionPlanTipProgressByPeriod: {
    daily: TipProgressItem[];
    weekly: TipProgressItem[];
  };
  getCompletionAnimValue: (tipKey: string) => Animated.Value;
  tipRowLocalYByKeyRef: CurrentRef<Record<string, number>>;
  tipRowPeriodByKeyRef: CurrentRef<Record<string, TipTargetPeriod>>;
};

type TipProgressRowProps = {
  tip: TipProgressItem;
  getCompletionAnimValue: (tipKey: string) => Animated.Value;
  tipRowLocalYByKeyRef: CurrentRef<Record<string, number>>;
  tipRowPeriodByKeyRef: CurrentRef<Record<string, TipTargetPeriod>>;
  colors: ThemeColors;
  t: ReturnType<typeof useTranslation>['t'];
  language: string;
  router: ReturnType<typeof useRouter>;
};

const TipProgressRow: React.FC<TipProgressRowProps> = ({
  tip,
  getCompletionAnimValue,
  tipRowLocalYByKeyRef,
  tipRowPeriodByKeyRef,
  colors,
  t,
  language,
  router,
}) => {
  const tipKey = getTipProgressKey(tip);
  const completionAnim = getCompletionAnimValue(tipKey);
  const dateKey = tip.dateKey ?? toDateKey(new Date());
  const startDateKey = tip.startedAt ? toDateKey(new Date(tip.startedAt)) : '';
  const isNotActiveYet = Boolean(startDateKey) && dateKey < startDateKey;
  const inactiveText = isNotActiveYet
    ? t('common:progress.notActiveStarts', {
        date: formatMonthDay(new Date(tip.startedAt!), language),
      })
    : null;

  return (
    <View
      onLayout={event => {
        tipRowLocalYByKeyRef.current[tipKey] = event.nativeEvent.layout.y;
        tipRowPeriodByKeyRef.current[tipKey] = tip.period;
      }}
    >
      <Animated.View
        style={[
          {
            transform: [
              {
                scale: completionAnim.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [1, 1.03, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.planTipProgressRow,
            tip.isFulfilled && styles.planTipProgressRowFulfilled,
            tip.isFulfilled
              ? {
                  backgroundColor: colors.accentVeryWeak,
                  borderColor: colors.accentMedium,
                }
              : {
                  borderBottomColor: colors.textMuted,
                },
          ]}
        >
          <View style={styles.planTipProgressHeader}>
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={!tip.areaId}
              onPress={() => {
                if (!tip.areaId) return;
                router.push({
                  pathname: `/dashboard/area/${tip.areaId}/details` as any,
                  params: {
                    tipId: tip.tipId,
                  },
                });
              }}
              style={styles.tipTitleButton}
            >
              <ThemedText type="defaultSemiBold" style={styles.fulfilledTipTextBlock}>
                {t(`tips:${tip.title}`)}
              </ThemedText>
            </TouchableOpacity>
            {tip.isFulfilled && <Icon source="check-circle" size={34} color={colors.xp} />}
          </View>

          <ThemedText type="caption" style={styles.planTipStatusText}>
            {t('nutritionLogger.fulfilledTargetsCount', {
              met: tip.metCount,
              total: tip.totalCount,
            })}
          </ThemedText>

          <View
            style={[
              styles.progressTrack,
              tip.isFulfilled && styles.progressTrackFulfilled,
              {
                backgroundColor: tip.isFulfilled ? colors.accentWeak : colors.secondaryBackground,
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                tip.isFulfilled && styles.progressFillFulfilled,
                {
                  width: `${Math.round(tip.progress * 100)}%`,
                  backgroundColor: tip.isFulfilled ? colors.accentMedium : colors.icon,
                },
              ]}
            />
          </View>

          {isNotActiveYet ? (
            <ThemedText type="explainer" style={[styles.notActiveText, { color: colors.textMuted }]}>
              {inactiveText}
            </ThemedText>
          ) : (
            tip.targets.map(target => (
              <TipTarget
                key={`${tip.tipId}-${target.tag}-${target.unit}-${target.period}`}
                tip={tip}
                target={target}
                colors={colors}
              />
            ))
          )}
        </View>
      </Animated.View>
    </View>
  );
};

// ── Component ──────────────────────────────────────────────────────────────────

const NutritionPlanTargetsSection: React.FC<NutritionPlanTargetsSectionProps> = ({
  fulfilledTipsSectionYRef,
  periodSectionYRef,
  nutritionPlanTipProgressByPeriod,
  getCompletionAnimValue,
  tipRowLocalYByKeyRef,
  tipRowPeriodByKeyRef,
}) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const renderTipProgressItems = (tipsForPeriod: TipProgressItem[]) =>
    tipsForPeriod.map(tip => {
      return (
        <TipProgressRow
          key={getTipProgressKey(tip)}
          tip={tip}
          getCompletionAnimValue={getCompletionAnimValue}
          tipRowLocalYByKeyRef={tipRowLocalYByKeyRef}
          tipRowPeriodByKeyRef={tipRowPeriodByKeyRef}
          colors={colors}
          t={t}
          language={i18n.language}
          router={router}
        />
      );
    });

  const renderTipProgressList = (tipsForPeriod: TipProgressItem[]) => {
    const fulfilledTips = tipsForPeriod.filter(tip => tip.isFulfilled);
    const inProgressTips = tipsForPeriod.filter(tip => !tip.isFulfilled);
    return (
      <>
        {renderTipProgressItems(fulfilledTips)}
        {renderTipProgressItems(inProgressTips)}
      </>
    );
  };

  return (
    <View
      onLayout={event => {
        fulfilledTipsSectionYRef.current = event.nativeEvent.layout.y;
      }}
    >
      <Card style={{ borderRadius: globalStyles.borders.borderRadius }}>
        {nutritionPlanTipProgressByPeriod.daily.length === 0 && nutritionPlanTipProgressByPeriod.weekly.length === 0 ? (
          <View style={styles.emptyTargetsContainer}>
            <ThemedText type="title3" style={styles.emptyTargetsHeading}>
              {t('nutritionLogger.targetsTitle')}
            </ThemedText>
            <ThemedText type="caption" style={[styles.emptyTargetsText, { color: colors.textLight }]}>
              {t('nutritionLogger.targetsEmptyDescription')}
            </ThemedText>
            <AppButton
              title={t('nutritionLogger.addFirstTarget')}
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/search',
                  params: {
                    targetPeriods: 'daily,weekly',
                  },
                });
              }}
              glow
              style={styles.addFirstTargetButton}
            />
          </View>
        ) : (
          <>
            <View
              style={styles.periodSection}
              onLayout={event => {
                periodSectionYRef.current.daily = event.nativeEvent.layout.y;
              }}
            >
              <ThemedText type="title3" style={styles.periodSectionHeading}>
                {t('nutritionLogger.periodDaily')}
              </ThemedText>
              {nutritionPlanTipProgressByPeriod.daily.length > 0 ? (
                renderTipProgressList(nutritionPlanTipProgressByPeriod.daily)
              ) : (
                <ThemedText type="explainer" style={styles.noFulfilledTipsText}>
                  {t('nutritionLogger.noPlanTipsWithTargets')}
                </ThemedText>
              )}
              <View style={styles.addTargetButton}>
                <DiscreetButton
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/search',
                      params: {
                        targetPeriods: 'daily',
                      },
                    });
                  }}
                  title={t('nutritionLogger.addDailyTarget')}
                />
              </View>
            </View>
            <View
              style={styles.periodSection}
              onLayout={event => {
                periodSectionYRef.current.weekly = event.nativeEvent.layout.y;
              }}
            >
              <ThemedText type="title3" style={styles.periodSectionHeading}>
                {t('nutritionLogger.periodWeekly')}
              </ThemedText>
              {nutritionPlanTipProgressByPeriod.weekly.length > 0 ? (
                renderTipProgressList(nutritionPlanTipProgressByPeriod.weekly)
              ) : (
                <ThemedText type="explainer" style={styles.noFulfilledTipsText}>
                  {t('nutritionLogger.noPlanTipsWithTargets')}
                </ThemedText>
              )}
              <View style={styles.addTargetButton}>
                <DiscreetButton
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/search',
                      params: {
                        targetPeriods: 'weekly',
                      },
                    });
                  }}
                  title={t('nutritionLogger.addWeeklyTarget')}
                />
              </View>
            </View>
            <View style={styles.seeProgressButton}>
              <TouchableOpacity
                onPress={() => router.push('/(stack)/calendar/progress' as any)}
                activeOpacity={0.85}
                style={[
                  styles.seeProgressCta,
                  {
                    backgroundColor: colors.secondaryBackground,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('nutritionLogger.seeProgress')}
              >
                <View style={styles.seeProgressCtaContent}>
                  <View
                    style={[
                      styles.seeProgressIconWrap,
                      { backgroundColor: colors.accentVeryWeak },
                    ]}
                  >
                    <Icon source="chart-line" size={20} color={colors.primary} />
                  </View>
                  <ThemedText type="title3" style={styles.seeProgressCtaText}>
                    {t('nutritionLogger.seeProgress')}
                  </ThemedText>
                </View>
                <Icon source="chevron-right" size={22} color={colors.accentColor} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  fulfilledTipTextBlock: {
    flex: 1,
  },
  planTipProgressRow: {
    width: '100%',
    alignSelf: 'stretch',
    paddingTop: 8,
    paddingHorizontal: 10,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  planTipProgressRowFulfilled: {
    borderWidth: 1,
    borderRadius: 12,
  },
  planTipProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipTitleButton: {
    flex: 1,
  },
  periodSection: {
    marginTop: 6,
  },
  periodSectionHeading: {
    marginBottom: 4,
    opacity: 0.9,
    textTransform: 'capitalize',
  },
  tipGroupHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  tipGroupHeadingText: {
    opacity: 0.9,
  },
  planTipStatusText: {
    marginTop: 4,
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 10,
  },
  progressTrackFulfilled: {
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressFillFulfilled: {
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  noFulfilledTipsText: {
    marginTop: 8,
  },
  notActiveText: {
    marginTop: 2,
    marginBottom: 2,
  },
  emptyTargetsContainer: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  emptyTargetsHeading: {
    marginBottom: 8,
  },
  emptyTargetsText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  addFirstTargetButton: {
    marginTop: 12,
  },
  addTargetButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeProgressButton: {
    marginTop: 4,
    marginBottom: 8,
  },
  seeProgressCta: {
    width: '100%',
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeProgressCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  seeProgressIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeProgressCtaText: {
    flexShrink: 1,
  },
});

export default NutritionPlanTargetsSection;
