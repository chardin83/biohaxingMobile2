import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import type { IdentifiedFood } from '@/types/nutrition/nutritionAnalysis';

import { ThemedModal } from '../ThemedModal';
import { ThemedText } from '../ThemedText';
import AppButton from '../ui/AppButton';

interface Ingredient extends Omit<IdentifiedFood, 'grams'> {
  grams: string;
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
      setIngredients(value.map(food => ({ ...food, grams: String(food.grams).replace('.', ',') })));
      setExpanded(null);
      emittedValue.current = value;
    }
  }, [value]);

  const update = (next: Ingredient[]) => {
    setIngredients(next);
    const foods = next.map(item => ({ ...item, grams: Number(item.grams.replace(',', '.')) }));
    emittedValue.current = foods;
    onChange(foods);
  };
  const invalid =
    !mealName.trim() ||
    ingredients.length === 0 ||
    ingredients.some(item => !item.name.trim() || !/^\d+(?:[.,]\d+)?$/.test(item.grams) || Number(item.grams.replace(',', '.')) <= 0);
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
              <ThemedText style={{ color: colors.primary }}>{item.grams ? `${item.grams} g` : t(key + 'setGrams')}</ThemedText>
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
                <ThemedText type="caption">{t(key + 'grams')}</ThemedText>
                <TextInput
                  value={item.grams}
                  keyboardType="decimal-pad"
                  placeholder={t(key + 'optional')}
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel={t(key + 'grams')}
                  style={inputStyle}
                  onChangeText={grams => update(ingredients.map((row, i) => (i === index ? { ...row, grams } : row)))}
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
            update([...ingredients, { name: '', grams: '', source: 'user', identificationConfidence: 'high' }]);
            setExpanded(ingredients.length);
          }}
        />
      </ScrollView>
    </ThemedModal>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 350, width: '100%' },
  content: { gap: 10, paddingBottom: 12 },
  card: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, minHeight: 52 },
  name: { flex: 1 },
  editor: { padding: 14, paddingTop: 0, gap: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 44 },
  remove: { paddingVertical: 10, alignSelf: 'flex-start' },
});
