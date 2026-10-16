export const LIFE_STYLE_ITEMS = {
  dimmedLights: { category: 'sleep' },
  calmActivity: { category: 'recovery' },
  reducedScreens: { category: 'sleep' },
  caffeineBeforeSleep: { category: 'sleep' },
  caffeine: { category: 'nutrition' },
  alcohol: { category: 'nutrition' },
  alcoholBeforeSleep: { category: 'sleep' },
} as const;

export type LifeStyleId = keyof typeof LIFE_STYLE_ITEMS;
