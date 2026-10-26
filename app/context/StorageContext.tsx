//import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { isDeletedSyncedMetric } from '@/app/context/storage/metrics/deletedMetricStorage';
import { getLegacyMetricSyncKey, getMetricSyncKey, protectImportedMetrics } from '@/app/context/storage/metrics/metricProvenance';
import { subscribeArchivedPlans, subscribePlans } from '@/app/context/storage/plans/planEvents';
import { getPlanStorage, saveTrainingPlanSettings } from '@/app/context/storage/plans/planStorage';
import {
  archivePlan,
  archiveSupplement,
  archiveSupplementPlan,
  clearArchivedPlans,
  saveSupplementToPlan as saveSupplementToPlanStore,
  updatePlans,
} from '@/app/context/storage/plans/planStore';
import {
  type ArchivedPlansByCategory,
  EMPTY_ARCHIVED_PLANS,
  EMPTY_PLANS,
  type PlansByCategory,
  type TrainingPlanSettings,
} from '@/app/context/storage/plans/planTypes';
import { getAreaViewXP, getInsightQuestionXP, getTipReadingXP, TIP_READING_FIELDS, type TipReadingSection } from '@/constants/tipXP';
import { isMaxXpPreviewEnabled, levels, XP_FOR_VERDICT, XP_PER_CHAT_MESSAGE, type XpSource } from '@/constants/XP';
import { MetricId, metrics as metricDefinitions } from '@/locales/metrics';
import { countNewAutomaticHabitGoals, getAutomaticHabitGoalKeys } from '@/services/targetProgress/automaticHabitSummary';
import { getCurrentNutritionCompletions, getNutritionInputSignature } from '@/services/targetProgress/completedNutritionProgress';
import { prepareManualHabitResult, storeAutomaticSleepResults } from '@/services/targetProgress/habitResultStorage';
import { storeLifeStyleHabitResults } from '@/services/targetProgress/lifeStyleHabitResults';
import { DEFAULT_PROFILE_SHARING, type ProfileSharing } from '@/types/aiSharing';
//import { seedHabitTestDataOnce } from '@/services/testData/temporaryHabitTestData';
import { type NutritionTargetPeriod } from '@/types/nutrition/nutritionTargets';
import { VerdictValue } from '@/types/verdict';
import { buildGlycemicIndexMetrics } from '@/utils/glycemicIndexMetrics';
import { buildCalorieMetrics } from '@/utils/nutritionMetrics';
import { buildActiveMinutesMetrics } from '@/utils/trainingMetrics';
import { reconcileSyncedMetrics } from '@/wearables/reconcileSyncedMetrics';
import { refreshRecoveryAfterMetricChanges } from '@/wearables/recoveryMetrics';
import { useWearable } from '@/wearables/wearableProvider';

import { Plan } from '../domain/Plan';
import { type Supplement } from '../domain/Supplement';
import { SupplementPlanEntry } from '../domain/SupplementPlanEntry';
import { SupplementTime } from '../domain/SupplementTime';
import {
  getAppStorage,
  saveHasCompletedOnboarding,
  saveHasVisitedChat,
  saveHealthSyncEnabled,
  saveHideBarcodeInfo,
  saveHideHealthSyncPrompt,
  saveMyAreas,
  saveOnboardingStep,
  saveProfileSharing,
  saveShareArchivedPlans,
  saveShareHealthPlan,
  saveShareInterests,
  saveShowMusic,
} from './storage/app/appStorage';
import {
  addDrinkEntryToTracking,
  getDrinkStorage,
  removeDrinkEntryFromTracking,
  removeDrinksForNutritionEntry,
  syncDailyDrinkTracking,
  updateDrinkEntryInTracking,
  updateDrinkTimesForNutritionEntry,
} from './storage/drinks/drinkStorage';
import { DailyDrinkTracking, DrinkEntry, DrinkEntryInput } from './storage/drinks/drinkTypes';
import {
  addHabitEntryToTracking,
  getHabitStorage,
  removeHabitEntryFromTracking,
  syncDailyHabitTracking,
  updateHabitEntryInTracking,
} from './storage/habits/habitStorage';
import type { DailyHabitTracking, HabitEntry } from './storage/habits/habitTypes';
import { markAppleHealthConnectionCompleted } from './storage/health/appleHealthConnectionHistory';
import { type LifeStyleStorageValue, useLifeStyleStorage } from './storage/lifeStyle/useLifeStyleStorage';
import { getAllMetricEntries, syncMetricEntries } from './storage/metrics/metricStorage';
import { MetricEntry } from './storage/metrics/metricTypes';
import {
  addNutritionEntryToTracking,
  getNutritionStorage,
  removeNutritionEntryFromTracking,
  removeWeeklyNutritionTracking,
  saveWeeklyNutritionTracking,
  syncDailyNutritionTracking,
  updateNutritionEntryInTracking,
} from './storage/nutrition/nutritionStorage';
import type { DailyNutritionTracking, NutritionEntry, NutritionEntryInput, WeeklyNutritionTracking } from './storage/nutrition/nutritionTypes';
import {
  clearSupplementCustomStore,
  clearSupplementTakenDatesStore,
  getSupplementStorage,
  saveCustomSupplements,
  saveTakenDates,
} from './storage/supplements/supplementStorage';
import { mergeImportedTraining, rememberDeletedTraining } from './storage/training/trainingImport';
import {
  addTrainingEntryToTracking,
  getTrainingStorage,
  removeTrainingEntryFromTracking,
  syncDailyTrainingTracking,
  updateTrainingEntryInTracking,
} from './storage/training/trainingStorage';
import type { DailyTrainingTracking, TrainingLogEntry, TrainingLogInput } from './storage/training/trainingTypes';
import { subscribeUserProfile } from './storage/userProfile/userProfileEvents';
import {
  clearUserProfile as clearUserProfileStore,
  getUserProfile,
  saveUserProfile as saveUserProfileStore,
  updateUserProfile as updateUserProfileStore,
} from './storage/userProfile/userProfileStore';
import { UserProfile } from './storage/userProfile/userProfileTypes';
import { getXpStorage, saveLevel, saveNutritionXpClaims, saveViewedTips, saveXP, saveXpBreakdown } from './storage/xp/xpStorage';
import type { NutritionXpClaim, ViewedTip, XpBreakdown } from './storage/xp/xpTyptes';

export type ReasonSummary = {
  text: string;
  createdAt: string;
};

interface StorageContextType extends LifeStyleStorageValue {
  plans: PlansByCategory;
  setPlans: (plans: PlansByCategory | ((prev: PlansByCategory) => PlansByCategory)) => void;
  saveSupplementToPlan: (selectedPlan: Plan, supplement: SupplementPlanEntry, isEditingSupplement: boolean) => Promise<Plan | null>;
  archivedPlans: ArchivedPlansByCategory;
  clearArchivedPlans: () => Promise<void>;
  archivePlan: (category: Exclude<keyof ArchivedPlansByCategory, 'supplements'>, planId: string | undefined, tipId: string) => Promise<unknown>;
  archiveSupplementPlan: (planName: string, preferredTime: string) => Promise<unknown>;
  archiveSupplement: (supplementName: string, planName: string, preferredTime: string) => Promise<unknown>;
  hasVisitedChat: boolean;
  setHasVisitedChat: (val: boolean) => void;
  profileSharing: ProfileSharing;
  setProfileSharing: (val: ProfileSharing) => Promise<void>;
  shareInterests: boolean;
  setShareInterests: (val: boolean) => Promise<void>;
  shareArchivedPlans: boolean;
  setShareArchivedPlans: (val: boolean) => Promise<void>;
  shareHealthPlan: boolean;
  setShareHealthPlan: (val: boolean) => void;
  takenDates: Record<string, SupplementTime[]>;
  setTakenDates: (update: Record<string, SupplementTime[]> | ((prev: Record<string, SupplementTime[]>) => Record<string, SupplementTime[]>)) => void;
  customSupplements: Supplement[];
  setCustomSupplements: (updater: Supplement[] | ((prev: Supplement[]) => Supplement[])) => void;
  clearSupplementTakenDates: () => void;
  clearSupplementCustom: () => void;
  myAreas: string[];
  setMyAreas: (areas: string[] | ((prev: string[]) => string[])) => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (val: boolean) => void;
  isInitialized: boolean;
  isReadyForHealthSync: boolean;
  automaticHabitSummary: { isReady: boolean; newGoalsCount: number };
  onboardingStep: number;
  setOnboardingStep: (val: number) => void;
  myXP: number;
  setMyXP: (xp: number | ((prev: number) => number)) => void;
  clearNutritionXP: () => void;
  clearEducationXP: () => void;
  xpBreakdown?: XpBreakdown;
  myLevel: number;
  setMyLevel: (level: number) => void;
  levelUpModalVisible: boolean;
  setLevelUpModalVisible: (value: boolean) => void;
  newLevelReached: number | null;
  clearNewLevelReached: () => void;
  viewedTips: ViewedTip[];
  setViewedTips: (tips: ViewedTip[] | ((prev: ViewedTip[]) => ViewedTip[])) => void;
  claimTipReadingXP: (tipId: string, section?: TipReadingSection) => number;
  claimTipAreaXP: (tipId: string, areaId: string) => number;
  recordTipView: (tipId: string) => void;
  incrementTipChat: (areaId: string, tipId: string, questionType: string) => number;
  addChatMessageXP: (areaId: string, tipId: string) => number;
  setTipVerdict: (areaId: string, tipId: string, verdict: VerdictValue) => number;
  claimNutritionTipCompletionXP?: (input: {
    claimKey: string;
    tipId: string;
    period: NutritionTargetPeriod;
    periodKey: string;
    amount: number;
    targets: NutritionXpClaim['targets'];
  }) => number;
  nutritionXpClaims?: Record<string, NutritionXpClaim>;
  nutritionCompletions?: Record<string, NutritionXpClaim>;
  dailyNutritionTracking: DailyNutritionTracking;
  addNutritionEntry: (dateKey: string, entry: NutritionEntryInput) => NutritionEntry;
  updateNutritionEntry: (dateKey: string, entryId: string, updates: Partial<NutritionEntryInput>) => void;
  removeNutritionEntry: (dateKey: string, entryId: string) => void;
  clearDailyNutritionTracking: () => void;
  weeklyNutritionTracking: WeeklyNutritionTracking;
  dailyDrinkTracking: DailyDrinkTracking;
  addDrinkEntry: (dateKey: string, entry: DrinkEntryInput) => DrinkEntry;
  updateDrinkEntry: (dateKey: string, entryId: string, updates: Partial<DrinkEntry>) => void;
  removeDrinkEntry: (dateKey: string, entryId: string) => void;
  clearDailyDrinkTracking: () => void;
  setWeeklyNutritionTracking: (updater: WeeklyNutritionTracking | ((prev: WeeklyNutritionTracking) => WeeklyNutritionTracking)) => void;
  trainingPlanSettings: Record<string, TrainingPlanSettings>;
  setTrainingPlanSettings: (
    updater: Record<string, TrainingPlanSettings> | ((prev: Record<string, TrainingPlanSettings>) => Record<string, TrainingPlanSettings>)
  ) => void;
  dailyTrainingTracking: DailyTrainingTracking;
  upsertTrainingEntries: (entries: TrainingLogEntry[]) => void;
  addTrainingEntry: (entry: TrainingLogInput) => TrainingLogEntry;
  updateTrainingEntry: (dateKey: string, entryId: string, updates: Partial<TrainingLogInput>) => void;
  removeTrainingEntry: (dateKey: string, entryId: string) => void;
  clearDailyTrainingTracking: () => void;
  dailyHabitTracking: DailyHabitTracking;
  addHabitEntry: (dateKey: string, trackingKey: string, entry: HabitEntry) => void;
  updateHabitEntry: (dateKey: string, trackingKey: string, updates: Partial<HabitEntry>) => void;
  removeHabitEntry: (dateKey: string, trackingKey: string) => void;
  clearDailyHabitTracking: () => void;
  showMusic: boolean;
  setShowMusic: (val: boolean) => void;
  tempPlans: PlansByCategory | null;
  setTempPlans: React.Dispatch<React.SetStateAction<PlansByCategory | null>>;
  metricEntries: MetricEntry[];
  setMetricEntries: (updater: MetricEntry[] | ((prev: MetricEntry[]) => MetricEntry[])) => void;
  addMetricEntry: (entry: MetricEntry) => void;
  upsertMetricEntries: (entries: MetricEntry[]) => void;
  getMetricHistory: (metricId: MetricId) => MetricEntry[];
  clearMetricEntries: () => void;
  healthSyncEnabled: boolean;
  hasConnectedAppleHealth: boolean;
  markAppleHealthConnected: () => Promise<void>;
  hideHealthSyncPrompt: boolean;
  setHideHealthSyncPrompt: (val: boolean) => Promise<void>;
  setHealthSyncEnabled: (val: boolean) => void;
  hideBarcodeInfo: boolean;
  setHideBarcodeInfo: (val: boolean) => void;
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  saveUserProfile: (profile: UserProfile) => Promise<UserProfile>;
  clearUserProfile: () => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider = ({ children }: { children: React.ReactNode }) => {
  const lifeStyle = useLifeStyleStorage();
  const [plansState, setPlansState] = useState<PlansByCategory>(EMPTY_PLANS);
  const [archivedPlansState, setArchivedPlansState] = useState<ArchivedPlansByCategory>(EMPTY_ARCHIVED_PLANS);
  const [hasVisitedChatState, setHasVisitedChatState] = useState(false);
  const [profileSharingState, setProfileSharingState] = useState<ProfileSharing>({ ...DEFAULT_PROFILE_SHARING });
  const [shareInterestsState, setShareInterestsState] = useState(false);
  const [shareArchivedPlansState, setShareArchivedPlansState] = useState(false);
  const [shareHealthPlanState, setShareHealthPlanState] = useState(false);
  const [takenDatesState, setTakenDatesState] = useState<Record<string, SupplementTime[]>>({});
  const [customSupplementsState, setCustomSupplementsState] = useState<Supplement[]>([]);
  const [myAreasState, setMyAreasState] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCompletedOnboardingState, setHasCompletedOnboardingState] = useState(false);
  const [onboardingStepState, setOnboardingStepState] = useState(0);
  const [myXPState, setMyXPState] = useState(0);
  const [xpBreakdownState, setXpBreakdownState] = useState<XpBreakdown>({
    education: 0,
    nutrition: 0,
  });
  const [myLevelState, setMyLevelState] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [levelUpModalVisible, setLevelUpModalVisible] = useState(false);
  const [newLevelReached, setNewLevelReached] = useState<number | null>(null);
  const [dailyNutritionTrackingState, setDailyNutritionTrackingState] = useState<DailyNutritionTracking>({});
  const [weeklyNutritionTrackingState, setWeeklyNutritionTrackingState] = useState<WeeklyNutritionTracking>({});
  const [dailyDrinkTrackingState, setDailyDrinkTrackingState] = useState<DailyDrinkTracking>({});
  const [trainingPlanSettingsState, setTrainingPlanSettingsState] = useState<Record<string, TrainingPlanSettings>>({});
  const [dailyTrainingTrackingState, setDailyTrainingTrackingState] = useState<DailyTrainingTracking>({});
  const [dailyHabitTrackingState, setDailyHabitTrackingState] = useState<DailyHabitTracking>({});
  const previousAutomaticGoals = useRef<ReadonlySet<string>>(new Set());
  const [hasProcessedAutomaticHabits, setHasProcessedAutomaticHabits] = useState(false);
  const newAutomaticHabitGoals = useMemo(() => countNewAutomaticHabitGoals(dailyHabitTrackingState, previousAutomaticGoals.current), [dailyHabitTrackingState]);
  const [viewedTipsState, setViewedTipsState] = useState<ViewedTip[]>([]);
  const [showMusicState, setShowMusicState] = useState(true);
  const [tempPlans, setTempPlans] = useState<PlansByCategory | null>(null);
  const [metricEntriesState, setMetricEntriesState] = useState<MetricEntry[]>([]);
  const [hideHealthSyncPromptState, setHideHealthSyncPromptState] = useState(false);
  const [hasConnectedAppleHealthState, setHasConnectedAppleHealthState] = useState(false);
  const [healthSyncEnabledState, setHealthSyncEnabledState] = useState(false);
  const [hideBarcodeInfoState, setHideBarcodeInfoState] = useState(false);
  const [nutritionXpClaimsState, setNutritionXpClaimsState] = useState<Record<string, NutritionXpClaim>>({});
  const [userProfileState, setUserProfileState] = useState<UserProfile>({});
  const [userProfileInitialized, setUserProfileInitialized] = useState(false);

  // useEffect(() => {
  //   AsyncStorage.clear()
  //     .then(() => {
  //       console.log('AsyncStorage cleared');
  //     })
  //     .catch(console.error);
  // }, []);
  /*
   * Plans
   */

  useEffect(() => {
    const unsubscribePlans = subscribePlans(plans => {
      setPlansState(plans);
    });

    const unsubscribeArchivedPlans = subscribeArchivedPlans(archivedPlans => {
      setArchivedPlansState(archivedPlans);
    });

    return () => {
      unsubscribePlans();
      unsubscribeArchivedPlans();
    };
  }, []);

  /*
   * User profile
   */

  useEffect(() => {
    let mounted = true;

    const loadUserProfile = async () => {
      const profile = await getUserProfile();

      if (mounted) {
        setUserProfileState(profile);
        setUserProfileInitialized(true);
      }
    };

    loadUserProfile().catch(console.error);

    const unsubscribe = subscribeUserProfile(profile => {
      setUserProfileState(profile);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  /*
   * Remaining storage
   */

  useEffect(() => {
    const loadData = async () => {
      try {
        // TEMPORARY: seed habit start dates once before loading saved plans.
        //await seedHabitTestDataOnce();
        const [app, plans, supplements, nutrition, drinks, training, habits, xp, metrics] = await Promise.all([
          getAppStorage(),
          getPlanStorage(),
          getSupplementStorage(),
          getNutritionStorage(),
          getDrinkStorage(),
          getTrainingStorage(),
          getHabitStorage(),
          getXpStorage(),
          getAllMetricEntries(),
        ]);

        /*
         * App
         */

        setHasVisitedChatState(app.hasVisitedChat);

        setShareInterestsState(app.shareInterests);
        setShareArchivedPlansState(app.shareArchivedPlans);
        setShareHealthPlanState(app.shareHealthPlan);
        setProfileSharingState(app.profileSharing);

        setMyAreasState(app.myAreas);

        setHasCompletedOnboardingState(app.hasCompletedOnboarding);

        setOnboardingStepState(app.onboardingStep);

        setShowMusicState(app.showMusic);

        setHealthSyncEnabledState(app.healthSyncEnabled);
        setHasConnectedAppleHealthState(app.hasConnectedAppleHealth);
        setHideHealthSyncPromptState(app.hideHealthSyncPrompt);

        setHideBarcodeInfoState(app.hideBarcodeInfo);

        /*
         * Plans
         */
        setPlansState(plans.plans);
        setArchivedPlansState(plans.archivedPlans);
        setTrainingPlanSettingsState(plans.trainingPlanSettings);

        /*
         * Supplements
         */

        setTakenDatesState(supplements.takenDates);

        setCustomSupplementsState(supplements.customSupplements);

        /*
         * Nutrition
         */

        setDailyNutritionTrackingState(nutrition.dailyNutritionTracking);

        setWeeklyNutritionTrackingState(nutrition.weeklyNutritionTracking);

        /*
         * Drinks
         */

        setDailyDrinkTrackingState(drinks.dailyDrinkTracking);

        /*
         * Training
         */

        setDailyTrainingTrackingState(training.dailyTrainingTracking);

        /*
         * Habits
         */

        // Compare against results saved during the previous visit, before this visit's sync.
        previousAutomaticGoals.current = getAutomaticHabitGoalKeys(habits.dailyHabitTracking);
        setDailyHabitTrackingState(habits.dailyHabitTracking);

        /*
         * XP
         */

        // TEMPORARY: unlock level 10 for development. Remove this block after starting the app.
        // Save the matching XP too, so normal XP updates keep level 10 afterwards.
        // if (__DEV__) {
        //   const level10XP = levels.find(level => level.level === 10)?.requiredXP;
        //   if (level10XP !== undefined && xp.myXP < level10XP) {
        //     const addedXP = level10XP - xp.myXP;
        //     xp.myXP = level10XP;
        //     xp.xpBreakdown = { ...xp.xpBreakdown, education: (xp.xpBreakdown.education ?? 0) + addedXP };
        //     await Promise.all([saveXP(xp.myXP), saveXpBreakdown(xp.xpBreakdown)]);
        //   }
        //   xp.myLevel = levels.findLast(level => level.requiredXP <= xp.myXP)?.level ?? 10;
        //   await saveLevel(xp.myLevel);
        // }

        setMyXPState(xp.myXP);

        setXpBreakdownState(xp.xpBreakdown);

        setMyLevelState(xp.myLevel);

        setViewedTipsState(xp.viewedTips);

        setNutritionXpClaimsState(xp.nutritionXpClaims);

        /*
         * Metrics
         */

        setMetricEntriesState(metrics);
      } catch (err) {
        console.error('Kunde inte ladda storage:', err);
      } finally {
        setIsInitialized(true);
      }
    };

    loadData().catch(() => undefined);
  }, []);

  /*
   * Plans
   */

  const setPlans = useCallback((update: PlansByCategory | ((prev: PlansByCategory) => PlansByCategory)) => {
    if (typeof update === 'function') {
      updatePlans(current => update(current)).catch(() => {});

      return;
    }

    updatePlans(update).catch(() => {});
  }, []);

  const saveSupplementToPlan = useCallback(async (selectedPlan: Plan, supplement: SupplementPlanEntry, isEditingSupplement: boolean): Promise<Plan | null> => {
    try {
      return await saveSupplementToPlanStore(selectedPlan, supplement, isEditingSupplement);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte spara tillskottet.';

      setErrorMessage(message);

      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);

      return null;
    }
  }, []);

  /*
   * Supplements
   */

  const setTakenDates = (update: Record<string, SupplementTime[]> | ((prev: Record<string, SupplementTime[]>) => Record<string, SupplementTime[]>)) => {
    setTakenDatesState(prev => {
      const newDates = typeof update === 'function' ? update(prev) : update;

      saveTakenDates(newDates).catch(console.error);

      return newDates;
    });
  };

  const setCustomSupplements = (updater: Supplement[] | ((prev: Supplement[]) => Supplement[])) => {
    setCustomSupplementsState(prev => {
      const nextSupplements = typeof updater === 'function' ? updater(prev) : updater;

      saveCustomSupplements(nextSupplements).catch(console.error);

      return nextSupplements;
    });
  };

  /*
   * App settings
   */

  const setHasVisitedChat = async (val: boolean) => {
    setHasVisitedChatState(val);

    await saveHasVisitedChat(val);
  };

  const setProfileSharing = async (val: ProfileSharing) => {
    await saveProfileSharing(val);
    setProfileSharingState(val);
  };

  const setShareInterests = async (val: boolean) => {
    await saveShareInterests(val);
    setShareInterestsState(val);
  };

  const setShareArchivedPlans = async (val: boolean) => {
    await saveShareArchivedPlans(val);
    setShareArchivedPlansState(val);
  };

  const setShareHealthPlan = async (val: boolean) => {
    await saveShareHealthPlan(val);
    setShareHealthPlanState(val);
  };

  const setMyAreas = (update: string[] | ((prev: string[]) => string[])) => {
    setMyAreasState(prev => {
      const newAreas = typeof update === 'function' ? update(prev) : update;

      saveMyAreas(newAreas).catch(console.error);

      return newAreas;
    });
  };

  const setHasCompletedOnboarding = (val: boolean) => {
    setHasCompletedOnboardingState(val);

    saveHasCompletedOnboarding(val).catch(console.error);
  };

  const setOnboardingStep = (val: number) => {
    setOnboardingStepState(val);

    saveOnboardingStep(val).catch(console.error);
  };

  const setShowMusic = useCallback((val: boolean) => {
    setShowMusicState(val);

    saveShowMusic(val).catch(console.error);
  }, []);

  const setHideHealthSyncPrompt = useCallback(async (val: boolean) => {
    await saveHideHealthSyncPrompt(val);
    setHideHealthSyncPromptState(val);
  }, []);

  const markAppleHealthConnected = useCallback(async () => {
    await markAppleHealthConnectionCompleted();
    setHasConnectedAppleHealthState(true);
  }, []);

  const setHealthSyncEnabled = useCallback((val: boolean) => {
    setHealthSyncEnabledState(val);

    saveHealthSyncEnabled(val).catch(console.error);
  }, []);

  const setHideBarcodeInfo = useCallback((val: boolean) => {
    setHideBarcodeInfoState(val);

    saveHideBarcodeInfo(val).catch(console.error);
  }, []);

  /*
   * Nutrition
   */

  //private
  const setDailyNutritionTracking = useCallback((updater: DailyNutritionTracking | ((prev: DailyNutritionTracking) => DailyNutritionTracking)) => {
    setDailyNutritionTrackingState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;

      syncDailyNutritionTracking(prev, updated);

      return updated;
    });
  }, []);

  const addNutritionEntry = useCallback(
    (dateKey: string, entry: NutritionEntryInput): NutritionEntry => {
      const nextEntry: NutritionEntry = {
        ...entry,
        id: Crypto.randomUUID(),
      };

      setDailyNutritionTracking(prev => addNutritionEntryToTracking(prev, dateKey, nextEntry));

      return nextEntry;
    },
    [setDailyNutritionTracking]
  );

  const setWeeklyNutritionTracking = useCallback((updater: WeeklyNutritionTracking | ((prev: WeeklyNutritionTracking) => WeeklyNutritionTracking)) => {
    setWeeklyNutritionTrackingState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;

      const weekKeys = new Set([...Object.keys(prev), ...Object.keys(updated)]);

      weekKeys.forEach(weekKey => {
        const previousContributions = prev[weekKey];
        const updatedContributions = updated[weekKey];

        if (previousContributions === updatedContributions) {
          return;
        }

        if (!updatedContributions) {
          removeWeeklyNutritionTracking(weekKey).catch(console.error);

          return;
        }

        saveWeeklyNutritionTracking(weekKey, updatedContributions).catch(console.error);
      });

      return updated;
    });
  }, []);

  const clearDailyNutritionTracking = useCallback(() => {
    setDailyNutritionTracking({});
  }, [setDailyNutritionTracking]);

  /*
   * Drinks
   */

  //private
  const setDailyDrinkTracking = useCallback((updater: DailyDrinkTracking | ((prev: DailyDrinkTracking) => DailyDrinkTracking)) => {
    setDailyDrinkTrackingState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;

      syncDailyDrinkTracking(prev, updated);

      return updated;
    });
  }, []);

  const removeNutritionEntry = useCallback(
    (dateKey: string, entryId: string) => {
      setDailyNutritionTracking(prev => removeNutritionEntryFromTracking(prev, dateKey, entryId));
      setDailyDrinkTracking(prev => removeDrinksForNutritionEntry(prev, dateKey, entryId));
    },
    [setDailyNutritionTracking, setDailyDrinkTracking]
  );

  const updateNutritionEntry = useCallback(
    (dateKey: string, entryId: string, updates: Partial<NutritionEntryInput>) => {
      setDailyNutritionTracking(prev => updateNutritionEntryInTracking(prev, dateKey, entryId, updates));
      const recordedAt = updates.recordedAt;
      if (recordedAt !== undefined) {
        setDailyDrinkTracking(prev => updateDrinkTimesForNutritionEntry(prev, dateKey, entryId, recordedAt));
      }
    },
    [setDailyNutritionTracking, setDailyDrinkTracking]
  );

  const addDrinkEntry = useCallback(
    (dateKey: string, entry: DrinkEntryInput): DrinkEntry => {
      const nextEntry: DrinkEntry = {
        ...entry,
        id: Crypto.randomUUID(),
      };

      setDailyDrinkTracking(prev => addDrinkEntryToTracking(prev, dateKey, nextEntry));

      return nextEntry;
    },
    [setDailyDrinkTracking]
  );

  const updateDrinkEntry = useCallback(
    (dateKey: string, entryId: string, updates: Partial<DrinkEntry>) => {
      setDailyDrinkTracking(prev => updateDrinkEntryInTracking(prev, dateKey, entryId, updates));
    },
    [setDailyDrinkTracking]
  );

  const removeDrinkEntry = useCallback(
    (dateKey: string, entryId: string) => {
      setDailyDrinkTracking(prev => removeDrinkEntryFromTracking(prev, dateKey, entryId));
    },
    [setDailyDrinkTracking]
  );

  const clearDailyDrinkTracking = useCallback(() => {
    setDailyDrinkTracking({});
  }, [setDailyDrinkTracking]);

  const { syncDrinkTags, lifeStyleLoading, lifeStyleError } = lifeStyle;
  useEffect(() => {
    if (!isInitialized || !userProfileInitialized || lifeStyleLoading || lifeStyleError) return;
    syncDrinkTags(dailyDrinkTrackingState, userProfileState.bedtime).catch(console.error);
  }, [isInitialized, userProfileInitialized, lifeStyleLoading, lifeStyleError, syncDrinkTags, dailyDrinkTrackingState, userProfileState.bedtime]);

  /*
   * Training
   */

  const setTrainingPlanSettings = useCallback(
    (updater: Record<string, TrainingPlanSettings> | ((prev: Record<string, TrainingPlanSettings>) => Record<string, TrainingPlanSettings>)) => {
      setTrainingPlanSettingsState(prev => {
        const updated = typeof updater === 'function' ? updater(prev) : updater;

        saveTrainingPlanSettings(updated).catch(console.error);

        return updated;
      });
    },
    []
  );

  //private
  const setDailyTrainingTracking = useCallback((updater: DailyTrainingTracking | ((prev: DailyTrainingTracking) => DailyTrainingTracking)) => {
    setDailyTrainingTrackingState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;

      syncDailyTrainingTracking(prev, updated);

      return updated;
    });
  }, []);

  const upsertTrainingEntries = useCallback((entries: TrainingLogEntry[]) => {
    setDailyTrainingTracking(previous => mergeImportedTraining(previous, entries));
  }, [setDailyTrainingTracking]);

  const addTrainingEntry = useCallback(
    (entry: TrainingLogInput): TrainingLogEntry => {
      const nextEntry: TrainingLogEntry = {
        id: Crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...entry,
      };

      setDailyTrainingTracking(prev => addTrainingEntryToTracking(prev, nextEntry));

      return nextEntry;
    },
    [setDailyTrainingTracking]
  );

  const updateTrainingEntry = useCallback(
    (dateKey: string, entryId: string, updates: Partial<TrainingLogEntry>) => {
      setDailyTrainingTracking(prev => updateTrainingEntryInTracking(prev, dateKey, entryId, updates));
    },
    [setDailyTrainingTracking]
  );

  const removeTrainingEntry = useCallback(
    (dateKey: string, entryId: string) => {
      setDailyTrainingTracking(prev => {
        const entry = prev[dateKey]?.find(item => item.id === entryId);
        if (entry) rememberDeletedTraining(entry).catch(console.error);
        const updated = removeTrainingEntryFromTracking(prev, dateKey, entryId);
        // Retain the known empty day so legacy daily metrics do not reappear.
        return entry && !updated[dateKey] ? { ...updated, [dateKey]: [] } : updated;
      });
    },
    [setDailyTrainingTracking]
  );

  const clearDailyTrainingTracking = useCallback(() => {
    setDailyTrainingTracking(previous => {
      Object.values(previous).flat().forEach(entry => rememberDeletedTraining(entry).catch(console.error));
      return Object.fromEntries(Object.keys(previous).map(date => [date, []]));
    });
  }, [setDailyTrainingTracking]);

  /*
   * Habits
   */
  //private
  const setDailyHabitTracking = useCallback((updater: DailyHabitTracking | ((prev: DailyHabitTracking) => DailyHabitTracking)) => {
    setDailyHabitTrackingState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;

      syncDailyHabitTracking(prev, updated);

      return updated;
    });
  }, []);

  const habitProfile = useRef(userProfileState);
  const { isSyncing, hasCompletedInitialSync } = useWearable();
  useEffect(() => {
    habitProfile.current = userProfileState;
  }, [userProfileState]);
  useEffect(() => {
    if (!isInitialized || !userProfileInitialized || !hasCompletedInitialSync || isSyncing) return;
    setDailyHabitTracking(previous => storeAutomaticSleepResults(previous, metricEntriesState, plansState.other, habitProfile.current));
    setHasProcessedAutomaticHabits(true);
  }, [isInitialized, userProfileInitialized, hasCompletedInitialSync, isSyncing, metricEntriesState, plansState.other, setDailyHabitTracking]);

  useEffect(() => {
    if (!isInitialized || lifeStyle.lifeStyleLoading || lifeStyle.lifeStyleError) return;
    setDailyHabitTracking(previous => storeLifeStyleHabitResults(previous, lifeStyle.lifeStyleLog, plansState.other));
  }, [isInitialized, lifeStyle.lifeStyleLoading, lifeStyle.lifeStyleError, lifeStyle.lifeStyleLog, plansState.other, setDailyHabitTracking]);

  const addHabitEntry = useCallback(
    (dateKey: string, trackingKey: string, entry: HabitEntry) => {
      const result = prepareManualHabitResult([...plansState.other, ...plansState.nutrition], trackingKey, dateKey, entry);
      if (!result) return;
      setDailyHabitTracking(prev => addHabitEntryToTracking(prev, dateKey, trackingKey, result));
    },
    [setDailyHabitTracking, plansState.other, plansState.nutrition]
  );

  const updateHabitEntry = useCallback(
    (dateKey: string, trackingKey: string, updates: Partial<HabitEntry>) => {
      setDailyHabitTracking(prev => {
        const existing = prev[dateKey]?.[trackingKey];
        if (!existing) return prev;
        const result = prepareManualHabitResult([...plansState.other, ...plansState.nutrition], trackingKey, dateKey, { ...existing, ...updates });
        return result ? updateHabitEntryInTracking(prev, dateKey, trackingKey, result) : prev;
      });
    },
    [setDailyHabitTracking, plansState.other, plansState.nutrition]
  );

  const removeHabitEntry = useCallback(
    (dateKey: string, trackingKey: string) => {
      setDailyHabitTracking(prev => removeHabitEntryFromTracking(prev, dateKey, trackingKey));
    },
    [setDailyHabitTracking]
  );

  const clearDailyHabitTracking = useCallback(() => {
    setDailyHabitTracking({});
  }, [setDailyHabitTracking]);

  /*
   * Metrics
   */

  const setMetricEntries = useCallback((updater: MetricEntry[] | ((prev: MetricEntry[]) => MetricEntry[]), fromSync = false) => {
    setMetricEntriesState(prev => {
      const proposed = typeof updater === 'function' ? updater(prev) : updater;
      const updated = refreshRecoveryAfterMetricChanges(prev, fromSync ? proposed : protectImportedMetrics(prev, proposed));

      syncMetricEntries(prev, updated, !fromSync);

      return updated;
    });
  }, []);

  const addMetricEntry = useCallback(
    (entry: MetricEntry) => {
      setMetricEntries(prev => [...prev, { ...entry, origin: entry.origin ?? 'manual' }]);
    },
    [setMetricEntries]
  );

  const upsertMetricEntries = useCallback(
    (entries: MetricEntry[]) => {
      if (entries.length === 0) {
        return;
      }

      setMetricEntries(prev => {
        const next = reconcileSyncedMetrics(prev, entries);
        const existingIndexByKey = new Map<string, number>();
        const legacyIndexByKey = new Map<string, number>();

        next.forEach((entry, index) => {
          existingIndexByKey.set(getMetricSyncKey(entry), index);
          if (entry.provenanceVersion !== 1 && !entry.sourceRecordId && !entry.sourceId) {
            legacyIndexByKey.set(getLegacyMetricSyncKey(entry), index);
          }
        });

        entries
          .filter(entry => !isDeletedSyncedMetric(entry))
          .forEach(entry => {
            const key = getMetricSyncKey(entry);

            const legacyKey = getLegacyMetricSyncKey(entry);
            const existingIndex = existingIndexByKey.get(key) ?? (entry.provenanceVersion === 1 ? legacyIndexByKey.get(legacyKey) : undefined);

            if (existingIndex === undefined) {
              existingIndexByKey.set(key, next.length);
              next.push(entry);
              return;
            }

            existingIndexByKey.set(key, existingIndex);
            legacyIndexByKey.delete(legacyKey);
            next[existingIndex] = {
              ...next[existingIndex],
              ...entry,
            };
          });

        return next.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
      }, true);
    },
    [setMetricEntries]
  );

  const combinedMetricEntries = useMemo(
    () => [
      ...metricEntriesState.filter(entry => metricDefinitions[entry.metricId]?.source === 'metrics' || (
        entry.metricId === 'active_minutes' && dailyTrainingTrackingState[entry.recordedAt.slice(0, 10)] === undefined
      )),
      ...buildGlycemicIndexMetrics(dailyNutritionTrackingState),
      ...buildCalorieMetrics(dailyNutritionTrackingState),
      ...buildActiveMinutesMetrics(dailyTrainingTrackingState),
    ],
    [metricEntriesState, dailyNutritionTrackingState, dailyTrainingTrackingState]
  );

  const getMetricHistory = useCallback(
    (metricId: MetricId): MetricEntry[] => combinedMetricEntries.filter(entry => entry.metricId === metricId),
    [combinedMetricEntries]
  );

  const clearMetricEntries = useCallback(() => {
    setMetricEntries([]);
  }, [setMetricEntries]);

  /*
   * XP
   */

  const setMyLevel = (level: number) => {
    setMyLevelState(level);

    saveLevel(level).catch(console.error);
  };

  const clearNewLevelReached = () => {
    setNewLevelReached(null);
  };

  const setMyXP = useCallback(
    (update: number | ((prev: number) => number)) => {
      setMyXPState(prevXP => {
        const newXP = typeof update === 'function' ? update(prevXP) : update;

        const oldLevelObj = levels.findLast(level => level.requiredXP <= prevXP);

        const newLevelObj = levels.findLast(level => level.requiredXP <= newXP);

        const oldLevel = oldLevelObj?.level ?? 1;

        const newLevel = newLevelObj?.level ?? 1;

        if (newLevel > oldLevel) {
          setMyLevelState(newLevel);

          saveLevel(newLevel).catch(console.error);

          setNewLevelReached(newLevel);

          setLevelUpModalVisible(true);
        } else if (newLevel !== myLevelState) {
          setMyLevelState(newLevel);

          saveLevel(newLevel).catch(console.error);
        }

        saveXP(newXP).catch(console.error);

        return newXP;
      });
    },
    [myLevelState]
  );

  const awardXP = useCallback(
    (amount: number, source: XpSource) => {
      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }

      setXpBreakdownState(prev => {
        const next = {
          ...prev,
          [source]: (prev[source] ?? 0) + amount,
        };

        saveXpBreakdown(next).catch(console.error);

        return next;
      });

      setMyXP(prev => prev + amount);
    },
    [setMyXP]
  );

  const setViewedTips = useCallback((update: ViewedTip[] | ((prev: ViewedTip[]) => ViewedTip[])) => {
    setViewedTipsState(prev => {
      const newTips = typeof update === 'function' ? update(prev) : update;

      saveViewedTips(newTips).catch(console.error);

      return newTips;
    });
  }, []);

  const pendingAreaClaims = useRef(new Set<string>());
  useEffect(() => {
    pendingAreaClaims.current.clear();
  }, [viewedTipsState]);

  const pendingInformationClaims = useRef(new Set<string>());
  useEffect(() => {
    pendingInformationClaims.current.clear();
  }, [viewedTipsState]);

  const claimTipReadingXP = useCallback(
    (tipId: string, section: TipReadingSection = 'information'): number => {
      const existing = viewedTipsState.find(view => view.tipId === tipId);
      const readField = TIP_READING_FIELDS[section];
      const claimKey = JSON.stringify([tipId, section]);
      if (!existing || existing[readField] || pendingInformationClaims.current.has(claimKey)) return 0;
      pendingInformationClaims.current.add(claimKey);
      const amount = getTipReadingXP(section);
      setViewedTips(prev =>
        prev.map(view =>
          view.tipId === tipId
            ? {
                ...view,
                [readField]: true,
                xpEarned: view.xpEarned + amount,
              }
            : view
        )
      );
      awardXP(amount, 'education');
      return amount;
    },
    [viewedTipsState, setViewedTips, awardXP]
  );

  const claimTipAreaXP = useCallback(
    (tipId: string, areaId: string): number => {
      const existing = viewedTipsState.find(view => view.tipId === tipId);
      const claimKey = JSON.stringify([tipId, areaId]);
      if (!existing || pendingAreaClaims.current.has(claimKey)) return 0;
      const amount = getAreaViewXP(existing.viewedAreaIds ?? [], areaId);
      if (amount === 0) return 0;
      pendingAreaClaims.current.add(claimKey);
      setViewedTips(prev =>
        prev.map(view =>
          view.tipId === tipId
            ? {
                ...view,
                viewedAreaIds: [...(view.viewedAreaIds ?? []), areaId],
                xpEarned: view.xpEarned + amount,
              }
            : view
        )
      );
      awardXP(amount, 'education');
      return amount;
    },
    [viewedTipsState, setViewedTips, awardXP]
  );

  const recordTipView = useCallback(
    (tipId: string): void => {
      setViewedTips(prev => {
        if (prev.some(view => view.tipId === tipId)) return prev;
        return [
          ...prev,
          {
            tipId,
            viewedAt: new Date().toISOString(),
            askedQuestions: [],
            xpEarned: 0,
          },
        ];
      });
    },
    [setViewedTips]
  );

  const incrementTipChat = useCallback(
    (_areaId: string, tipId: string, questionType: string): number => {
      const existing = viewedTipsState.find(view => view.tipId === tipId);

      const xpForChat = getInsightQuestionXP(existing?.askedQuestions ?? [], questionType);
      if (xpForChat === 0) {
        return 0;
      }

      setViewedTips(prev =>
        prev.map(view => {
          if (view.tipId !== tipId) {
            return view;
          }

          return {
            ...view,
            askedQuestions: [...view.askedQuestions, questionType],
            xpEarned: view.xpEarned + xpForChat,
          };
        })
      );

      awardXP(xpForChat, 'education');

      return xpForChat;
    },
    [viewedTipsState, setViewedTips, awardXP]
  );

  const addChatMessageXP = useCallback(
    (_areaId: string, tipId: string): number => {
      const xpPerMessage = XP_PER_CHAT_MESSAGE;

      setViewedTips(prev =>
        prev.map(view => {
          if (view.tipId !== tipId) {
            return view;
          }

          return {
            ...view,
            xpEarned: view.xpEarned + xpPerMessage,
          };
        })
      );

      awardXP(xpPerMessage, 'education');

      return xpPerMessage;
    },
    [setViewedTips, awardXP]
  );

  const setTipVerdict = useCallback(
    (_areaId: string, tipId: string, verdict: VerdictValue): number => {
      const existing = viewedTipsState.find(view => view.tipId === tipId);

      if (existing?.verdict) {
        setViewedTips(prev =>
          prev.map(view =>
            view.tipId === tipId
              ? {
                  ...view,
                  verdict,
                }
              : view
          )
        );

        return 0;
      }

      const xpForVerdict = XP_FOR_VERDICT;

      setViewedTips(prev =>
        prev.map(view =>
          view.tipId === tipId
            ? {
                ...view,
                verdict,
                xpEarned: view.xpEarned + xpForVerdict,
              }
            : view
        )
      );

      awardXP(xpForVerdict, 'education');

      return xpForVerdict;
    },
    [viewedTipsState, setViewedTips, awardXP]
  );

  const claimNutritionTipCompletionXP = useCallback(
    (input: {
      claimKey: string;
      tipId: string;
      period: NutritionTargetPeriod;
      periodKey: string;
      amount: number;
      targets: NutritionXpClaim['targets'];
    }): number => {
      const { claimKey, tipId, period, periodKey, amount, targets } = input;

      if (!claimKey || !Number.isFinite(amount) || amount <= 0) {
        return 0;
      }

      const inputSignature = getNutritionInputSignature(period, periodKey, {
        dailyNutritionTracking: dailyNutritionTrackingState,
        dailyHabitTracking: dailyHabitTrackingState,
        weeklyNutritionTracking: weeklyNutritionTrackingState,
        takenDates: takenDatesState,
      });
      const existingClaim = nutritionXpClaimsState[claimKey];
      if (existingClaim?.inputSignature === inputSignature) return 0;

      setNutritionXpClaimsState(prev => {
        if (prev[claimKey]?.inputSignature === inputSignature) return prev;

        const next: Record<string, NutritionXpClaim> = {
          ...prev,

          [claimKey]: {
            xp: prev[claimKey]?.xp ?? amount,
            awardedAt: prev[claimKey]?.awardedAt ?? new Date().toISOString(),
            inputSignature,
            period,
            periodKey,
            tipId,
            targets: targets.map(target => ({ ...target })),
          },
        };

        saveNutritionXpClaims(next).catch(console.error);

        return next;
      });

      if (existingClaim) return 0;
      awardXP(amount, 'nutrition');

      return amount;
    },
    [awardXP, nutritionXpClaimsState, dailyNutritionTrackingState, dailyHabitTrackingState, weeklyNutritionTrackingState, takenDatesState]
  );

  const clearNutritionXP = useCallback(() => {
    const nutritionXP = xpBreakdownState.nutrition;

    setNutritionXpClaimsState({});

    saveNutritionXpClaims({}).catch(console.error);

    setXpBreakdownState(prev => {
      const next = {
        ...prev,
        nutrition: 0,
      };

      saveXpBreakdown(next).catch(console.error);

      return next;
    });

    if (nutritionXP > 0) {
      setMyXP(prev => Math.max(0, prev - nutritionXP));
    }
  }, [setMyXP, xpBreakdownState.nutrition]);

  const clearEducationXP = useCallback(() => {
    const educationXP = xpBreakdownState.education;

    setXpBreakdownState(prev => {
      const next = {
        ...prev,
        education: 0,
      };

      saveXpBreakdown(next).catch(console.error);

      return next;
    });

    if (educationXP > 0) {
      setMyXP(prev => Math.max(0, prev - educationXP));
    }
  }, [setMyXP, xpBreakdownState.education]);

  /*
   * User profile
   */

  const saveUserProfile = useCallback(async (profile: UserProfile) => {
    return saveUserProfileStore(profile);
  }, []);

  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    return updateUserProfileStore(updates);
  }, []);

  const clearUserProfile = useCallback(async () => {
    await clearUserProfileStore();
  }, []);

  const clearSupplementTakenDates = useCallback(async () => {
    await clearSupplementTakenDatesStore();
  }, []);

  const clearSupplementCustom = useCallback(async () => {
    await clearSupplementCustomStore();
  }, []);

  const value = useMemo<StorageContextType>(
    () => ({
      ...lifeStyle,
      plans: plansState,
      setPlans,
      saveSupplementToPlan,
      archivedPlans: archivedPlansState,
      clearArchivedPlans,
      archivePlan,
      archiveSupplementPlan,
      archiveSupplement,
      hasVisitedChat: hasVisitedChatState,
      setHasVisitedChat,
      profileSharing: profileSharingState,
      setProfileSharing,
      shareInterests: shareInterestsState,
      setShareInterests,
      shareArchivedPlans: shareArchivedPlansState,
      setShareArchivedPlans,
      shareHealthPlan: shareHealthPlanState,
      setShareHealthPlan,
      takenDates: takenDatesState,
      setTakenDates,
      customSupplements: customSupplementsState,
      setCustomSupplements,
      clearSupplementTakenDates,
      clearSupplementCustom,
      myAreas: myAreasState,
      setMyAreas,
      errorMessage,
      setErrorMessage,
      hasCompletedOnboarding: hasCompletedOnboardingState,
      setHasCompletedOnboarding,
      isInitialized,
      isReadyForHealthSync: isInitialized && userProfileInitialized,
      automaticHabitSummary: {
        isReady: hasProcessedAutomaticHabits && hasCompletedInitialSync && !isSyncing,
        newGoalsCount: newAutomaticHabitGoals,
      },
      onboardingStep: onboardingStepState,
      setOnboardingStep,
      myXP: isMaxXpPreviewEnabled() ? Math.max(myXPState, levels.at(-1)?.requiredXP ?? myXPState) : myXPState,
      setMyXP,
      clearNutritionXP,
      clearEducationXP,
      xpBreakdown: xpBreakdownState,
      myLevel: isMaxXpPreviewEnabled() ? (levels.at(-1)?.level ?? myLevelState) : myLevelState,
      setMyLevel,
      levelUpModalVisible,
      setLevelUpModalVisible,
      newLevelReached,
      clearNewLevelReached,
      viewedTips: viewedTipsState,
      setViewedTips,
      claimTipReadingXP,
      claimTipAreaXP,
      recordTipView,
      incrementTipChat,
      addChatMessageXP,
      setTipVerdict,
      claimNutritionTipCompletionXP,
      nutritionXpClaims: nutritionXpClaimsState,
      nutritionCompletions: getCurrentNutritionCompletions(nutritionXpClaimsState, {
        dailyNutritionTracking: dailyNutritionTrackingState,
        dailyHabitTracking: dailyHabitTrackingState,
        weeklyNutritionTracking: weeklyNutritionTrackingState,
        takenDates: takenDatesState,
      }),
      dailyNutritionTracking: dailyNutritionTrackingState,
      addNutritionEntry,
      updateNutritionEntry,
      removeNutritionEntry,
      clearDailyNutritionTracking,
      weeklyNutritionTracking: weeklyNutritionTrackingState,
      setWeeklyNutritionTracking,
      dailyDrinkTracking: dailyDrinkTrackingState,
      addDrinkEntry,
      updateDrinkEntry,
      removeDrinkEntry,
      clearDailyDrinkTracking,
      trainingPlanSettings: trainingPlanSettingsState,
      setTrainingPlanSettings,
      dailyTrainingTracking: dailyTrainingTrackingState,
      upsertTrainingEntries,
      addTrainingEntry,
      updateTrainingEntry,
      removeTrainingEntry,
      clearDailyTrainingTracking,
      dailyHabitTracking: dailyHabitTrackingState,
      addHabitEntry,
      updateHabitEntry,
      removeHabitEntry,
      clearDailyHabitTracking,
      showMusic: showMusicState,
      setShowMusic,
      tempPlans,
      setTempPlans,
      metricEntries: combinedMetricEntries,
      setMetricEntries,
      addMetricEntry,
      upsertMetricEntries,
      clearMetricEntries,
      getMetricHistory,
      healthSyncEnabled: healthSyncEnabledState,
      hasConnectedAppleHealth: hasConnectedAppleHealthState,
      markAppleHealthConnected,
      hideHealthSyncPrompt: hideHealthSyncPromptState,
      setHideHealthSyncPrompt,
      setHealthSyncEnabled,
      hideBarcodeInfo: hideBarcodeInfoState,
      setHideBarcodeInfo,
      userProfile: userProfileState,
      saveUserProfile,
      updateUserProfile,
      clearUserProfile,
    }),
    // prettier-ignore
    [lifeStyle, plansState, setPlans, saveSupplementToPlan, archivedPlansState, hasVisitedChatState, shareInterestsState, shareArchivedPlansState, shareHealthPlanState, profileSharingState, takenDatesState, customSupplementsState, clearSupplementTakenDates, clearSupplementCustom, myAreasState, errorMessage, hasCompletedOnboardingState, onboardingStepState, isInitialized, userProfileInitialized, hasProcessedAutomaticHabits, hasCompletedInitialSync, isSyncing, newAutomaticHabitGoals, myXPState, setMyXP, clearNutritionXP, clearEducationXP, xpBreakdownState, myLevelState, levelUpModalVisible, newLevelReached, viewedTipsState, setViewedTips, claimTipReadingXP, claimTipAreaXP, recordTipView, incrementTipChat, addChatMessageXP, setTipVerdict, claimNutritionTipCompletionXP, nutritionXpClaimsState,
      dailyNutritionTrackingState, addNutritionEntry, updateNutritionEntry, removeNutritionEntry, clearDailyNutritionTracking, weeklyNutritionTrackingState, setWeeklyNutritionTracking, dailyDrinkTrackingState, addDrinkEntry, updateDrinkEntry, removeDrinkEntry, clearDailyDrinkTracking, trainingPlanSettingsState, setTrainingPlanSettings, dailyTrainingTrackingState, upsertTrainingEntries, addTrainingEntry, updateTrainingEntry, removeTrainingEntry, clearDailyTrainingTracking, dailyHabitTrackingState, addHabitEntry, updateHabitEntry, removeHabitEntry, clearDailyHabitTracking, showMusicState, setShowMusic, tempPlans, setTempPlans, combinedMetricEntries, addMetricEntry, upsertMetricEntries, setMetricEntries, getMetricHistory, clearMetricEntries, healthSyncEnabledState, setHealthSyncEnabled, hasConnectedAppleHealthState, markAppleHealthConnected, hideHealthSyncPromptState, setHideHealthSyncPrompt, hideBarcodeInfoState, setHideBarcodeInfo, userProfileState, saveUserProfile, updateUserProfile, clearUserProfile]
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
};

export const useStorage = (): StorageContextType => {
  const context = useContext(StorageContext);

  if (!context) {
    throw new Error('useStorage måste användas inom en <StorageProvider>');
  }

  return context;
};
