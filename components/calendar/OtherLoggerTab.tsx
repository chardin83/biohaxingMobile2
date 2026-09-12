import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { useHabitTracking } from '@/hooks/useHabitTracking';
import { useTargetProgressList } from '@/hooks/useTargetProgressList';
import { tips } from '@/locales/tips';
import { TargetDefinition } from '@/services/targetProgress/targetProgressTypes';

import { ThemedText } from '../ThemedText';
import AppButton from '../ui/AppButton';
import { Card } from '../ui/Card';
import DiscreetButton from '../ui/DiscreetButton';
import { IconSymbol } from '../ui/IconSymbol';

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
};

type OtherTargetDefinition =
  TargetDefinition & {
    tipId: string;
    title: string;
    description: string;
    buttonLabels: string[];
  };

export default function OtherLoggerTab({
  selectedDate,
}: Readonly<{
  selectedDate: string;
}>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { plans } = useStorage();

  const {
    logHabit,
    isHabitSlotCompleted,
  } = useHabitTracking();

  const [expandedTipIds, setExpandedTipIds] =
    useState<Set<string>>(
      () => new Set()
    );

  const targetDefinitions =
    useMemo<
      OtherTargetDefinition[]
    >(() => {
      return plans.other.flatMap(
        plan => {
          const tip =
            tips.find(
              candidate =>
                candidate.id ===
                plan.tipId
            );

          if (!tip) {
            return [];
          }

          const period:
            | 'daily'
            | 'weekly' =
            tip.targetPeriod ===
            'weekly'
              ? 'weekly'
              : 'daily';

          return (
            tip.habitTargets ??
            []
          ).map(
            target => ({
              tipId:
                tip.id,

              trackingKey:
                target.trackingKey,

              amount:
                target.amount,

              unit:
                target.unit,

              period,

              title: t(
                `tips:${tip.title}`,
                {
                  defaultValue:
                    tip.id,
                }
              ),

              description: t(
                `tips:${tip.id}.habitTargets.description`,
                {
                  defaultValue:
                    '',
                }
              ),

              buttonLabels:
                target.buttonLabels ??
                [],
            })
          );
        }
      );
    }, [
      plans.other,
      t,
    ]);

  const targetProgressList =
    useTargetProgressList(
      targetDefinitions,
      selectedDate
    );

  const progressItems =
    useMemo<
      OtherTipProgress[]
    >(() => {
      return targetProgressList.map(
        item => ({
          tipId:
            item.tipId,

          trackingKey:
            item.trackingKey,

          period:
            item.period,

          title:
            item.title,

          description:
            item.description,

          unit:
            item.unit,

          actual:
            item.progress.current,

          target:
            item.progress.target,

          isFulfilled:
            item.progress.isFulfilled,

          canMarkManually:
            item.trackingKey !==
            'sleep_duration',

          buttonLabels:
            item.buttonLabels,
        })
      );
    }, [
      targetProgressList,
    ]);

  const progressItemsByPeriod =
    useMemo(
      () => ({
        daily:
          progressItems.filter(
            item =>
              item.period ===
              'daily'
          ),

        weekly:
          progressItems.filter(
            item =>
              item.period ===
              'weekly'
          ),
      }),
      [
        progressItems,
      ]
    );

  const toggleExpanded = (
    tipId: string
  ) => {
    setExpandedTipIds(
      current => {
        const next =
          new Set(
            current
          );

        if (
          next.has(
            tipId
          )
        ) {
          next.delete(
            tipId
          );
        } else {
          next.add(
            tipId
          );
        }

        return next;
      }
    );
  };

  const getSlotId = (
    item: OtherTipProgress,
    index: number
  ): string => {
    return (
      item.buttonLabels[
        index
      ] ??
      `slot-${index + 1}`
    );
  };

  const handleSlotToggle =
    (
      item:
        OtherTipProgress,
      index: number
    ) => {
      const slot =
        getSlotId(
          item,
          index
        );

      const isCompleted =
        isHabitSlotCompleted({
          trackingKey:
            item.trackingKey,
          selectedDate,
          slot,
        });

      logHabit({
        trackingKey:
          item.trackingKey,
        selectedDate,
        slot,
        value:
          isCompleted
            ? 0
            : 1,
      });
    };

  const handleWholeTargetToggle =
    (
      item:
        OtherTipProgress
    ) => {
      logHabit({
        trackingKey:
          item.trackingKey,
        selectedDate,
        value:
          item.isFulfilled
            ? 0
            : item.target,
      });
    };

  const renderManualButtons =
    (
      item:
        OtherTipProgress
    ) => {
      if (
        !item.canMarkManually
      ) {
        return null;
      }

      const isExpanded =
        expandedTipIds.has(
          item.tipId
        );

      if (
        item.isFulfilled &&
        !isExpanded
      ) {
        return null;
      }

      if (
        item.target > 2
      ) {
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              handleWholeTargetToggle(
                item
              )
            }
            style={[
              styles.completeButton,
              {
                borderColor:
                  colors.planSectionOtherIcon,

                backgroundColor:
                  item.isFulfilled
                    ? colors.accentWeak
                    : colors.background,
              },
            ]}
          >
            <ThemedText
              type="caption"
            >
              {item.isFulfilled
                ? t(
                    'otherTips.fulfilled'
                  )
                : t(
                    'otherTips.markDone'
                  )}
            </ThemedText>
          </Pressable>
        );
      }

      return (
        <View
          style={
            styles.actionsRow
          }
        >
          {Array.from(
            {
              length:
                item.target,
            },
            (_, index) => {
              const slot =
                getSlotId(
                  item,
                  index
                );

              const isCompleted =
                isHabitSlotCompleted({
                  trackingKey:
                    item.trackingKey,
                  selectedDate,
                  slot,
                });

              const buttonLabel =
                item.buttonLabels[
                  index
                ] ??
                (
                  item.tipId ===
                  'dental_health_basics'
                    ? [
                        'morning',
                        'night',
                      ][
                        index
                      ]
                    : undefined
                );

              let displayLabel =
                t(
                  'otherTips.markDoneButton',
                  {
                    count:
                      index +
                      1,
                  }
                );

              if (
                buttonLabel
              ) {
                displayLabel =
                  t(
                    `tips:${item.tipId}.habitTargets.buttonLabels.${buttonLabel}`,
                    {
                      defaultValue:
                        buttonLabel,
                    }
                  );
              } else if (
                isCompleted
              ) {
                displayLabel =
                  t(
                    'otherTips.completedButton',
                    {
                      count:
                        index +
                        1,
                    }
                  );
              }

              return (
                <AppButton
                  key={`${item.trackingKey}-${slot}`}
                  icon={
                    isCompleted
                      ? 'checkCircle'
                      : undefined
                  }
                  onPress={() =>
                    handleSlotToggle(
                      item,
                      index
                    )
                  }
                  style={[
                    styles.completeButton,
                    {
                      backgroundColor:
                        isCompleted
                          ? colors.accentWeak
                          : colors.overlayLight,
                    },
                  ]}
                  title={
                    displayLabel
                  }
                />
              );
            }
          )}
        </View>
      );
    };

  const renderProgressItem =
    (
      item:
        OtherTipProgress
    ) => (
      <View
        key={`${item.tipId}-${item.trackingKey}`}
        style={
          styles.tip
        }
      >
        <View
          style={
            styles.header
          }
        >
          <ThemedText
            type="title3"
            style={
              styles.title
            }
          >
            {item.title}
          </ThemedText>

          {item.isFulfilled && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(
                'otherTips.showCompletionButtons'
              )}
              onPress={() =>
                toggleExpanded(
                  item.tipId
                )
              }
            >
              <IconSymbol
                name="checkCircle"
                size={34}
                color={
                  colors.xp
                }
              />
            </Pressable>
          )}
        </View>

        {item.description ? (
          <ThemedText
            type="default"
            style={
              styles.description
            }
          >
            {
              item.description
            }
          </ThemedText>
        ) : null}

        <View
          style={
            styles.statusRow
          }
        >
          <ThemedText
            type="caption"
          >
            {item.isFulfilled
              ? t(
                  'otherTips.fulfilled'
                )
              : t(
                  'otherTips.notFulfilled'
                )}
          </ThemedText>

          <ThemedText
            type="caption"
            style={{
              color:
                colors.textMuted,
            }}
          >
            {`${item.actual} / ${item.target} ${item.unit}`}
          </ThemedText>
        </View>

        {renderManualButtons(
          item
        )}
      </View>
    );

  const renderPeriod = (
    period:
      | 'daily'
      | 'weekly',
    title: string
  ) => {
    const items =
      progressItemsByPeriod[
        period
      ];

    return (
      <View
        style={
          styles.periodSection
        }
      >
        <ThemedText
          type="title3"
          style={
            styles.periodSectionHeading
          }
        >
          {title}
        </ThemedText>

        {items.length >
        0 ? (
          items.map(
            (
              item,
              index
            ) => (
              <React.Fragment
                key={`${item.tipId}-${item.trackingKey}`}
              >
                {renderProgressItem(
                  item
                )}

                {index <
                  items.length -
                    1 && (
                  <View
                    style={[
                      styles.divider,
                      {
                        backgroundColor:
                          colors.textMuted,
                      },
                    ]}
                  />
                )}
              </React.Fragment>
            )
          )
        ) : (
          <ThemedText
            type="explainer"
            style={[
              styles.emptyPeriodText,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            {t(
              'otherTips.noPlanned'
            )}
          </ThemedText>
        )}

        <View
          style={
            styles.addTargetButton
          }
        >
          <DiscreetButton
            onPress={() => {
              router.push({
                pathname:
                  '/(tabs)/search',

                params: {
                  targetPeriods:
                    period,

                  planCategories:
                    'other',
                },
              });
            }}
            title={t(
              period ===
                'daily'
                ? 'nutritionLogger.addDailyTarget'
                : 'nutritionLogger.addWeeklyTarget'
            )}
          />
        </View>
      </View>
    );
  };

  return (
    <View
      style={
        styles.container
      }
    >
      <Card
        style={
          styles.card
        }
      >
        <ThemedText
          type="title2"
        >
          {t(
            'otherTips.title'
          )}
        </ThemedText>

        <ThemedText
          type="caption"
          style={{
            color:
              colors.textMuted,
          }}
        >
          {t(
            'otherTips.subtitle'
          )}
        </ThemedText>

        {renderPeriod(
          'daily',
          t(
            'nutritionLogger.periodDaily'
          )
        )}

        <View
          style={[
            styles.divider,
            {
              backgroundColor:
                colors.textMuted,
            },
          ]}
        />

        {renderPeriod(
          'weekly',
          t(
            'nutritionLogger.periodWeekly'
          )
        )}
      </Card>
    </View>
  );
}

const styles =
  StyleSheet.create({
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
      alignSelf:
        'flex-start',
      marginBottom: 4,
      opacity: 0.9,
      textTransform:
        'capitalize',
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
      alignItems:
        'center',
      justifyContent:
        'center',
      marginTop: 6,
    },

    header: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 10,
    },

    title: {
      flex: 1,
    },

    description: {
      opacity: 0.85,
    },

    statusRow: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      gap: 10,
    },

    actionsRow: {
      flexDirection:
        'row',
      gap: 8,
    },

    completeButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 9,
      alignItems:
        'center',
    },
  });