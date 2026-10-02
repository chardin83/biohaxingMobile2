import type { ImageSourcePropType } from 'react-native';

import type { NutritionData } from '@/app/context/storage/nutrition/nutritionTypes';
import type { PolyphenolType } from '@/constants/polyphenols';
import type { DrinkType } from '@/services/gptServices';
import type { BarcodeProduct } from '@/services/openFoodFacts';

const DRINK_IMAGES: Record<DrinkType, ImageSourcePropType> = {
  water: require('@/assets/images/drinks/water.png'),
  coffee: require('@/assets/images/drinks/coffee.png'),
  tea: require('@/assets/images/drinks/tea.png'),
  soft_drink: require('@/assets/images/drinks/softDrink.png'),
  energy_drink: require('@/assets/images/drinks/energyDrink.png'),
  juice: require('@/assets/images/drinks/juice.png'),
  milk: require('@/assets/images/drinks/milk.png'),
  red_wine: require('@/assets/images/drinks/redWine.png'),
  white_wine: require('@/assets/images/drinks/whiteWine.png'),
  beer: require('@/assets/images/drinks/beer.png'),
  spirits: require('@/assets/images/drinks/spirits.png'),
  oak_aged_spirits: require('@/assets/images/drinks/spirits.png'),
  drink: require('@/assets/images/drinks/drink.png'),
};

export const DRINK_TYPES = Object.keys(DRINK_IMAGES) as DrinkType[];

export const getDrinkImage = (type: DrinkType): ImageSourcePropType => DRINK_IMAGES[type];

type DrinkNutritionPer100ml = {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
};

type DrinkDefaults = {
  amountMl: number;
  per100ml: DrinkNutritionPer100ml;
  polyphenolsMgPer100ml?: Partial<Record<PolyphenolType, number>>;
};

const n = (calories: number, protein: number, carbohydrates: number, fat: number, fiber = 0): DrinkNutritionPer100ml => ({
  calories,
  protein,
  carbohydrates,
  fat,
  fiber,
});

// Approximate typical values per 100 ml and a common serving size.
const DRINK_DEFAULTS: Record<DrinkType, DrinkDefaults> = {
  water: { amountMl: 250, per100ml: n(0, 0, 0, 0) },
  coffee: { amountMl: 200, per100ml: n(1, 0.1, 0, 0), polyphenolsMgPer100ml: { polyphenols_total: 200, chlorogenic_acids: 150, phenolic_acids: 170 } },
  tea: { amountMl: 250, per100ml: n(1, 0, 0.2, 0), polyphenolsMgPer100ml: { polyphenols_total: 110, flavonoids_total: 80, flavanols: 60, catechins: 40 } },
  soft_drink: { amountMl: 330, per100ml: n(42, 0, 10.6, 0) },
  energy_drink: { amountMl: 250, per100ml: n(45, 0, 11, 0) },
  juice: { amountMl: 200, per100ml: n(45, 0.5, 10.5, 0.1, 0.2), polyphenolsMgPer100ml: { polyphenols_total: 70, flavonoids_total: 45 } },
  milk: { amountMl: 200, per100ml: n(46, 3.4, 4.8, 1.5) },
  red_wine: {
    amountMl: 150,
    per100ml: n(85, 0.1, 2.6, 0),
    polyphenolsMgPer100ml: { polyphenols_total: 220, flavonoids_total: 90, anthocyanins: 25, flavanols: 30, phenolic_acids: 40, ellagitannins: 8 },
  },
  white_wine: { amountMl: 150, per100ml: n(82, 0.1, 2.6, 0), polyphenolsMgPer100ml: { polyphenols_total: 25, phenolic_acids: 15, ellagitannins: 2 } },
  beer: { amountMl: 330, per100ml: n(43, 0.5, 3.6, 0), polyphenolsMgPer100ml: { polyphenols_total: 40, phenolic_acids: 15, flavonoids_total: 10 } },
  spirits: { amountMl: 40, per100ml: n(231, 0, 0, 0) },
  oak_aged_spirits: { amountMl: 40, per100ml: n(235, 0, 0.1, 0), polyphenolsMgPer100ml: { polyphenols_total: 5, ellagitannins: 3 } },
  drink: { amountMl: 200, per100ml: n(40, 0, 10, 0) },
};

export const getDrinkProduct = (type: DrinkType, name: string): BarcodeProduct => {
  const { amountMl, per100ml, polyphenolsMgPer100ml } = DRINK_DEFAULTS[type];

  return {
    barcode: '',
    name,
    quantityValue: amountMl,
    quantityUnit: 'ml',
    productType: 'drink',
    drinkType: type,
    fromCatalog: true,
    nutrition: {
      caloriesPer100g: per100ml.calories,
      proteinPer100g: per100ml.protein,
      carbohydratesPer100g: per100ml.carbohydrates,
      fatPer100g: per100ml.fat,
      fiberPer100g: per100ml.fiber,
      polyphenolsMgPer100g: polyphenolsMgPer100ml,
    },
  };
};

export const getDrinkNutritionData = (type: DrinkType, name: string, amountMl?: number): NutritionData => {
  const { amountMl: defaultAmountMl, per100ml, polyphenolsMgPer100ml } = DRINK_DEFAULTS[type];
  const factor = (amountMl ?? defaultAmountMl) / 100;
  const round1 = (value: number) => Math.round(value * 10) / 10;

  return {
    name,
    calories: Math.round(per100ml.calories * factor),
    protein: round1(per100ml.protein * factor),
    carbohydrates: round1(per100ml.carbohydrates * factor),
    fat: round1(per100ml.fat * factor),
    fiber: round1(per100ml.fiber * factor),
    ...(polyphenolsMgPer100ml && {
      polyphenolByType: Object.fromEntries(Object.entries(polyphenolsMgPer100ml).map(([key, value]) => [key, value * factor])),
    }),
  };
};
