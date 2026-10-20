import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import type { IdentifiedFood } from '@/types/nutrition/nutritionAnalysis';

import { ThemedModal } from '../ThemedModal';
import { ThemedText } from '../ThemedText';
import AppButton from '../ui/AppButton';

interface Ingredient extends Omit<IdentifiedFood, 'amount'> {
  amount: string;
}

export default function FoodIdentificationModal({
  value,
  mealName,
  onMealNameChange,
  onChange,
  onClose,
  onConfirm,
}: {
  value: IdentifiedFood[] | null;
  mealName: string;
  onMealNameChange: (value: string) => void;
  onChange: (value: IdentifiedFood[]) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const emittedValue = useRef<IdentifiedFood[] | null>(null);
  const key = 'journal:nutritionLogger.foodIdentification.';

  useEffect(() => {
    if (value === null) {
      emittedValue.current = null;
      setIngredients([]);
      setExpanded(null);
    } else if (value !== emittedValue.current) {
      setIngredients(value.map(food => ({ ...food, amount: String(food.amount).replace('.', ',') })));
      setExpanded(null);
      emittedValue.current = value;
    }
  }, [value]);

  const update = (next: Ingredient[]) => {
    setIngredients(next);
    const foods = next.map(item => ({ ...item, amount: Number(item.amount.replace(',', '.')) }));
    emittedValue.current = foods;
    onChange(foods);
  };
  const invalid =
    !mealName.trim() ||
    ingredients.length === 0 ||
    ingredients.some(item => !item.name.trim() || !/^\d+(?:[.,]\d+)?$/.test(item.amount) || Number(item.amount.replace(',', '.')) <= 0);
  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border }];

  return (
    <ThemedModal visible={value !== null} title={t(key + 'title')} onClose={onClose} onSave={onConfirm} onSaveDisabled={invalid} okLabel={t(key + 'confirm')}>
      <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll} contentContainerStyle={styles.content}>
        <ThemedText type="caption">{t('journal:nutritionLogger.mealNameLabel')}</ThemedText>
        <TextInput
          value={mealName}
          onChangeText={onMealNameChange}
          maxLength={200}
          accessibilityLabel={t('journal:nutritionLogger.mealNameLabel')}
          style={inputStyle}
        />
        <ThemedText>{t(key + 'description')}</ThemedText>
        {ingredients.map((item, index) => (
          <View key={index} style={[styles.card, { borderColor: colors.border }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: expanded === index }}
              onPress={() => setExpanded(expanded === index ? null : index)}
              style={styles.row}
            >
              <View style={styles.name}>
                <ThemedText>{item.name || t(key + 'newIngredient')}</ThemedText>
                {item.preparation ? <ThemedText type="caption" style={{ color: colors.textMuted }}>{`(${item.preparation})`}</ThemedText> : null}
                {item.source === 'user' ? (
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>
                    {t(key + 'fromDescription')}
                  </ThemedText>
                ) : null}
                {item.identificationConfidence === 'medium' || item.identificationConfidence === 'low' ? (
                  <ThemedText type="caption" style={{ color: colors.warmColor }}>
                    {t(key + 'uncertain')}
                  </ThemedText>
                ) : null}
              </View>
              <ThemedText style={{ color: colors.primary }}>
                {item.amount ? `${item.amount} ${item.unit}` : t(key + (item.unit === 'ml' ? 'setMilliliters' : 'setGrams'))}
              </ThemedText>
            </Pressable>
            {expanded === index && (
              <View style={styles.editor}>
                <ThemedText type="caption">{t(key + 'ingredientName')}</ThemedText>
                <TextInput
                  value={item.name}
                  accessibilityLabel={t(key + 'ingredientName')}
                  style={inputStyle}
                  onChangeText={name =>
                    update(
                      ingredients.map((row, i) =>
                        i === index ? { ...row, name: name.replace(/\r?\n/g, ' '), source: 'user', identificationConfidence: 'high' } : row
                      )
                    )
                  }
                />
                <ThemedText type="caption">{t(key + 'preparation')}</ThemedText>
                <TextInput
                  value={item.preparation ?? ''}
                  maxLength={200}
                  accessibilityLabel={t(key + 'preparation')}
                  placeholder={t(key + 'preparationPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  style={inputStyle}
                  onChangeText={preparation =>
                    update(ingredients.map((row, i) => (i === index ? { ...row, preparation: preparation.replace(/\r?\n/g, ' ') || null } : row)))
                  }
                />
                <View style={styles.unitRow}>
                  {(['g', 'ml'] as const).map(unit => (
                    <Pressable
                      key={unit}
                      accessibilityRole="button"
                      accessibilityLabel={t(key + (unit === 'ml' ? 'useMilliliters' : 'useGrams'))}
                      accessibilityState={{ selected: item.unit === unit }}
                      style={[styles.unitButton, { borderColor: item.unit === unit ? colors.primary : colors.border }]}
                      onPress={() => update(ingredients.map((row, i) => (i === index ? { ...row, unit } : row)))}
                    >
                      <ThemedText style={{ color: item.unit === unit ? colors.primary : colors.textMuted }}>{unit}</ThemedText>
                    </Pressable>
                  ))}
                </View>
                <ThemedText type="caption">{t(key + (item.unit === 'ml' ? 'milliliters' : 'grams'))}</ThemedText>
                <TextInput
                  value={item.amount}
                  keyboardType="decimal-pad"
                  placeholder={t(key + 'optional')}
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel={t(key + (item.unit === 'ml' ? 'milliliters' : 'grams'))}
                  style={inputStyle}
                  onChangeText={amount => update(ingredients.map((row, i) => (i === index ? { ...row, amount } : row)))}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    update(ingredients.filter((_, i) => i !== index));
                    setExpanded(null);
                  }}
                  style={styles.remove}
                >
                  <ThemedText style={{ color: colors.error }}>{t(key + 'remove')}</ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        ))}
        <AppButton
          title={t(key + 'add')}
          variant="secondary"
          onPress={() => {
            update([...ingredients, { name: '', amount: '', unit: 'g', source: 'user', identificationConfidence: 'high' }]);
            setExpanded(ingredients.length);
          }}
        />
      </ScrollView>
    </ThemedModal>
  );
}

const styles = StyleSheet.create({
  unitRow: { flexDirection: 'row', gap: 8 },
  unitButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  scroll: { maxHeight: 350, width: '100%' },
  content: { gap: 10, paddingBottom: 12 },
  card: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, minHeight: 52 },
  name: { flex: 1 },
  editor: { padding: 14, paddingTop: 0, gap: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 44 },
  remove: { paddingVertical: 10, alignSelf: 'flex-start' },
});
