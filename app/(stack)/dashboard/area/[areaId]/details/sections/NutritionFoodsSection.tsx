import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import type { Tip } from '@/locales/tips';
import { FOOD_IMAGES } from '@/types/nutrition/foodCatalog';

type Props = Readonly<{
  tip?: Tip;
}>;

export default function NutritionFoodsSection({ tip }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  if (!tip?.nutritionFoods?.length) return null;

  const foods = tip.nutritionFoods.map(food => ({
    key: food.key,
    name: t(`food:foods.${food.key}.name`, {
      defaultValue: t(`tips:${tip.id}.nutritionFoods.items.${food.key}.name`, { defaultValue: food.key }),
    }),
    details: t(`tips:${tip.id}.nutritionFoods.items.${food.detailsKey ?? food.key}.details`, { defaultValue: '' }),
    image: FOOD_IMAGES[food.key as keyof typeof FOOD_IMAGES] as ImageSourcePropType | undefined,
  }));
  const title = t('common:tipDetails.relatedFoodsTitle');
  const subtitle = foods.map((food, index) => (index === 0 ? food.name : food.name.charAt(0).toLocaleLowerCase() + food.name.slice(1))).join(', ');

  return (
    <InformationCardLink title={title + ` (${foods.length})`} sheetTitle={title} subtitle={subtitle} iconName="vegetables" snapPoints={['70%', '95%']}>
      <View style={styles.foods}>
        {foods.map(food => (
          <Card key={food.key} style={styles.foodCard}>
            <View style={styles.imageContainer}>
              {food.image ? (
                <Image source={food.image} style={styles.image} resizeMode="contain" accessibilityLabel={food.name} />
              ) : (
                <IconSymbol name="meal" size={48} color={colors.primary} />
              )}
            </View>
            <ThemedText type="defaultSemiBold" style={styles.name}>
              {food.name}
            </ThemedText>
            {food.details ? (
              <ThemedText type="caption" style={styles.details}>
                {food.details}
              </ThemedText>
            ) : null}
          </Card>
        ))}
      </View>
    </InformationCardLink>
  );
}

const styles = StyleSheet.create({
  foods: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  foodCard: { flexBasis: '47%', flexGrow: 1, marginBottom: 0, padding: 12 },
  imageContainer: { height: 76, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  image: { width: 72, height: 72 },
  name: { textAlign: 'center' },
  details: { marginTop: 6 },
  added: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, gap: 6 },
});
