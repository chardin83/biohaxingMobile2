import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import ReadConfirmation from '@/components/ui/ReadConfirmation';
import XPBadge from '@/components/ui/XPBadge';
import { XP_FOR_RELATED_FOODS_READ } from '@/constants/XP';
import type { Tip } from '@/locales/tips';
import { FOOD_IMAGES } from '@/types/nutrition/foodImages';

type Props = Readonly<{
  tip?: Tip;
}>;

export default function NutritionFoodsSection({ tip }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { viewedTips, claimTipReadingXP } = useStorage();
  const isRead = viewedTips.find(view => view.tipId === tip?.id)?.foodsRead === true;
  const [sheetOpen, setSheetOpen] = React.useState(false);
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
    <InformationCardLink title={title + ` (${foods.length})`} sheetTitle={title} subtitle={subtitle} iconName="vegetables" snapPoints={['70%', '95%']}
      accessory={<XPBadge amount={XP_FOR_RELATED_FOODS_READ} showPlus checked={isRead} />}
      onSheetChange={index => setSheetOpen(index >= 0)}
      onDismiss={() => setSheetOpen(false)}
      footer={<ReadConfirmation key={tip.id} read={isRead} active={sheetOpen} xp={XP_FOR_RELATED_FOODS_READ} onConfirm={() => { claimTipReadingXP(tip.id, 'foods'); }} />}
    >
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
