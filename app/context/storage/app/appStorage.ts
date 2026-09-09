import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppStorageData = {
  hasVisitedChat: boolean;
  shareHealthPlan: boolean;
  myAreas: string[];
  hasCompletedOnboarding: boolean;
  onboardingStep: number;
  showMusic: boolean;
  healthSyncEnabled: boolean;
};

const KEYS = {
  HAS_VISITED_CHAT: 'hasVisitedChat',
  SHARE_HEALTH_PLAN: 'shareHealthPlan',
  MY_AREAS: 'myAreas',
  HAS_COMPLETED_ONBOARDING: 'hasCompletedOnboarding',
  ONBOARDING_STEP: 'onBoardingStep',
  SHOW_MUSIC: 'showMusic',
  HEALTH_SYNC_ENABLED: 'healthSyncEnabled',
} as const;

export const getAppStorage =
  async (): Promise<AppStorageData> => {
    const [
      visited,
      share,
      areas,
      onboarding,
      onboardingStep,
      showMusic,
      healthSyncEnabled,
    ] = await Promise.all([
      AsyncStorage.getItem(KEYS.HAS_VISITED_CHAT),
      AsyncStorage.getItem(KEYS.SHARE_HEALTH_PLAN),
      AsyncStorage.getItem(KEYS.MY_AREAS),
      AsyncStorage.getItem(KEYS.HAS_COMPLETED_ONBOARDING),
      AsyncStorage.getItem(KEYS.ONBOARDING_STEP),
      AsyncStorage.getItem(KEYS.SHOW_MUSIC),
      AsyncStorage.getItem(KEYS.HEALTH_SYNC_ENABLED),
    ]);

    return {
      hasVisitedChat: visited === 'true',
      shareHealthPlan: share === 'true',
      myAreas: areas ? JSON.parse(areas) : [],
      hasCompletedOnboarding: onboarding === 'true',
      onboardingStep: onboardingStep
        ? Number.parseInt(onboardingStep, 10)
        : 0,
      showMusic:
        showMusic === null
          ? true
          : showMusic === 'true',
      healthSyncEnabled:
        healthSyncEnabled === 'true',
    };
  };

export const saveHasVisitedChat = (
  value: boolean
) =>
  AsyncStorage.setItem(
    KEYS.HAS_VISITED_CHAT,
    String(value)
  );

export const saveShareHealthPlan = (
  value: boolean
) =>
  AsyncStorage.setItem(
    KEYS.SHARE_HEALTH_PLAN,
    String(value)
  );

export const saveMyAreas = (value: string[]) =>
  AsyncStorage.setItem(
    KEYS.MY_AREAS,
    JSON.stringify(value)
  );

export const saveHasCompletedOnboarding = (
  value: boolean
) =>
  AsyncStorage.setItem(
    KEYS.HAS_COMPLETED_ONBOARDING,
    String(value)
  );

export const saveOnboardingStep = (
  value: number
) =>
  AsyncStorage.setItem(
    KEYS.ONBOARDING_STEP,
    String(value)
  );

export const saveShowMusic = (
  value: boolean
) =>
  AsyncStorage.setItem(
    KEYS.SHOW_MUSIC,
    String(value)
  );

export const saveHealthSyncEnabled = (
  value: boolean
) =>
  AsyncStorage.setItem(
    KEYS.HEALTH_SYNC_ENABLED,
    String(value)
  );