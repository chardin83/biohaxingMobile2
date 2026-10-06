import { BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { forwardRef, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ImageSourcePropType, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import CardLinkList from '@/components/ui/CardLinkList';
import { FOOD_IMAGES } from '@/types/nutrition/foodCatalog';
import { FOOD_KEYS, type FoodKey } from '@/utils/foodProduct';

import { useBottomSheetDesign } from '../ui/BottomSheetDesign';

type FoodItem = { key: FoodKey; name: string };

interface FoodPickerBottomSheetProps {
  onSelect: (key: FoodKey) => void;
}

const FoodPickerBottomSheet = forwardRef<BottomSheetModal, FoodPickerBottomSheetProps>(({ onSelect }, ref) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const sheetDesign = useBottomSheetDesign(colors);
  const [query, setQuery] = useState('');

  const snapPoints = useMemo(() => ['85%'], []);

  const foods = useMemo(
    () =>
      FOOD_KEYS.map(key => ({ key, name: t(`food:foods.${key}.name`, { defaultValue: key }) }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(food => food.name.toLowerCase().includes(query.trim().toLowerCase())),
    [t, query]
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      backgroundStyle={sheetDesign.backgroundStyle}
      handleComponent={sheetDesign.handleComponent}
      onDismiss={() => setQuery('')}
    >
      <View style={styles.header}>
        <ThemedText type="title2">{t('journal:nutritionLogger.foodPicker.title')}</ThemedText>
        <ThemedText type="caption" style={{ color: colors.textMuted }}>
          {t('journal:nutritionLogger.foodPicker.subtitle')}
        </ThemedText>
        <BottomSheetTextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('journal:nutritionLogger.foodPicker.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={[styles.search, { color: colors.text, borderColor: colors.border }]}
          autoCorrect={false}
        />
      </View>

      <BottomSheetFlatList
        data={foods}
        keyExtractor={(item: FoodItem) => item.key}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <ThemedText type="default" style={[styles.empty, { color: colors.textMuted }]}>
            {t('journal:nutritionLogger.foodPicker.empty')}
          </ThemedText>
        }
        renderItem={({ item }: { item: FoodItem }) => (
          <CardLinkList
            rows={[{ key: 'link', title: item.name, image: FOOD_IMAGES[item.key] as ImageSourcePropType | undefined, onPress: () => onSelect(item.key) }]}
          />
        )}
      />
    </BottomSheetModal>
  );
});

FoodPickerBottomSheet.displayName = 'FoodPickerBottomSheet';

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 4,
    alignItems: 'center',
  },
  search: {
    alignSelf: 'stretch',
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 10,
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
  },
});

export default FoodPickerBottomSheet;
