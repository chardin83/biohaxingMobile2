import AsyncStorage from '@react-native-async-storage/async-storage';

import { getStorageSize } from '../shared/storageSize';

export type AppStorageData = {
  hasVisitedChat: boolean;
  shareHealthPlan: boolean;
  myAreas: string[];
  hasCompletedOnboarding: boolean;
  onboardingStep: number;
  showMusic: boolean;
  healthSyncEnabled: boolean;
  hideBarcodeInfo: boolean;
};

const STORAGE_KEYS = {
  HAS_VISITED_CHAT: 'hasVisitedChat',
  SHARE_HEALTH_PLAN: 'shareHealthPlan',
  MY_AREAS: 'myAreas',
  HAS_COMPLETED_ONBOARDING: 'hasCompletedOnboarding',
  ONBOARDING_STEP: 'onBoardingStep',
  SHOW_MUSIC: 'showMusic',
  HEALTH_SYNC_ENABLED: 'healthSyncEnabled',
  HIDE_BARCODE_INFO: 'hideBarcodeInfo',
} as const;

export const getAppStorage = async (): Promise<AppStorageData> => {
  const [visited, share, areas, onboarding, onboardingStep, showMusic, healthSyncEnabled, hideBarcodeInfo] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.HAS_VISITED_CHAT),
    AsyncStorage.getItem(STORAGE_KEYS.SHARE_HEALTH_PLAN),
    AsyncStorage.getItem(STORAGE_KEYS.MY_AREAS),
    AsyncStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING),
    AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP),
    AsyncStorage.getItem(STORAGE_KEYS.SHOW_MUSIC),
    AsyncStorage.getItem(STORAGE_KEYS.HEALTH_SYNC_ENABLED),
    AsyncStorage.getItem(STORAGE_KEYS.HIDE_BARCODE_INFO),
  ]);

  return {
    hasVisitedChat: visited === 'true',
    shareHealthPlan: share === 'true',
    myAreas: areas ? JSON.parse(areas) : [],
    hasCompletedOnboarding: onboarding === 'true',
    onboardingStep: onboardingStep ? Number.parseInt(onboardingStep, 10) : 0,
    showMusic: showMusic === null ? true : showMusic === 'true',
    healthSyncEnabled: healthSyncEnabled === 'true',
    hideBarcodeInfo: hideBarcodeInfo === 'true',
  };
};

export const saveHasVisitedChat = (value: boolean) => AsyncStorage.setItem(STORAGE_KEYS.HAS_VISITED_CHAT, String(value));

export const saveShareHealthPlan = (value: boolean) => AsyncStorage.setItem(STORAGE_KEYS.SHARE_HEALTH_PLAN, String(value));

export const saveMyAreas = (value: string[]) => AsyncStorage.setItem(STORAGE_KEYS.MY_AREAS, JSON.stringify(value));

export const saveHasCompletedOnboarding = (value: boolean) => AsyncStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, String(value));

export const saveOnboardingStep = (value: number) => AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_STEP, String(value));

export const saveShowMusic = (value: boolean) => AsyncStorage.setItem(STORAGE_KEYS.SHOW_MUSIC, String(value));

export const saveHealthSyncEnabled = (value: boolean) => AsyncStorage.setItem(STORAGE_KEYS.HEALTH_SYNC_ENABLED, String(value));

export const saveHideBarcodeInfo = (value: boolean) => AsyncStorage.setItem(STORAGE_KEYS.HIDE_BARCODE_INFO, String(value));

export const getHealthSettingsStorageSize = (): Promise<number> => getStorageSize([STORAGE_KEYS.HEALTH_SYNC_ENABLED]);

export const getKnowledgeSettingsStorageSize = (): Promise<number> => getStorageSize([STORAGE_KEYS.MY_AREAS, STORAGE_KEYS.HAS_VISITED_CHAT]);

export const getSharingStorageSize = (): Promise<number> => getStorageSize([STORAGE_KEYS.SHARE_HEALTH_PLAN]);
