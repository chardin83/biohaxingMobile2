import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_PROFILE_SHARING, PROFILE_SHARING_FIELDS, type ProfileSharing } from '@/types/aiSharing';

import { getAppleHealthConnectionHistory } from '../health/appleHealthConnectionHistory';
import { getStorageSize } from '../shared/storageSize';

export type AppStorageData = {
  hasVisitedChat: boolean;
  shareInterests: boolean;
  shareArchivedPlans: boolean;
  shareHealthPlan: boolean;
  profileSharing: ProfileSharing;
  myAreas: string[];
  hasCompletedOnboarding: boolean;
  onboardingStep: number;
  showMusic: boolean;
  healthSyncEnabled: boolean;
  hasConnectedAppleHealth: boolean;
  hideHealthSyncPrompt: boolean;
  hideBarcodeInfo: boolean;
};

const STORAGE_KEYS = {
  HAS_VISITED_CHAT: 'hasVisitedChat',
  SHARE_INTERESTS: 'shareInterests',
  SHARE_ARCHIVED_PLANS: 'shareArchivedPlans',
  SHARE_HEALTH_PLAN: 'shareHealthPlan',
  PROFILE_SHARING: 'aiProfileSharing',
  MY_AREAS: 'myAreas',
  HAS_COMPLETED_ONBOARDING: 'hasCompletedOnboarding',
  ONBOARDING_STEP: 'onBoardingStep',
  SHOW_MUSIC: 'showMusic',
  HEALTH_SYNC_ENABLED: 'healthSyncEnabled',
  HIDE_HEALTH_SYNC_PROMPT: 'hideHealthSyncPrompt',
  HIDE_BARCODE_INFO: 'hideBarcodeInfo',
  ALCOHOL_LOGGING_INFO_SEEN: 'alcoholLoggingInfoSeen',
  CAFFEINE_LOGGING_INFO_SEEN: 'caffeineLoggingInfoSeen',
} as const;

function parseProfileSharing(raw: string | null): ProfileSharing {
  try {
    const value = raw ? JSON.parse(raw) : {};
    return Object.fromEntries(PROFILE_SHARING_FIELDS.map(field => [field, value?.[field] === true])) as ProfileSharing;
  } catch {
    return { ...DEFAULT_PROFILE_SHARING };
  }
}

export const getAppStorage = async (): Promise<AppStorageData> => {
  const [
    visited,
    share,
    areas,
    onboarding,
    onboardingStep,
    showMusic,
    healthSyncEnabled,
    hideBarcodeInfo,
    profileSharing,
    shareInterests,
    shareArchivedPlans,
    hideHealthSyncPrompt,
    hasConnectedAppleHealth,
  ] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.HAS_VISITED_CHAT),
    AsyncStorage.getItem(STORAGE_KEYS.SHARE_HEALTH_PLAN),
    AsyncStorage.getItem(STORAGE_KEYS.MY_AREAS),
    AsyncStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING),
    AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP),
    AsyncStorage.getItem(STORAGE_KEYS.SHOW_MUSIC),
    AsyncStorage.getItem(STORAGE_KEYS.HEALTH_SYNC_ENABLED),
    AsyncStorage.getItem(STORAGE_KEYS.HIDE_BARCODE_INFO),
    AsyncStorage.getItem(STORAGE_KEYS.PROFILE_SHARING),
    AsyncStorage.getItem(STORAGE_KEYS.SHARE_INTERESTS),
    AsyncStorage.getItem(STORAGE_KEYS.SHARE_ARCHIVED_PLANS),
    AsyncStorage.getItem(STORAGE_KEYS.HIDE_HEALTH_SYNC_PROMPT),
    getAppleHealthConnectionHistory(),
  ]);

  return {
    hasVisitedChat: visited === 'true',
    shareHealthPlan: share === 'true',
    shareInterests: shareInterests === 'true',
    shareArchivedPlans: shareArchivedPlans === 'true',
    profileSharing: parseProfileSharing(profileSharing),
    myAreas: areas ? JSON.parse(areas) : [],
    hasCompletedOnboarding: onboarding === 'true',
    onboardingStep: onboardingStep ? Number.parseInt(onboardingStep, 10) : 0,
    showMusic: showMusic === null ? true : showMusic === 'true',
    healthSyncEnabled: healthSyncEnabled === 'true',
    hasConnectedAppleHealth,
    hideHealthSyncPrompt: hideHealthSyncPrompt === 'true',
    hideBarcodeInfo: hideBarcodeInfo === 'true',
  };
};

export const saveHasVisitedChat = (value: boolean) => AsyncStorage.setItem(STORAGE_KEYS.HAS_VISITED_CHAT, String(value));

export const saveShareHealthPlan = (value: boolean) => AsyncStorage.setItem(STORAGE_KEYS.SHARE_HEALTH_PLAN, String(value));

export const saveShareInterests = (value: boolean) => AsyncStorage.setItem(STORAGE_KEYS.SHARE_INTERESTS, String(value));
export const saveShareArchivedPlans = (value: boolean) => AsyncStorage.setItem(STORAGE_KEYS.SHARE_ARCHIVED_PLANS, String(value));

export const saveProfileSharing = (value: ProfileSharing) => AsyncStorage.setItem(STORAGE_KEYS.PROFILE_SHARING, JSON.stringify(value));

export const saveMyAreas = (value: string[]) => AsyncStorage.setItem(STORAGE_KEYS.MY_AREAS, JSON.stringify(value));

export const saveHasCompletedOnboarding = (value: boolean) => AsyncStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, String(value));

export const saveOnboardingStep = (value: number) => AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_STEP, String(value));

export const saveShowMusic = (value: boolean) => AsyncStorage.setItem(STORAGE_KEYS.SHOW_MUSIC, String(value));

export const saveHealthSyncEnabled = (value: boolean) => AsyncStorage.setItem(STORAGE_KEYS.HEALTH_SYNC_ENABLED, String(value));

export const saveHideHealthSyncPrompt = (value: boolean) => AsyncStorage.setItem(STORAGE_KEYS.HIDE_HEALTH_SYNC_PROMPT, String(value));

export const saveHideBarcodeInfo = (value: boolean) => AsyncStorage.setItem(STORAGE_KEYS.HIDE_BARCODE_INFO, String(value));

export const getAlcoholLoggingInfoSeen = async () => (await AsyncStorage.getItem(STORAGE_KEYS.ALCOHOL_LOGGING_INFO_SEEN)) === 'true';
export const saveAlcoholLoggingInfoSeen = () => AsyncStorage.setItem(STORAGE_KEYS.ALCOHOL_LOGGING_INFO_SEEN, 'true');

export const getCaffeineLoggingInfoSeen = async () => (await AsyncStorage.getItem(STORAGE_KEYS.CAFFEINE_LOGGING_INFO_SEEN)) === 'true';
export const saveCaffeineLoggingInfoSeen = () => AsyncStorage.setItem(STORAGE_KEYS.CAFFEINE_LOGGING_INFO_SEEN, 'true');

export const getHealthSettingsStorageSize = (): Promise<number> => getStorageSize([STORAGE_KEYS.HEALTH_SYNC_ENABLED, STORAGE_KEYS.HIDE_HEALTH_SYNC_PROMPT]);

export const getKnowledgeSettingsStorageSize = (): Promise<number> => getStorageSize([STORAGE_KEYS.MY_AREAS, STORAGE_KEYS.HAS_VISITED_CHAT]);

export const getSharingStorageSize = (): Promise<number> =>
  getStorageSize([STORAGE_KEYS.SHARE_HEALTH_PLAN, STORAGE_KEYS.PROFILE_SHARING, STORAGE_KEYS.SHARE_INTERESTS, STORAGE_KEYS.SHARE_ARCHIVED_PLANS]);
