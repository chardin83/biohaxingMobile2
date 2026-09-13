import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { useHabitTracking } from '@/hooks/useHabitTracking';
import { useTargetProgressList } from '@/hooks/useTargetProgressList';
import { HabitInputMode, tips } from '@/locales/tips';
import { getTargetDates } from '@/services/targetProgress/dateRange';
import { type HabitTargetDefinition } from '@/services/targetProgress/targetProgressTypes';
import { formatDate } from '@/utils/dateUtils';
import { getUnitLabel, getUnitLabelShort } from '@/utils/metrics';

import { ThemedText } from '../ThemedText';
import AppButton from '../ui/AppButton';
import { Card } from '../ui/Card';
import DiscreetButton from '../ui/DiscreetButton';
import { IconSymbol } from '../ui/IconSymbol';
import ProgressButton from './ProgressButton';
import { RegisterHabitValueBottomSheet } from './RegisterHabitValueBottomSheet';

type OtherTipProgress = {
  tipId: string;
  trackingKey: string;
  period: 'daily' | 'weekly';
  title: string;
  description: string;
  unit: string;
  actual: number;
  target: number;
  isFulfilled: boolean;
  canMarkManually: boolean;
  buttonLabels: string[];
  inputMode?: HabitInputMode;
  history: {
    date: string;
    value: number;
  }[];
};

type OtherTargetDefinition = HabitTargetDefinition & {
  tipId: string;
  title: string;
  description: string;
  buttonLabels: string[];
  inputMode?: HabitInputMode;
};

export default function OtherLoggerTab({
  selectedDate,
}: Readonly<{
  selectedDate: string;
}>) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { plans, dailyHabitTracking } = useStorage();
  const { logHabit, isHabitSlotCompleted } = useHabitTracking();
  const [expandedTipIds, setExpandedTipIds] = useState<Set<string>>(() => new Set());
  const registerHabitValueBottomSheetRef = useRef<BottomSheetModal>(null);
  const [valueTarget, setValueTarget] = useState<OtherTipProgress | null>(null);
  const [isValueSheetVisible, setIsValueSheetVisible] = useState(false);

  const getDailyHabitValue = (trackingKey: string): number | undefined => {
    return dailyHabitTracking[selectedDate]?.[trackingKey]?.value;
  };

  const handleOpenValueSheet = (item: OtherTipProgress) => {
    setValueTarget(item);
    setIsValueSheetVisible(true);
  };

  const translateUnit = useCallback(
    (unit: string) => {
      return getUnitLabel(unit, t);
    },
    [t]
  );

  const translateUnitShort = useCallback(
    (unit: string) => {
      return getUnitLabelShort(unit, t);
    },
    [t]
  );

  const handleSaveValue = (value: number) => {
    if (!valueTarget) {
      return;
    }

    logHabit({
      trackingKey: valueTarget.trackingKey,
      selectedDate,
      value,
    });

    setIsValueSheetVisible(false);
    setValueTarget(null);

    registerHabitValueBottomSheetRef.current?.close();
  };

  const handleCloseValueSheet = () => {
    setIsValueSheetVisible(false);

    setValueTarget(null);
  };
  const targetDefinitions = useMemo<OtherTargetDefinition[]>(() => {
    return plans.other.flatMap(plan => {
      const tip = tips.find(candidate => candidate.id === plan.tipId);

      if (!tip) {
        return [];
      }

      const period: 'daily' | 'weekly' = tip.targetPeriod === 'weekly' ? 'weekly' : 'daily';

      return (tip.habitTargets ?? []).map(target => ({
        source: 'habit',
        tipId: tip.id,
        trackingKey: target.trackingKey,
        amount: target.amount,
        unit: target.unit,
        period,
        inputMode: target.inputMode,
        title: t(`tips:${tip.title}`, {
          defaultValue: tip.id,
        }),

        description: t(`tips:${tip.id}.habitTargets.description`, {
          defaultValue: '',
        }),

        buttonLabels: target.buttonLabels ?? [],
      }));
    });
  }, [plans.other, t]);

  const targetProgressList = useTargetProgressList(targetDefinitions, selectedDate);

  const isCompletedToday = (item: OtherTipProgress) =>
    isHabitSlotCompleted({
      trackingKey: item.trackingKey,
      selectedDate,
      slot: 'daily',
    });

  const handleDailyToggle = (item: OtherTipProgress) => {
    const completed = isCompletedToday(item);

    logHabit({
      trackingKey: item.trackingKey,
      selectedDate,
      slot: 'daily',
      value: completed ? 0 : 1,
    });
  };

  const progressItems = useMemo<OtherTipProgress[]>(() => {
    return targetProgressList.map(item => {
      const history =
        item.period === 'weekly'
          ? getTargetDates(selectedDate, 'weekly')
              .map(date => ({
                date,
                value: dailyHabitTracking[date]?.[item.trackingKey]?.value ?? 0,
              }))
              .filter(entry => entry.value > 0)
          : [];
      return {
        tipId: item.tipId,
        trackingKey: item.trackingKey,
        period: item.period,
        title: item.title,
        description: item.description,
        unit: item.unit,
        actual: item.progress.current,
        target: item.progress.target,
        isFulfilled: item.progress.isFulfilled,
        canMarkManually: item.trackingKey !== 'sleep_duration',
        buttonLabels: item.buttonLabels,
        inputMode: item.inputMode,
        history,
      };
    });
  }, [targetProgressList, selectedDate, dailyHabitTracking]);

  const progressItemsByPeriod = useMemo(
    () => ({
      daily: progressItems.filter(item => item.period === 'daily'),
      weekly: progressItems.filter(item => item.period === 'weekly'),
    }),
    [progressItems]
  );

  const toggleExpanded = (tipId: string) => {
    setExpandedTipIds(current => {
      const next = new Set(current);

      if (next.has(tipId)) {
        next.delete(tipId);
      } else {
        next.add(tipId);
      }

      return next;
    });
  };

  const getSlotId = (item: OtherTipProgress, index: number): string => {
    return item.buttonLabels[index] ?? `slot-${index + 1}`;
  };

  const handleSlotToggle = (item: OtherTipProgress, index: number) => {
    const slot = getSlotId(item, index);

    const isCompleted = isHabitSlotCompleted({
      trackingKey: item.trackingKey,
      selectedDate,
      slot,
    });

    logHabit({
      trackingKey: item.trackingKey,
      selectedDate,
      slot,
      value: isCompleted ? 0 : 1,
    });
  };

  const renderManualButtons = (item: OtherTipProgress) => {
    if (!item.canMarkManually) {
      return null;
    }

    const isExpanded = expandedTipIds.has(item.tipId);

    if (item.isFulfilled && !isExpanded) {
      return null;
    }

    if (item.inputMode === 'daily-check') {
      const completedToday = isCompletedToday(item);

      return (
        <AppButton
          icon={completedToday ? 'checkCircle' : undefined}
          onPress={() => handleDailyToggle(item)}
          style={[
            styles.completeButton,
            {
              backgroundColor: completedToday ? colors.accentWeak : colors.overlayLight,
            },
          ]}
          title={completedToday ? t('otherLoggerTab.registeredToday') : t('otherLoggerTab.registerToday')}
        />
      );
    }

    if (item.inputMode === 'slots') {
      return (
        <View style={styles.actionsRow}>
          {item.buttonLabels.map((buttonLabel, index) => {
            const slot = getSlotId(item, index);

            const isCompleted = isHabitSlotCompleted({
              trackingKey: item.trackingKey,
              selectedDate,
              slot,
            });

            const displayLabel = t(`tips:${item.tipId}.habitTargets.buttonLabels.${buttonLabel}`, {
              defaultValue: buttonLabel,
            });

            return (
              <AppButton
                key={`${item.trackingKey}-${slot}`}
                icon={isCompleted ? 'checkCircle' : undefined}
                onPress={() => handleSlotToggle(item, index)}
                style={[
                  styles.completeButton,
                  {
                    backgroundColor: isCompleted ? colors.accentWeak : colors.overlayLight,
                  },
                ]}
                title={displayLabel}
              />
            );
          })}
        </View>
      );
    }

    if (item.inputMode === 'number') {
      const todayValue = getDailyHabitValue(item.trackingKey);
      const hasValueToday = todayValue !== undefined && todayValue > 0;
      return (
        <AppButton
          onPress={() => {
            handleOpenValueSheet(item);
          }}
          style={[
            styles.completeButton,
            {
              backgroundColor: colors.overlayLight,
            },
          ]}
          title={hasValueToday ? `✓ ${todayValue} ${translateUnit(item.unit)} ${t('today')}` : t('otherLoggerTab.registerToday')}
        />
      );
    }

    return null;
  };

  const renderProgressItem = (item: OtherTipProgress) => {
    return (
      <View key={`${item.tipId}-${item.trackingKey}`} style={styles.tip}>
        <View style={styles.header}>
          <ThemedText type="title3" style={styles.title}>
            {item.title}
          </ThemedText>

          {item.isFulfilled && (
            <Pressable accessibilityRole="button" accessibilityLabel={t('otherTips.showCompletionButtons')} onPress={() => toggleExpanded(item.tipId)}>
              <IconSymbol name="checkCircle" size={34} color={colors.xp} />
            </Pressable>
          )}
        </View>

        {item.description ? (
          <ThemedText type="default" style={styles.description}>
            {item.description}
          </ThemedText>
        ) : null}

        <View style={styles.statusRow}>
          <ThemedText type="caption">{item.isFulfilled ? t('otherTips.fulfilled') : t('otherTips.notFulfilled')}</ThemedText>
          <ThemedText type="explainer">{`${item.actual} / ${item.target} ${translateUnit(item.unit)}`}</ThemedText>
        </View>
        {item.period === 'weekly' && item.history.length > 0 && (
          <View style={styles.history}>
            {item.history.map(entry => (
              <View
                key={entry.date}
                style={[
                  styles.historyValue,
                  {
                    backgroundColor: colors.overlayLight,
                  },
                ]}
              >
                {item.inputMode === 'number' ? (
                  <ThemedText type="explainer">{`${formatDate(entry.date, i18n.language)} · ${entry.value} ${translateUnitShort(item.unit)}`}</ThemedText>
                ) : (
                  <ThemedText type="explainer">{formatDate(entry.date, i18n.language)}</ThemedText>
                )}
              </View>
            ))}
          </View>
        )}
        {renderManualButtons(item)}
      </View>
    );
  };

  const renderPeriod = (period: 'daily' | 'weekly', title: string) => {
    const items = progressItemsByPeriod[period];

    return (
      <View style={styles.periodSection}>
        <ThemedText type="title3" style={styles.periodSectionHeading}>
          {title}
        </ThemedText>

        {items.length > 0 ? (
          items.map((item, index) => (
            <React.Fragment key={`${item.tipId}-${item.trackingKey}`}>
              {renderProgressItem(item)}

              {index < items.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: colors.textMuted,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          ))
        ) : (
          <ThemedText
            type="explainer"
            style={[
              styles.emptyPeriodText,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {t('otherTips.noPlanned')}
          </ThemedText>
        )}

        <View style={styles.addTargetButton}>
          <DiscreetButton
            onPress={() => {
              router.push({
                pathname: '/(tabs)/search',

                params: {
                  targetPeriods: period,

                  planCategories: 'other',
                },
              });
            }}
            title={t(period === 'daily' ? 'nutritionLogger.addDailyTarget' : 'nutritionLogger.addWeeklyTarget')}
          />
        </View>
      </View>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <Card style={styles.card}>
          <ThemedText type="title2">{t('otherTips.title')}</ThemedText>

          <ThemedText
            type="caption"
            style={{
              color: colors.textMuted,
            }}
          >
            {t('otherTips.subtitle')}
          </ThemedText>

          {renderPeriod('daily', t('nutritionLogger.periodDaily'))}

          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.textMuted,
              },
            ]}
          />

          {renderPeriod('weekly', t('nutritionLogger.periodWeekly'))}
          <ProgressButton href="/(stack)/calendar/habits/progress" label={t('nutritionLogger.seeProgress')} />
        </Card>
      </View>
      <RegisterHabitValueBottomSheet
        bottomSheetRef={registerHabitValueBottomSheetRef}
        isVisible={isValueSheetVisible}
        title={valueTarget?.title ?? ''}
        unit={valueTarget?.unit ?? ''}
        onSave={handleSaveValue}
        onClose={handleCloseValueSheet}
        initialValue={valueTarget ? getDailyHabitValue(valueTarget.trackingKey) : undefined}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  card: {
    gap: 10,
  },
  periodSection: {
    marginTop: 6,
  },
  periodSectionHeading: {
    alignSelf: 'flex-start',
    marginBottom: 4,
    opacity: 0.9,
    textTransform: 'capitalize',
  },
  tip: {
    gap: 10,
    paddingHorizontal: 10,
  },
  divider: {
    height: 1,
    marginHorizontal: 10,
    marginVertical: 6,
    opacity: 0.45,
  },
  emptyPeriodText: {
    marginHorizontal: 10,
  },
  addTargetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    flex: 1,
  },
  description: {
    opacity: 0.85,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  history: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  historyValue: {
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    alignItems: 'center',
    marginBottom: 10,
  },
});
