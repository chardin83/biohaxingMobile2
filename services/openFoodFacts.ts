// services/openFoodFactsService.ts

import { OPEN_FOOD_FACTS_BASE_URL } from '../config';
import { DrinkType } from './gptServices';

export interface BarcodeNutrition {
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbohydratesPer100g?: number;
  fatPer100g?: number;
  saturatedFatPer100g?: number;
  fiberPer100g?: number;
  sugarsPer100g?: number;
  saltPer100g?: number;
  sodiumPer100g?: number;
}

export type BarcodeProductType = 'food' | 'drink';

export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand?: string;
  quantity?: string;
  quantityValue?: number;
  quantityUnit?: string;
  servingSize?: string;
  imageUrl?: string;
  ingredientsText?: string;
  nutritionGrade?: string;
  productType?: BarcodeProductType;
  drinkType?: DrinkType;
  nutrition: BarcodeNutrition;
}

interface OpenFoodFactsNutriments {
  'energy-kcal_100g'?: number;
  'proteins_100g'?: number;
  'carbohydrates_100g'?: number;
  'fat_100g'?: number;
  'saturated-fat_100g'?: number;
  'fiber_100g'?: number;
  'sugars_100g'?: number;
  'salt_100g'?: number;
  'sodium_100g'?: number;
}

interface OpenFoodFactsProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  quantity?: string;
  product_quantity?: number;
  product_quantity_unit?: string;
  serving_size?: string;
  image_front_url?: string;
  ingredients_text?: string;
  nutrition_grades?: string;
  categories_tags?: string[];
  nutriments?: OpenFoodFactsNutriments;
}

interface OpenFoodFactsResponse {
  status?: string;
  product?: OpenFoodFactsProduct;
}

interface ProductClassification {
  productType?: BarcodeProductType;
  drinkType?: DrinkType;
}

const getProductClassification = (product: OpenFoodFactsProduct): ProductClassification => {
  const categories = (product.categories_tags ?? []).map(category => category.toLowerCase());

  if (categories.length === 0) {
    return {};
  }

  const hasCategory = (...values: string[]) => categories.some(category => values.some(value => category === value || category.startsWith(`${value}-`)));

  const isDrink = hasCategory('en:beverages', 'en:non-alcoholic-beverages', 'en:alcoholic-beverages');

  if (!isDrink) {
    return {
      productType: 'food',
    };
  }

  let drinkType: DrinkType = 'drink';

  if (hasCategory('en:waters', 'en:water', 'en:mineral-waters', 'en:spring-waters')) {
    drinkType = 'water';
  } else if (hasCategory('en:coffees', 'en:coffee', 'en:coffee-drinks')) {
    drinkType = 'coffee';
  } else if (hasCategory('en:teas', 'en:tea', 'en:tea-based-beverages', 'en:iced-teas')) {
    drinkType = 'tea';
  } else if (hasCategory('en:energy-drinks')) {
    drinkType = 'energy_drink';
  } else if (hasCategory('en:juices', 'en:fruit-juices', 'en:vegetable-juices', 'en:fruit-and-vegetable-juices')) {
    drinkType = 'juice';
  } else if (hasCategory('en:milks', 'en:milk', 'en:dairy-drinks', 'en:milk-drinks')) {
    drinkType = 'milk';
  } else if (hasCategory('en:red-wines')) {
    drinkType = 'red_wine';
  } else if (hasCategory('en:white-wines')) {
    drinkType = 'white_wine';
  } else if (hasCategory('en:beers', 'en:beer')) {
    drinkType = 'beer';
  } else if (hasCategory('en:spirits', 'en:liquors', 'en:distilled-beverages')) {
    drinkType = 'spirits';
  } else if (hasCategory('en:sodas', 'en:soft-drinks', 'en:carbonated-drinks')) {
    drinkType = 'soft_drink';
  }

  return {
    productType: 'drink',
    drinkType,
  };
};

const productCache = new Map<string, BarcodeProduct>();

const pendingRequests = new Map<string, Promise<BarcodeProduct | null>>();

const fetchProductByBarcode = async (normalizedBarcode: string): Promise<BarcodeProduct | null> => {
  const fields = [
    'code',
    'product_name',
    'brands',
    'quantity',
    'product_quantity',
    'product_quantity_unit',
    'serving_size',
    'image_front_url',
    'ingredients_text',
    'nutrition_grades',
    'categories_tags',
    'nutriments',
  ].join(',');

  const url = `${OPEN_FOOD_FACTS_BASE_URL}/${encodeURIComponent(normalizedBarcode)}` + `?fields=${encodeURIComponent(fields)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Open Food Facts request failed: ${response.status}`);
  }

  const data = (await response.json()) as OpenFoodFactsResponse;

  if (!data.product) {
    return null;
  }

  const product = data.product;
  const nutriments = product.nutriments ?? {};
  const classification = getProductClassification(product);

  return {
    barcode: product.code ?? normalizedBarcode,
    name: product.product_name?.trim() || 'Okänd produkt',

    brand: product.brands?.trim() || undefined,

    quantity: product.quantity?.trim() || undefined,
    quantityValue: product.product_quantity,
    quantityUnit: product.product_quantity_unit?.trim().toLowerCase() || undefined,

    servingSize: product.serving_size?.trim() || undefined,

    imageUrl: product.image_front_url || undefined,
    ingredientsText: product.ingredients_text?.trim() || undefined,

    nutritionGrade: product.nutrition_grades?.trim() || undefined,

    productType: classification.productType,
    drinkType: classification.drinkType,

    nutrition: {
      caloriesPer100g: nutriments['energy-kcal_100g'],
      proteinPer100g: nutriments.proteins_100g,
      carbohydratesPer100g: nutriments.carbohydrates_100g,
      fatPer100g: nutriments.fat_100g,
      saturatedFatPer100g: nutriments['saturated-fat_100g'],
      fiberPer100g: nutriments.fiber_100g,
      sugarsPer100g: nutriments.sugars_100g,
      saltPer100g: nutriments.salt_100g,
      sodiumPer100g: nutriments.sodium_100g,
    },
  };
};

export const getProductByBarcode = async (barcode: string): Promise<BarcodeProduct | null> => {
  const normalizedBarcode = barcode.trim();

  if (!normalizedBarcode) {
    throw new Error('Barcode is required');
  }

  const cachedProduct = productCache.get(normalizedBarcode);

  if (cachedProduct !== undefined) {
    return cachedProduct;
  }

  const pendingRequest = pendingRequests.get(normalizedBarcode);

  if (pendingRequest !== undefined) {
    return pendingRequest;
  }

  const request = fetchProductByBarcode(normalizedBarcode);

  pendingRequests.set(normalizedBarcode, request);

  try {
    const product = await request;

    if (product) {
      productCache.set(normalizedBarcode, product);
    }

    return product;
  } finally {
    pendingRequests.delete(normalizedBarcode);
  }
};
