import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';

import { Collapsible } from './Collapsible';
import { ThemedText } from './ThemedText';
import { Card } from './ui/Card';
import { SwipeableRow } from './ui/SwipeableRow';

type LoggedMealsSectionProps = {
  meals: any[];
  selectedDate: string;
  onEdit: (mealId: string, mealName: string) => void;
  onDelete: (mealId: string) => void;
  onSelect: (meal: any, mealId: string) => void;
};

export const LoggedMealsSection: React.FC<LoggedMealsSectionProps> = ({
  meals,
  selectedDate,
  onEdit,
  onDelete,
  onSelect,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Card style={{ borderRadius: globalStyles.borders.borderRadius }}>
      <View style={styles.loggedMealsSection}>
        <Collapsible
          title={`${t('nutritionLogger.loggedMealsTitle')} (${meals.length})`}
          titleType="default"
          initialCollapsed
        >
          {meals.map((meal, index) => {
            const mealName =
              typeof meal?.mealName === 'string' && meal.mealName.trim().length > 0
                ? meal.mealName
                : t('nutritionLogger.unnamedMeal');
            const mealId =
              typeof meal?.id === 'string' ? meal.id : `${selectedDate}-fallback-${index}`;

            return (
              <SwipeableRow
                key={mealId}
                onEdit={() => onEdit(mealId, mealName)}
                onDelete={() => onDelete(mealId)}
                containerStyle={styles.loggedMealSwipeContent}
              >
                <TouchableOpacity
                  style={styles.loggedMealPressable}
                  onPress={() => onSelect(meal, mealId)}
                  activeOpacity={0.8}
                >
                  <View style={styles.loggedMealRow}>
                    <ThemedText type="default" style={styles.loggedMealName}>
                      {mealName}
                    </ThemedText>
                    <ThemedText
                      type="default"
                      style={[styles.loggedMealIcon, { color: colors.textMuted }]}
                    >
                      ⋮
                    </ThemedText>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  loggedMealPressable: {
    width: '100%',
    justifyContent: 'center',
  },
  loggedMealName: {
    flex: 1,
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
