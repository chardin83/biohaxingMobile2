import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { DrinkEntry } from '@/app/context/storage/drinks/drinkTypes';
import { globalStyles } from '@/app/theme/globalStyles';
import { isAlcohol } from '@/services/gptServices';

import { Collapsible } from '../Collapsible';
import { ThemedText } from '../ThemedText';
import { Card } from '../ui/Card';
import { IconSymbol } from '../ui/IconSymbol';
import { SwipeableRow } from '../ui/SwipeableRow';

type LoggedDrinksSectionProps = {
  drinks: DrinkEntry[];
  onEdit: (drinkId: string) => void;
  onDelete: (drinkId: string) => void;
};

export const LoggedDrinksSection: React.FC<LoggedDrinksSectionProps> = ({ drinks, onEdit, onDelete }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const formatTime = (recordedAt: string): string => {
    const date = new Date(recordedAt);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card style={{ borderRadius: globalStyles.borders.borderRadius }}>
      <View style={styles.loggedDrinksSection}>
        <Collapsible title={`${t('nutritionLogger.loggedDrinksTitle')} (${drinks.length})`} titleType="default" initialCollapsed>
          {drinks.map(drink => {
            return (
              <SwipeableRow key={drink.id} onDelete={() => onDelete(drink.id)} onEdit={() => onEdit(drink.id)} containerStyle={styles.loggedDrinkSwipeContent}>
                <View style={styles.loggedDrinkRow}>
                  <View style={styles.loggedDrinkInfo}>
                    <View style={styles.drinkNameRow}>
                      <ThemedText type="default">{drink.name}</ThemedText>
                    </View>
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>
                      {formatTime(drink.recordedAt)}
                    </ThemedText>
                  </View>

                  <View style={styles.drinkTags}>
                    {drink.amountMl != null && (
                      <View style={styles.drinkTag}>
                        <MaterialIcons name="local-drink" size={14} color={colors.textMuted} />
                        <ThemedText type="caption" style={{ color: colors.textMuted }}>
                          {Math.round(drink.amountMl)} ml
                        </ThemedText>
                      </View>
                    )}
                    {drink.caffeinated === true && (
                      <View style={styles.drinkTag}>
                        <IconSymbol name="caffeine" size={14} color={colors.textMuted} />
                        <ThemedText type="caption" style={{ color: colors.textMuted }}>
                          {t('nutritionLogger.caffeine')}
                        </ThemedText>
                      </View>
                    )}

                    {isAlcohol(drink.type) && (
                      <View style={styles.drinkTag}>
                        <IconSymbol name="alcohol" size={14} color={colors.textMuted} />
                        <ThemedText type="caption" style={{ color: colors.textMuted }}>
                          {t('nutritionLogger.alcohol')}
                        </ThemedText>
                      </View>
                    )}

                    <ThemedText type="default" style={[styles.loggedDrinkIcon, { color: colors.textMuted }]}>
                      ⋮
                    </ThemedText>
                  </View>
                </View>
              </SwipeableRow>
            );
          })}
        </Collapsible>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  loggedDrinksSection: {
    marginTop: 2,
  },
  loggedDrinkRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  loggedDrinkInfo: {
    flex: 1,
    gap: 2,
  },
  drinkNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  drinkTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drinkTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loggedDrinkSwipeContent: {
    minHeight: 56,
    justifyContent: 'center',
    width: '100%',
    borderRadius: 0,
    overflow: 'hidden',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  loggedDrinkIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
});
