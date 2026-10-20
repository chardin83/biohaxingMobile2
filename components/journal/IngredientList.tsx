import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import type { IdentifiedFood } from '@/types/nutrition/nutritionAnalysis';

import { ThemedText } from '../ThemedText';

export function IngredientList({ ingredients, style }: { ingredients: IdentifiedFood[]; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.list, { borderColor: colors.border }, style]}>
      {ingredients.map((food, index) => (
        <View key={`${index}-${food.name}`} style={[styles.row, { borderColor: colors.border }]}>
          <View style={styles.name}>
            <ThemedText>{food.name}</ThemedText>
            {food.preparation ? <ThemedText type="caption" style={{ color: colors.textMuted }}>{`(${food.preparation})`}</ThemedText> : null}
          </View>
          <ThemedText type="defaultSemiBold" style={{ color: colors.accentStrong }}>{`${String(food.grams).replace('.', ',')} g`}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  name: { flex: 1 },
});
