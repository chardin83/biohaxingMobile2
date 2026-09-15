import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { Card } from '@/components/ui/Card';
import DiscreetButton from '@/components/ui/DiscreetButton';
import { useTargetProgressList } from '@/hooks/useTargetProgressList';
import { tips } from '@/locales/tips';
import type { TargetPeriod, TrainingTargetDefinition } from '@/services/targetProgress/targetProgressTypes';

import ProgressButton from './ProgressButton';

type TrainingPlanTargetsSectionProps = {
  selectedDate: string;
};

type TrainingTargetProgressItem = TrainingTargetDefinition & {
  tipId: string;
  title: string;
};

type TrainingTipProgress = {
  tipId: string;
  title: string;
  period: TargetPeriod;
  progress: number;
  isFulfilled: boolean;
  metCount: number;
  totalCount: number;
  targets: Array<
    TrainingTargetProgressItem & {
      progress: {
        current: number;
        target: number;
        unit: string;
        isFulfilled: boolean;
      };
    }
  >;
};

export const TrainingPlanTargetsSection: React.FC<TrainingPlanTargetsSectionProps> = ({ selectedDate }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { plans } = useStorage();

  const targetDefinitions = useMemo<TrainingTargetProgressItem[]>(() => {
    return (plans.training ?? []).flatMap(plan => {
      const tip = tips.find(candidate => candidate.id === plan.tipId);

      if (!tip?.targetPeriod || !tip.activityTargets?.length) {
        return [];
      }

      return tip.activityTargets.map(target => ({
        source: 'training' as const,
        tipId: tip.id,
        title: t(`tips:${tip.id}.title`),
        trackingKey: target.trackingKey,
        amount: target.amount,
        unit: target.unit,
        activityTypes: target.activityTypes,
        period: tip.targetPeriod,
      }));
    });
  }, [plans.training, t]);

  const calculatedTargets = useTargetProgressList(targetDefinitions, selectedDate);

  const tipProgress = useMemo<TrainingTipProgress[]>(() => {
    const byTip = new Map<string, TrainingTipProgress>();

    calculatedTargets.forEach(target => {
      const existing = byTip.get(target.tipId);

      if (!existing) {
        byTip.set(target.tipId, {
          tipId: target.tipId,
          title: target.title,
          period: target.period,
          progress: 0,
          isFulfilled: false,
          metCount: 0,
          totalCount: 0,
          targets: [target],
        });

        return;
      }

      existing.targets.push(target);
    });

    return Array.from(byTip.values()).map(item => {
      const totalCount = item.targets.length;
      const metCount = item.targets.filter(target => target.progress.isFulfilled).length;

      const progress =
        totalCount > 0
          ? item.targets.reduce((sum, target) => {
              const targetAmount = target.progress.target;

              if (targetAmount <= 0) {
                return sum;
              }

              return sum + Math.min(target.progress.current / targetAmount, 1);
            }, 0) / totalCount
          : 0;

      return {
        ...item,
        metCount,
        totalCount,
        progress,
        isFulfilled: totalCount > 0 && metCount === totalCount,
      };
    });
  }, [calculatedTargets]);

  const progressByPeriod = useMemo(() => {
    const sortTips = (period: TargetPeriod) => {
      return tipProgress
        .filter(item => item.period === period)
        .sort((left, right) => {
          if (left.isFulfilled !== right.isFulfilled) {
            return left.isFulfilled ? -1 : 1;
          }

          if (left.progress !== right.progress) {
            return right.progress - left.progress;
          }

          return left.title.localeCompare(right.title);
        });
    };

    return {
      daily: sortTips('daily'),
      weekly: sortTips('weekly'),
    };
  }, [tipProgress]);

  const renderTarget = (target: TrainingTipProgress['targets'][number]) => {
    const actual = target.progress.current;

    const targetValue = target.progress.target;

    return (
      <View key={`${target.tipId}-${target.trackingKey}`} style={styles.targetRow}>
        <View style={styles.targetHeader}>
          <ThemedText type="caption">
            {t(`training:targets.${target.trackingKey}`, {
              defaultValue: target.trackingKey,
            })}
          </ThemedText>

          <ThemedText
            type="caption"
            style={{
              color: target.progress.isFulfilled ? colors.accentColor : colors.textMuted,
            }}
          >
            {`${actual} / ${targetValue} ${target.unit}`}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderTip = (tip: TrainingTipProgress) => {
    return (
      <View
        key={`${tip.tipId}-${tip.period}`}
        style={[
          styles.tipRow,
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
        <View style={styles.tipHeader}>
          <ThemedText type="defaultSemiBold" style={styles.tipTitle}>
            {tip.title}
          </ThemedText>

          {tip.isFulfilled && <Icon source="check-circle" size={34} color={colors.xp} />}
        </View>

        <ThemedText type="caption" style={styles.tipStatus}>
          {t('nutritionLogger.fulfilledTargetsCount', {
            met: tip.metCount,
            total: tip.totalCount,
          })}
        </ThemedText>

        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: tip.isFulfilled ? colors.accentWeak : colors.secondaryBackground,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(Math.min(tip.progress, 1) * 100)}%`,
                backgroundColor: tip.isFulfilled ? colors.accentMedium : colors.icon,
              },
            ]}
          />
        </View>

        {tip.targets.map(renderTarget)}
      </View>
    );
  };

  const renderPeriod = (period: TargetPeriod, title: string) => {
    const items = progressByPeriod[period];

    const fulfilled = items.filter(item => item.isFulfilled);

    const inProgress = items.filter(item => !item.isFulfilled);

    return (
      <View style={styles.periodSection}>
        <ThemedText type="title3" style={styles.periodSectionHeading}>
          {title}
        </ThemedText>

        {items.length > 0 ? (
          <View>
            {fulfilled.map(renderTip)}
            {inProgress.map(renderTip)}
          </View>
        ) : (
          <ThemedText
            type="explainer"
            style={{
              color: colors.textMuted,
            }}
          >
            {t('nutritionLogger.noPlanTipsWithTargets')}
          </ThemedText>
        )}

        <View style={styles.addTargetButton}>
          <DiscreetButton
            onPress={() => {
              router.push({
                pathname: '/(tabs)/search',
                params: {
                  targetPeriods: period,
                  planCategories: 'training',
                },
              });
            }}
            title={t(period === 'daily' ? 'nutritionLogger.addDailyTarget' : 'nutritionLogger.addWeeklyTarget')}
          />
        </View>
      </View>
    );
  };

  const hasTargets = progressByPeriod.daily.length > 0 || progressByPeriod.weekly.length > 0;

  return (
    <Card
      style={{
        borderRadius: globalStyles.borders.borderRadius,
      }}
    >
      {!hasTargets ? (
        <View style={styles.emptyTargetsContainer}>
          <ThemedText type="title3" style={styles.emptyTargetsHeading}>
            {t('plan.trainingTargetsSectionTitle')}
          </ThemedText>

          <ThemedText
            type="caption"
            style={[
              styles.emptyTargetsText,
              {
                color: colors.textLight,
              },
            ]}
          >
            {t('plan.trainingTargetsEmptyDescription')}
          </ThemedText>

          <AppButton
            title={t('nutritionLogger.addFirstTarget')}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/search',
                params: {
                  targetPeriods: 'daily,weekly',
                  planCategories: 'training',
                },
              });
            }}
            glow
            style={styles.addFirstTargetButton}
          />
        </View>
      ) : (
        <>
          <ThemedText type="title3" style={styles.sectionTitle}>
            {t('plan.trainingTargetsSectionTitle')}
          </ThemedText>

          {renderPeriod('daily', t('nutritionLogger.periodDaily'))}

          {renderPeriod('weekly', t('nutritionLogger.periodWeekly'))}

          <ProgressButton href="/(stack)/calendar/training/progress" label={t('nutritionLogger.seeProgress')} />
        </>
      )}
    </Card>
  );
};

export default TrainingPlanTargetsSection;

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 6,
  },
  periodSection: {
    marginTop: 6,
  },
  periodSectionHeading: {
    marginBottom: 8,
    opacity: 0.9,
    textTransform: 'capitalize',
  },
  tipRow: {
    width: '100%',
    alignSelf: 'stretch',
    paddingTop: 8,
    paddingHorizontal: 10,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipTitle: {
    flex: 1,
  },
  tipStatus: {
    marginTop: 4,
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  targetRow: {
    paddingVertical: 4,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  addTargetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
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
});
