import type { TipProgressItem } from '@/app/context/storage/nutrition/nutritionTypes';

export const getTipProgressKey = (tip: TipProgressItem): string => `${tip.tipId}|${tip.period}`;