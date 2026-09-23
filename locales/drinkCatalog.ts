import type { ImageSourcePropType } from 'react-native';

import type { DrinkType } from '@/services/gptServices';

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
  drink: require('@/assets/images/drinks/drink.png'),
};

export const getDrinkImage = (type: DrinkType): ImageSourcePropType => DRINK_IMAGES[type];
