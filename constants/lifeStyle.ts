export const LIFE_STYLE_ITEMS = {
  dimmedLights: { category: 'sleep' },
  calmActivity: { category: 'recovery' },
  reducedScreens: { category: 'sleep' },
} as const;

export type LifeStyleId = keyof typeof LIFE_STYLE_ITEMS;
