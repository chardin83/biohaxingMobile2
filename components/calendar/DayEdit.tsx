import { useTheme } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { useHabitTracking } from '@/hooks/useHabitTracking';
import { tips } from '@/locales/tips';

import { ThemedText } from '../ThemedText';
import NutritionLoggerTab from './NutritionLoggerTab';
import OtherLoggerTab from './OtherLoggerTab';
import { SupplementsLoggerTab } from './SupplementsLoggerTab';
import { TrainingLoggerTab } from './TrainingLoggerTab';

export type DayEditTab = 'supplements' | 'meal' | 'training' | 'other';

interface DayeEditProps {
  selectedDate: string;
  onTipCompleted?: (
    targetY?: number
  ) => void;
  initialTab?:
    | 'supplements'
    | 'meal'
    | 'other';
  activeTab?: DayEditTab;
  onActiveTabChange?: (
    tab: DayEditTab
  ) => void;
  preselectedSupplementId?: string;
}

const toLocalDateKey = (
  value: Date
): string => {
  const year =
    value.getFullYear();

  const month =
    String(
      value.getMonth() + 1
    ).padStart(2, '0');

  const day =
    String(
      value.getDate()
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const DayEdit: React.FC<
  DayeEditProps
> = ({
  selectedDate,
  onTipCompleted,
  initialTab,
  activeTab:
    controlledActiveTab,
  onActiveTabChange,
  preselectedSupplementId,
}) => {
  const [
    uncontrolledActiveTab,
    setUncontrolledActiveTab,
  ] = useState<DayEditTab>(
    initialTab ?? 'meal'
  );

  const activeTab =
    controlledActiveTab ??
    uncontrolledActiveTab;

  const {
    takenDates,
    dailyNutritionSummaries,
    trainingEntries,
    plans,
    metricEntries,
  } = useStorage();

  const {
    getTrackedDates,
  } = useHabitTracking();

  const { t } =
    useTranslation();

  const { colors } =
    useTheme();

  const mealLoggerOffsetYRef =
    useRef(0);

  const hasSupplementsToday =
    takenDates[selectedDate]
      ?.length > 0;

  const hasMealsToday =
    dailyNutritionSummaries[
      selectedDate
    ]?.meals?.length > 0;

  const hasTrainingToday =
    (
      trainingEntries[
        selectedDate
      ]?.length ?? 0
    ) > 0;

  const otherTrackingKeys =
    useMemo(
      () =>
        new Set<string>(
          plans.other.flatMap(
            plan => {
              const tip =
                tips.find(
                  candidate =>
                    candidate.id ===
                    plan.tipId
                );

              return (
                tip
                  ?.habitTargets
                  ?.map(
                    target =>
                      target.trackingKey
                  )
                  .filter(
                    Boolean
                  ) ?? []
              );
            }
          )
        ),
      [
        plans.other,
      ]
    );

  const manuallyTrackedOtherDates =
    useMemo(
      () =>
        getTrackedDates(
          otherTrackingKeys
        ),
      [
        getTrackedDates,
        otherTrackingKeys,
      ]
    );

  const hasManuallyTrackedOtherToday =
    manuallyTrackedOtherDates.includes(
      selectedDate
    );

  const hasMetricTrackedOtherToday =
    useMemo(
      () =>
        metricEntries.some(
          entry => {
            if (
              !otherTrackingKeys.has(
                entry.metricId
              )
            ) {
              return false;
            }

            const entryDate =
              toLocalDateKey(
                new Date(
                  entry.recordedAt
                )
              );

            return (
              entryDate ===
              selectedDate
            );
          }
        ),
      [
        metricEntries,
        otherTrackingKeys,
        selectedDate,
      ]
    );

  const hasOtherToday =
    hasManuallyTrackedOtherToday ||
    hasMetricTrackedOtherToday;

  const selectTab = (
    tab: DayEditTab
  ) => {
    setUncontrolledActiveTab(
      tab
    );

    onActiveTabChange?.(
      tab
    );
  };

  const handleNutritionTipCompleted =
    useCallback(
      (
        nutritionLoggerY?: number
      ) => {
        if (
          typeof nutritionLoggerY ===
          'number'
        ) {
          onTipCompleted?.(
            mealLoggerOffsetYRef
              .current +
              nutritionLoggerY
          );

          return;
        }

        onTipCompleted?.();
      },
      [
        onTipCompleted,
      ]
    );

  React.useEffect(() => {
    if (
      initialTab &&
      !controlledActiveTab
    ) {
      setUncontrolledActiveTab(
        initialTab
      );
    }
  }, [
    controlledActiveTab,
    initialTab,
  ]);

  return (
    <KeyboardAvoidingView
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <View
        style={
          styles.container
        }
      >
        <View
          style={
            styles.tabContainer
          }
        >
          <TouchableOpacity
            style={[
              styles.tabWrapper,
              activeTab ===
                'meal' && {
                borderBottomColor:
                  colors.primary,
              },
            ]}
            onPress={() =>
              selectTab(
                'meal'
              )
            }
          >
            <View
              style={
                styles.tabContent
              }
            >
              <ThemedText
                type="title3"
                uppercase
                style={{
                  color:
                    activeTab ===
                    'meal'
                      ? colors.text
                      : colors.textTertiary,
                }}
              >
                {t(
                  'dayEdit.tabMeal'
                )}
              </ThemedText>

              {hasMealsToday && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        colors.checkmarkMeal,
                    },
                  ]}
                />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabWrapper,
              activeTab ===
                'other' && {
                borderBottomColor:
                  colors.primary,
              },
            ]}
            onPress={() =>
              selectTab(
                'other'
              )
            }
          >
            <View
              style={
                styles.tabContent
              }
            >
              <ThemedText
                type="title3"
                uppercase
                style={{
                  color:
                    activeTab ===
                    'other'
                      ? colors.text
                      : colors.textTertiary,
                }}
              >
                {t(
                  'dayEdit.tabOther'
                )}
              </ThemedText>

              {hasOtherToday && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        colors.checkmarkOther,
                    },
                  ]}
                />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabWrapper,
              activeTab ===
                'supplements' && {
                borderBottomColor:
                  colors.primary,
              },
            ]}
            onPress={() =>
              selectTab(
                'supplements'
              )
            }
          >
            <View
              style={
                styles.tabContent
              }
            >
              <ThemedText
                type="title3"
                uppercase
                style={{
                  color:
                    activeTab ===
                    'supplements'
                      ? colors.text
                      : colors.textTertiary,
                }}
              >
                {t(
                  'dayEdit.tabSupplements'
                )}
              </ThemedText>

              {hasSupplementsToday && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        colors.checkmarkSupplement,
                    },
                  ]}
                />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabWrapper,
              activeTab ===
                'training' && {
                borderBottomColor:
                  colors.primary,
              },
            ]}
            onPress={() =>
              selectTab(
                'training'
              )
            }
          >
            <View
              style={
                styles.tabContent
              }
            >
              <ThemedText
                type="title3"
                uppercase
                style={{
                  color:
                    activeTab ===
                    'training'
                      ? colors.text
                      : colors.textTertiary,
                }}
              >
                {t(
                  'dayEdit.tabTraining'
                )}
              </ThemedText>

              {hasTrainingToday && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        colors.checkmarkTraining,
                    },
                  ]}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {activeTab ===
          'supplements' && (
          <SupplementsLoggerTab
            selectedDate={
              selectedDate
            }
            preselectedSupplementId={
              preselectedSupplementId
            }
          />
        )}

        {activeTab ===
          'meal' && (
          <View
            onLayout={event => {
              mealLoggerOffsetYRef.current =
                event.nativeEvent.layout.y;
            }}
          >
            <NutritionLoggerTab
              selectedDate={
                selectedDate
              }
              onTipCompleted={
                handleNutritionTipCompleted
              }
            />
          </View>
        )}

        {activeTab ===
          'training' && (
          <TrainingLoggerTab
            selectedDate={
              selectedDate
            }
          />
        )}

        {activeTab ===
          'other' && (
          <OtherLoggerTab
            selectedDate={
              selectedDate
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 2,
    },

    label: {
      marginBottom: 10,
    },

    tabContainer: {
      flexDirection: 'row',
      justifyContent:
        'space-around',
      marginBottom: 20,
    },

    tabWrapper: {
      flex: 1,
      alignItems:
        'center',
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor:
        'transparent',
    },

    tabContent: {
      position:
        'relative',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    badge: {
      position:
        'absolute',
      top: -4,
      right: -12,
      width: 10,
      height: 10,
      borderRadius: 5,
    },

    cancelButton: {
      marginTop: 20,
    },
  });

export default DayEdit;