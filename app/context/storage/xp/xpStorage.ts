import AsyncStorage from '@react-native-async-storage/async-storage';

import { getStorageSize } from '../shared/storageSize';
import { NutritionXpClaim, ViewedTip, XpBreakdown } from './xpTyptes';

const STORAGE_KEYS = {
  MY_XP: 'myXP',
  XP_BREAKDOWN: 'xpBreakdown',
  MY_LEVEL: 'myLevel',
  VIEWED_TIPS: 'viewedTips',
  NUTRITION_XP_CLAIMS: 'nutritionXpClaims',
} as const;

const normalizeViewedTips = (value: unknown): ViewedTip[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item: any): ViewedTip | null => {
      if (typeof item?.tipId !== 'string') {
        return null;
      }

      return {
        tipId: item.tipId,
        viewedAt: typeof item.viewedAt === 'string' ? item.viewedAt : new Date().toISOString(),
        askedQuestions: Array.isArray(item.askedQuestions) ? item.askedQuestions.filter((q: unknown) => typeof q === 'string') : [],
        xpEarned: Number.isFinite(item.xpEarned) ? item.xpEarned : 0,
        verdict: item.verdict,
      };
    })
    .filter((item): item is ViewedTip => item !== null);
};

export const getXpStorage = async () => {
  const [xp, breakdown, level, viewedTips, claims] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.MY_XP),
    AsyncStorage.getItem(STORAGE_KEYS.XP_BREAKDOWN),
    AsyncStorage.getItem(STORAGE_KEYS.MY_LEVEL),
    AsyncStorage.getItem(STORAGE_KEYS.VIEWED_TIPS),
    AsyncStorage.getItem(STORAGE_KEYS.NUTRITION_XP_CLAIMS),
  ]);

  return {
    myXP: xp ? Number(xp) : 0,

    xpBreakdown: breakdown
      ? JSON.parse(breakdown)
      : {
          education: 0,
          nutrition: 0,
        },

    myLevel: level ? Number(level) : 1,

    viewedTips: viewedTips ? normalizeViewedTips(JSON.parse(viewedTips)) : [],

    nutritionXpClaims: claims ? JSON.parse(claims) : {},
  };
};

export const saveXP = (value: number) => AsyncStorage.setItem(STORAGE_KEYS.MY_XP, String(value));

export const saveXpBreakdown = (value: XpBreakdown) => AsyncStorage.setItem(STORAGE_KEYS.XP_BREAKDOWN, JSON.stringify(value));

export const saveLevel = (value: number) => AsyncStorage.setItem(STORAGE_KEYS.MY_LEVEL, String(value));

export const saveViewedTips = (value: ViewedTip[]) => AsyncStorage.setItem(STORAGE_KEYS.VIEWED_TIPS, JSON.stringify(value));

export const saveNutritionXpClaims = (value: Record<string, NutritionXpClaim>) => AsyncStorage.setItem(STORAGE_KEYS.NUTRITION_XP_CLAIMS, JSON.stringify(value));

export const getNutritionXpStorageSize = (): Promise<number> => getStorageSize([STORAGE_KEYS.NUTRITION_XP_CLAIMS]);

export const getKnowledgeXpStorageSize = (): Promise<number> => getStorageSize([STORAGE_KEYS.VIEWED_TIPS]);
