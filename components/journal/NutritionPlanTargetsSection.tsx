import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { TipProgressItem, TipTargetPeriod } from '@/app/context/storage/nutrition/nutritionTypes';
import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';
import { globalStyles } from '@/app/theme/globalStyles';
import TipTarget from '@/components/TipTarget';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PremiumLink from '@/components/ui/PremiumLink';
import type { Tip } from '@/locales/tips';
import { formatMonthDay, toDateKey } from '@/utils/dateUtils';
import { getTipProgressKey } from '@/utils/nutritionTipProgress';
import { getMissingNutritionSettings } from '@/utils/resolveNutritionTip';

import { ThemedText } from '../ThemedText';
import AppButton from '../ui/AppButton';
import { Card } from '../ui/Card';
import DiscreetButton from '../ui/DiscreetButton';
import JournalGoalAnchor from './JournalGoalAnchor';
import ProgressButton from './ProgressButton';

// ── Types ──────────────────────────────────────────────────────────────────────

type CurrentRef<T> = { current: T };
type ThemeColors = ReturnType<typeof useTheme>['colors'];

// ── Props ──────────────────────────────────────────────────────────────────────

export type NutritionPlanTargetsSectionProps = {
  untrackedTips?: Tip[];
  userProfile?: UserProfile;
  onDiscoverPremium?: () => void;
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
    ? t('journal:progress.notActiveStarts', {
        date: formatMonthDay(new Date(tip.startedAt!), language),
      })
    : null;

  return (
    <JournalGoalAnchor
      tipId={tip.tipId}
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
                {tip.title}
              </ThemedText>
            </TouchableOpacity>
            {tip.isFulfilled && <Icon source="check-circle" size={34} color={colors.xp} />}
          </View>

          <ThemedText type="caption" style={styles.planTipStatusText}>
            {t('journal:nutritionLogger.fulfilledTargetsCount', {
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
              <TipTarget key={`${tip.tipId}-${target.tag}-${target.unit}-${target.period}`} tip={tip} target={target} colors={colors} />
            ))
          )}
        </View>
      </Animated.View>
    </JournalGoalAnchor>
  );
};

// ── Component ──────────────────────────────────────────────────────────────────

const NutritionPlanTargetsSection: React.FC<NutritionPlanTargetsSectionProps> = ({
  untrackedTips = [],
  userProfile,
  onDiscoverPremium,
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

  const untrackedIds = new Set(untrackedTips.map(tip => tip.id));
  const dailyTips = nutritionPlanTipProgressByPeriod.daily.filter(tip => !untrackedIds.has(tip.tipId));
  const weeklyTips = nutritionPlanTipProgressByPeriod.weekly.filter(tip => !untrackedIds.has(tip.tipId));
  const hasPremiumBlockedTips = untrackedTips.some(tip => {
    const missing = getMissingNutritionSettings(tip, userProfile?.weightKg, userProfile?.nutritionGoals?.protein);
    return !missing.weight && !missing.proteinGoal && tip.trackingTargets?.some(target => target.aiInstruction?.trim());
  });

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
        {dailyTips.length === 0 && weeklyTips.length === 0 && untrackedTips.length === 0 ? (
          <View style={styles.emptyTargetsContainer}>
            <ThemedText type="title3" style={styles.emptyTargetsHeading}>
              {t('journal:nutritionLogger.targetsTitle')}
            </ThemedText>
            <ThemedText type="caption" style={[styles.emptyTargetsText, { color: colors.textLight }]}>
              {t('journal:nutritionLogger.targetsEmptyDescription')}
            </ThemedText>
            <AppButton
              title={t('journal:nutritionLogger.addFirstTarget')}
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/search',
                  params: {
                    targetPeriods: 'daily,weekly',
                    planCategories: 'nutrition',
                    goalIntro: 'nutrition',
                    inPlan: 'no',
                    filterRequestId: String(Date.now()),
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
                {t('journal:nutritionLogger.periodDaily')}
              </ThemedText>
              {dailyTips.length > 0 ? (
                renderTipProgressList(dailyTips)
              ) : (
                <ThemedText type="explainer" style={styles.noFulfilledTipsText}>
                  {t('journal:nutritionLogger.noPlanTipsWithTargets')}
                </ThemedText>
              )}
              <View style={styles.addTargetButton}>
                <DiscreetButton
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/search',
                      params: {
                        targetPeriods: 'daily',
                        planCategories: 'nutrition',
                        goalIntro: 'nutrition',
                        inPlan: 'no',
                        filterRequestId: String(Date.now()),
                      },
                    });
                  }}
                  title={t('journal:nutritionLogger.addDailyTarget')}
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
                {t('journal:nutritionLogger.periodWeekly')}
              </ThemedText>
              {weeklyTips.length > 0 ? (
                renderTipProgressList(weeklyTips)
              ) : (
                <ThemedText type="explainer" style={styles.noFulfilledTipsText}>
                  {t('journal:nutritionLogger.noPlanTipsWithTargets')}
                </ThemedText>
              )}
              <View style={styles.addTargetButton}>
                <DiscreetButton
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/search',
                      params: {
                        targetPeriods: 'weekly',
                        planCategories: 'nutrition',
                        goalIntro: 'nutrition',
                        inPlan: 'no',
                        filterRequestId: String(Date.now()),
                      },
                    });
                  }}
                  title={t('journal:nutritionLogger.addWeeklyTarget')}
                />
              </View>
            </View>
            {untrackedTips.length > 0 && (
              <View style={[styles.untrackedSection, { borderTopColor: colors.borderLight }]}>
                <ThemedText type="title3">{t('journal:nutritionLogger.untrackedTargets', { count: untrackedTips.length })}</ThemedText>
                <View style={[styles.untrackedGroup, { borderColor: colors.warning }]}>
                  {untrackedTips.map((tip, index) => {
                    const missing = getMissingNutritionSettings(tip, userProfile?.weightKg, userProfile?.nutritionGoals?.protein);
                    const needsProfile = missing.weight || missing.proteinGoal;
                    const progress = [...nutritionPlanTipProgressByPeriod.daily, ...nutritionPlanTipProgressByPeriod.weekly].find(
                      item => item.tipId === tip.id
                    );
                    const targets = progress?.targets ?? [];
                    return (
                      <JournalGoalAnchor
                        key={tip.id}
                        tipId={tip.id}
                        style={[
                          styles.untrackedTip,
                          index < untrackedTips.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.textMuted },
                        ]}
                      >
                        <TouchableOpacity
                          accessibilityRole="link"
                          onPress={() =>
                            router.push({
                              pathname: `/dashboard/area/${tip.areas[0].id}/details` as any,
                              params: { tipId: tip.id },
                            })
                          }
                          style={styles.untrackedTipTitle}
                        >
                          <ThemedText type="defaultSemiBold" style={styles.untrackedTitleText}>
                            {t(`tips:${tip.title}`)}
                          </ThemedText>
                          <IconSymbol name={needsProfile ? 'person' : 'crown'} size={20} color={needsProfile ? colors.primary : colors.gold} />
                        </TouchableOpacity>
                        {!needsProfile && targets.map(target => <TipTarget key={target.tag} tip={progress!} target={target} colors={colors} />)}
                        {needsProfile && (
                          <View style={styles.profileLinks}>
                            {missing.weight && (
                              <View style={styles.profileRow}>
                                <ThemedText type="explainer" style={globalStyles.flex1}>
                                  {t('common:nutritionTargetSection.weightRequired')}
                                </ThemedText>
                                <DiscreetButton
                                  title={t('common:nutritionTargetSection.enterWeight')}
                                  onPress={() => router.push('/(stack)/settings/person')}
                                  icon="person"
                                  rightIcon="chevron.right"
                                  accessibilityRole="link"
                                />
                              </View>
                            )}
                            {missing.proteinGoal && (
                              <View style={styles.profileRow}>
                                <ThemedText type="explainer" style={globalStyles.flex1}>
                                  {t('common:nutritionTargetSection.proteinGoalRequired')}
                                </ThemedText>
                                <DiscreetButton
                                  title={t('common:nutritionTargetSection.setProteinGoal')}
                                  onPress={() => router.push('/settings/nutrition')}
                                  icon="person"
                                  rightIcon="chevron.right"
                                  accessibilityRole="link"
                                />
                              </View>
                            )}
                          </View>
                        )}
                      </JournalGoalAnchor>
                    );
                  })}
                  {hasPremiumBlockedTips && (
                    <View style={[styles.premiumRow, { borderTopColor: colors.borderLight }]}>
                      <ThemedText type="explainer" style={styles.premiumText}>
                        {t('journal:nutritionLogger.untrackedTargetsExplainer')}
                      </ThemedText>
                      {onDiscoverPremium && <PremiumLink onPress={onDiscoverPremium} />}
                    </View>
                  )}
                </View>
              </View>
            )}
            <ProgressButton href="/(stack)/journal/nutrition/progress" label={t('journal:nutritionLogger.seeProgress')} />
          </>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  untrackedGroup: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  untrackedTip: { paddingVertical: 8 },
  profileLinks: { marginTop: 8, gap: 12 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  premiumRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingBottom: 12,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumText: { flex: 1 },
  untrackedTipTitle: { paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  untrackedTitleText: { flex: 1 },
  untrackedSection: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 16, paddingTop: 16, marginBottom: 16, gap: 10 },
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
});

export default NutritionPlanTargetsSection;
