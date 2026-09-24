import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { NutritionEntry } from '@/app/context/storage/nutrition/nutritionTypes';
import { globalStyles } from '@/app/theme/globalStyles';
import { formatClockTime } from '@/utils/dateUtils';

import { Collapsible } from '../Collapsible';
import { ThemedText } from '../ThemedText';
import { Card } from '../ui/Card';
import { IconSymbol } from '../ui/IconSymbol';
import { SwipeableRow } from '../ui/SwipeableRow';

type LoggedMealsSectionProps = {
  meals: NutritionEntry[];
  onEdit: (mealId: string, mealName: string) => void;
  onDelete: (mealId: string) => void;
  onSelect: (meal: NutritionEntry, mealId: string) => void;
};

export const LoggedMealsSection: React.FC<LoggedMealsSectionProps> = ({ meals, onEdit, onDelete, onSelect }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  return (
    <Card style={{ borderRadius: globalStyles.borders.borderRadius }}>
      <View style={styles.loggedMealsSection}>
        <Collapsible title={`${t('nutritionLogger.loggedMealsTitle')} (${meals.length})`} titleType="default" initialCollapsed>
          {meals.map(meal => {
            const mealName = typeof meal?.mealName === 'string' && meal.mealName.trim().length > 0 ? meal.mealName : t('nutritionLogger.unnamedMeal');

            return (
              <SwipeableRow
                key={meal.id}
                onEdit={() => onEdit(meal.id, mealName)}
                onDelete={() => onDelete(meal.id)}
                containerStyle={styles.loggedMealSwipeContent}
              >
                <TouchableOpacity style={styles.loggedMealPressable} onPress={() => onSelect(meal, meal.id)} activeOpacity={0.8}>
                  <View style={styles.loggedMealRow}>
                    <View style={styles.loggedMealInfo}>
                      <ThemedText type="default" style={styles.loggedMealName} numberOfLines={1}>
                        {mealName}
                      </ThemedText>
                      {meal.recordedAt && (
                        <ThemedText type="caption" style={{ color: colors.textMuted }}>
                          {formatClockTime(new Date(meal.recordedAt), i18n.language)}
                        </ThemedText>
                      )}
                    </View>
                    <View style={styles.mealValues}>
                      {meal.calories != null && (
                        <View style={styles.mealValue}>
                          <IconSymbol name="flame" size={14} color={colors.textMuted} />
                          <ThemedText type="caption" style={{ color: colors.textMuted }}>
                            {Math.round(meal.calories)} kcal
                          </ThemedText>
                        </View>
                      )}
                      {meal.fiber != null && (
                        <View style={styles.mealValue}>
                          <IconSymbol name="fiber" size={14} color={colors.textMuted} />
                          <ThemedText type="caption" style={{ color: colors.textMuted }}>
                            {Math.round(meal.fiber)} g
                          </ThemedText>
                        </View>
                      )}
                      <ThemedText type="default" style={[styles.loggedMealIcon, { color: colors.textMuted }]}>
                        ⋮
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              </SwipeableRow>
            );
          })}
        </Collapsible>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  loggedMealsSection: {
    marginTop: 2,
  },
  loggedMealRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  loggedMealInfo: {
    flex: 1,
    gap: 2,
  },
  loggedMealName: {
    flexShrink: 1,
  },
  loggedMealPressable: {
    width: '100%',
    justifyContent: 'center',
  },
  mealValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loggedMealSwipeContent: {
    height: 50,
    justifyContent: 'center',
    width: '100%',
    borderRadius: 0,
    overflow: 'hidden',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  loggedMealIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
});
