import * as Crypto from 'expo-crypto';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { subscribeArchivedPlans, subscribePlans } from '@/app/context/storage/plans/planEvents';
import { getArchivedPlans, getPlans } from '@/app/context/storage/plans/planStorage';
import {
  archivePlan,
  archiveSupplement,
  archiveSupplementPlan,
  clearArchivedPlans,
  saveSupplementToPlan as saveSupplementToPlanStore,
  updatePlans,
} from '@/app/context/storage/plans/planStore';
import { type ArchivedPlansByCategory, EMPTY_ARCHIVED_PLANS, EMPTY_PLANS, type PlansByCategory } from '@/app/context/storage/plans/planTypes';
import { levels, XP_FOR_CHAT_QUESTION, XP_FOR_VERDICT, XP_FOR_VIEW, XP_PER_CHAT_MESSAGE, type XpSource } from '@/constants/XP';
import { MetricId } from '@/locales/metrics';
import { type NutritionTargetPeriod } from '@/types/nutritionTargets';
import { VerdictValue } from '@/types/verdict';

import { Plan } from '../domain/Plan';
import { type Supplement } from '../domain/Supplement';
import { SupplementPlanEntry } from '../domain/SupplementPlanEntry';
import { SupplementTime } from '../domain/SupplementTime';
import {
  getAppStorage,
  saveHasCompletedOnboarding,
  saveHasVisitedChat,
  saveHealthSyncEnabled,
  saveMyAreas,
  saveOnboardingStep,
  saveShareHealthPlan,
  saveShowMusic,
} from './storage/app/appStorage';
import { getDrinkStorage, saveDailyDrinkTracking } from './storage/drinks/drinkStorage';
import { DailyDrinkTracking } from './storage/drinks/drinkTypes';
import { getHabitStorage, saveDailyHabitTracking } from './storage/habits/habitStorage';
import type { DailyHabitTracking } from './storage/habits/habitTypes';
import { getMetricEntries, saveMetricEntries } from './storage/metrics/metricStorage';
import { MetricEntry } from './storage/metrics/metricTypes';
import { getNutritionStorage, saveDailyNutritionTracking, saveWeeklyNutritionTracking } from './storage/nutrition/nutritionStorage';
import type { DailyNutritionTracking, WeeklyNutritionTracking } from './storage/nutrition/nutritionTypes';
import { getSupplementStorage, saveCustomSupplements, saveTakenDates } from './storage/supplements/supplementStorage';
import { getTrainingStorage, saveDailyTrainingTracking, saveTrainingPlanSettings } from './storage/training/trainingStorage';
import type { DailyTrainingTracking, TrainingLogEntry, TrainingLogInput, TrainingPlanSettings } from './storage/training/trainingTypes';
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

interface StorageContextType {
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
  shareHealthPlan: boolean;
  setShareHealthPlan: (val: boolean) => void;
  takenDates: Record<string, SupplementTime[]>;
  setTakenDates: (update: Record<string, SupplementTime[]> | ((prev: Record<string, SupplementTime[]>) => Record<string, SupplementTime[]>)) => void;
  customSupplements: Supplement[];
  setCustomSupplements: (updater: Supplement[] | ((prev: Supplement[]) => Supplement[])) => void;
  myAreas: string[];
  setMyAreas: (areas: string[] | ((prev: string[]) => string[])) => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (val: boolean) => void;
  isInitialized: boolean;
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
  addTipView: (areaId: string, tipId: string) => number;
  incrementTipChat: (areaId: string, tipId: string, questionType: string) => number;
  addChatMessageXP: (areaId: string, tipId: string) => number;
  setTipVerdict: (areaId: string, tipId: string, verdict: VerdictValue) => number;
  claimNutritionTipCompletionXP?: (input: { claimKey: string; tipId: string; period: NutritionTargetPeriod; periodKey: string; amount: number }) => number;
  nutritionXpClaims?: Record<string, NutritionXpClaim>;
  dailyNutritionTracking: DailyNutritionTracking;
  setDailyNutritionTracking: (updater: DailyNutritionTracking | ((prev: DailyNutritionTracking) => DailyNutritionTracking)) => void;
  weeklyNutritionTracking: WeeklyNutritionTracking;
  dailyDrinkTracking: DailyDrinkTracking;
  setDailyDrinkTracking: (updater: DailyDrinkTracking | ((prev: DailyDrinkTracking) => DailyDrinkTracking)) => void;
  setWeeklyNutritionTracking: (updater: WeeklyNutritionTracking | ((prev: WeeklyNutritionTracking) => WeeklyNutritionTracking)) => void;
  trainingPlanSettings: Record<string, TrainingPlanSettings>;
  setTrainingPlanSettings: (
    updater: Record<string, TrainingPlanSettings> | ((prev: Record<string, TrainingPlanSettings>) => Record<string, TrainingPlanSettings>)
  ) => void;
  dailyTrainingTracking: DailyTrainingTracking;
  setDailyTrainingTracking: (updater: DailyTrainingTracking | ((prev: DailyTrainingTracking) => DailyTrainingTracking)) => void;
  addTrainingEntry: (entry: TrainingLogInput) => TrainingLogEntry;
  dailyHabitTracking: DailyHabitTracking;
  setDailyHabitTracking: (updater: DailyHabitTracking | ((prev: DailyHabitTracking) => DailyHabitTracking)) => void;
  showMusic: boolean;
  setShowMusic: (val: boolean) => void;
  tempPlans: PlansByCategory | null;
  setTempPlans: React.Dispatch<React.SetStateAction<PlansByCategory | null>>;
  metricEntries: MetricEntry[];
  setMetricEntries: (updater: MetricEntry[] | ((prev: MetricEntry[]) => MetricEntry[])) => void;
  addMetricEntry: (entry: MetricEntry) => void;
  upsertMetricEntries: (entries: MetricEntry[]) => void;
  getMetricHistory: (metricId: MetricId) => MetricEntry[];
  healthSyncEnabled: boolean;
  setHealthSyncEnabled: (val: boolean) => void;
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  saveUserProfile: (profile: UserProfile) => Promise<UserProfile>;
  clearUserProfile: () => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider = ({ children }: { children: React.ReactNode }) => {
  const [plansState, setPlansState] = useState<PlansByCategory>(EMPTY_PLANS);
  const [archivedPlansState, setArchivedPlansState] = useState<ArchivedPlansByCategory>(EMPTY_ARCHIVED_PLANS);
  const [hasVisitedChatState, setHasVisitedChatState] = useState(false);
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
  const [viewedTipsState, setViewedTipsState] = useState<ViewedTip[]>([]);
  const [showMusicState, setShowMusicState] = useState(true);
  const [tempPlans, setTempPlans] = useState<PlansByCategory | null>(null);
  const [metricEntriesState, setMetricEntriesState] = useState<MetricEntry[]>([]);
  const [healthSyncEnabledState, setHealthSyncEnabledState] = useState(false);
  const [nutritionXpClaimsState, setNutritionXpClaimsState] = useState<Record<string, NutritionXpClaim>>({});
  const [userProfileState, setUserProfileState] = useState<UserProfile>({});

  /*
   * Plans
   */

  useEffect(() => {
    let mounted = true;

    const loadPlans = async () => {
      const [plans, archivedPlans] = await Promise.all([getPlans(), getArchivedPlans()]);

      if (!mounted) {
        return;
      }

      setPlansState(plans);
      setArchivedPlansState(archivedPlans);
    };

    loadPlans();

    const unsubscribePlans = subscribePlans(plans => {
      setPlansState(plans);
    });

    const unsubscribeArchivedPlans = subscribeArchivedPlans(archivedPlans => {
      setArchivedPlansState(archivedPlans);
    });

    return () => {
      mounted = false;

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
      }
    };

    loadUserProfile();

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
        const [app, supplements, nutrition, drinks, training, habits, xp, metrics] = await Promise.all([
          getAppStorage(),
          getSupplementStorage(),
          getNutritionStorage(),
          getDrinkStorage(),
          getTrainingStorage(),
          getHabitStorage(),
          getXpStorage(),
          getMetricEntries(),
        ]);

        /*
         * App
         */

        setHasVisitedChatState(app.hasVisitedChat);

        setShareHealthPlanState(app.shareHealthPlan);

        setMyAreasState(app.myAreas);

        setHasCompletedOnboardingState(app.hasCompletedOnboarding);

        setOnboardingStepState(app.onboardingStep);

        setShowMusicState(app.showMusic);

        setHealthSyncEnabledState(app.healthSyncEnabled);

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

        setTrainingPlanSettingsState(training.trainingPlanSettings);

        setDailyTrainingTrackingState(training.dailyTrainingTracking);

        /*
         * Habits
         */

        setDailyHabitTrackingState(habits.dailyHabitTracking);

        /*
         * XP
         */

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

    loadData();
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

      saveTakenDates(newDates);

      return newDates;
    });
  };

  const setCustomSupplements = (updater: Supplement[] | ((prev: Supplement[]) => Supplement[])) => {
    setCustomSupplementsState(prev => {
      const nextSupplements = typeof updater === 'function' ? updater(prev) : updater;

      saveCustomSupplements(nextSupplements);

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

  const setShareHealthPlan = async (val: boolean) => {
    setShareHealthPlanState(val);

    await saveShareHealthPlan(val);
  };

  const setMyAreas = (update: string[] | ((prev: string[]) => string[])) => {
    setMyAreasState(prev => {
      const newAreas = typeof update === 'function' ? update(prev) : update;

      saveMyAreas(newAreas);

      return newAreas;
    });
  };

  const setHasCompletedOnboarding = (val: boolean) => {
    setHasCompletedOnboardingState(val);

    saveHasCompletedOnboarding(val);
  };

  const setOnboardingStep = (val: number) => {
    setOnboardingStepState(val);

    saveOnboardingStep(val);
  };

  const setShowMusic = (val: boolean) => {
    setShowMusicState(val);

    saveShowMusic(val);
  };

  const setHealthSyncEnabled = useCallback((val: boolean) => {
    setHealthSyncEnabledState(val);

    saveHealthSyncEnabled(val);
  }, []);

  /*
   * Nutrition
   */

  const setDailyNutritionTracking = useCallback((updater: DailyNutritionTracking | ((prev: DailyNutritionTracking) => DailyNutritionTracking)) => {
    setDailyNutritionTrackingState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;

      saveDailyNutritionTracking(updated);

      return updated;
    });
  }, []);

  const setWeeklyNutritionTracking = useCallback((updater: WeeklyNutritionTracking | ((prev: WeeklyNutritionTracking) => WeeklyNutritionTracking)) => {
    setWeeklyNutritionTrackingState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;

      saveWeeklyNutritionTracking(updated);

      return updated;
    });
  }, []);

  /*
   * Drinks
   */

  const setDailyDrinkTracking = useCallback((updater: DailyDrinkTracking | ((prev: DailyDrinkTracking) => DailyDrinkTracking)) => {
    setDailyDrinkTrackingState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;

      saveDailyDrinkTracking(updated);

      return updated;
    });
  }, []);

  /*
   * Training
   */

  const setTrainingPlanSettings = useCallback(
    (updater: Record<string, TrainingPlanSettings> | ((prev: Record<string, TrainingPlanSettings>) => Record<string, TrainingPlanSettings>)) => {
      setTrainingPlanSettingsState(prev => {
        const updated = typeof updater === 'function' ? updater(prev) : updater;

        saveTrainingPlanSettings(updated);

        return updated;
      });
    },
    []
  );

  const setDailyTrainingTracking = useCallback((updater: DailyTrainingTracking | ((prev: DailyTrainingTracking) => DailyTrainingTracking)) => {
    setDailyTrainingTrackingState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;

      saveDailyTrainingTracking(updated);

      return updated;
    });
  }, []);

  const addTrainingEntry = useCallback(
    (entry: TrainingLogInput): TrainingLogEntry => {
      const nextEntry: TrainingLogEntry = {
        id: Crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...entry,
      };

      setDailyTrainingTracking(prev => ({
        ...prev,
        [entry.date]: [...(prev[entry.date] ?? []), nextEntry],
      }));

      return nextEntry;
    },
    [setDailyTrainingTracking]
  );

  /*
   * Habits
   */

  const setDailyHabitTracking = useCallback((updater: DailyHabitTracking | ((prev: DailyHabitTracking) => DailyHabitTracking)) => {
    setDailyHabitTrackingState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;

      saveDailyHabitTracking(updated);

      return updated;
    });
  }, []);

  /*
   * Metrics
   */

  const setMetricEntries = (updater: MetricEntry[] | ((prev: MetricEntry[]) => MetricEntry[])) => {
    setMetricEntriesState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;

      saveMetricEntries(updated);

      return updated;
    });
  };

  const addMetricEntry = useCallback((entry: MetricEntry) => {
    setMetricEntries(prev => [...prev, entry]);
  }, []);

  const upsertMetricEntries = useCallback((entries: MetricEntry[]) => {
    if (entries.length === 0) {
      return;
    }
    setMetricEntries(prev => {
      const next = [...prev];
      const existingIndexByKey = new Map<string, number>();
      next.forEach((entry, index) => {
        existingIndexByKey.set(`${entry.metricId}|${entry.recordedAt}`, index);
      });
      entries.forEach(entry => {
        const key = `${entry.metricId}|${entry.recordedAt}`;
        const existingIndex = existingIndexByKey.get(key);
        if (existingIndex === undefined) {
          existingIndexByKey.set(key, next.length);
          next.push(entry);
          return;
        }
        next[existingIndex] = {
          ...next[existingIndex],
          ...entry,
        };
      });
      return next.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
    });
  }, []);

  const getMetricHistory = useCallback(
    (metricId: MetricId): MetricEntry[] => {
      return metricEntriesState.filter(entry => entry.metricId === metricId);
    },
    [metricEntriesState]
  );

  /*
   * XP
   */

  const setMyLevel = (level: number) => {
    setMyLevelState(level);

    saveLevel(level);
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

          saveLevel(newLevel);

          setNewLevelReached(newLevel);

          setLevelUpModalVisible(true);
        } else if (newLevel !== myLevelState) {
          setMyLevelState(newLevel);

          saveLevel(newLevel);
        }

        saveXP(newXP);

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

        saveXpBreakdown(next);

        return next;
      });

      setMyXP(prev => prev + amount);
    },
    [setMyXP]
  );

  const setViewedTips = useCallback((update: ViewedTip[] | ((prev: ViewedTip[]) => ViewedTip[])) => {
    setViewedTipsState(prev => {
      const newTips = typeof update === 'function' ? update(prev) : update;

      saveViewedTips(newTips);

      return newTips;
    });
  }, []);

  const addTipView = useCallback(
    (_areaId: string, tipId: string): number => {
      const hasExistingTip = viewedTipsState.some(view => view.tipId === tipId);

      if (hasExistingTip) {
        return 0;
      }

      const xpForView = XP_FOR_VIEW;

      const newView: ViewedTip = {
        tipId,
        viewedAt: new Date().toISOString(),
        askedQuestions: [],
        xpEarned: xpForView,
      };

      setViewedTips(prev => [...prev, newView]);

      awardXP(xpForView, 'education');

      return xpForView;
    },
    [viewedTipsState, setViewedTips, awardXP]
  );

  const incrementTipChat = useCallback(
    (_areaId: string, tipId: string, questionType: string): number => {
      const existing = viewedTipsState.find(view => view.tipId === tipId);

      if (existing?.askedQuestions.includes(questionType)) {
        return 0;
      }

      const xpForChat = XP_FOR_CHAT_QUESTION;

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
    (input: { claimKey: string; tipId: string; period: NutritionTargetPeriod; periodKey: string; amount: number }): number => {
      const { claimKey, tipId, period, periodKey, amount } = input;

      if (!claimKey || !Number.isFinite(amount) || amount <= 0) {
        return 0;
      }

      if (nutritionXpClaimsState[claimKey]) {
        return 0;
      }

      setNutritionXpClaimsState(prev => {
        if (prev[claimKey]) {
          return prev;
        }

        const next: Record<string, NutritionXpClaim> = {
          ...prev,

          [claimKey]: {
            xp: amount,
            awardedAt: new Date().toISOString(),
            period,
            periodKey,
            tipId,
          },
        };

        saveNutritionXpClaims(next);

        return next;
      });

      awardXP(amount, 'nutrition');

      return amount;
    },
    [awardXP, nutritionXpClaimsState]
  );

  const clearNutritionXP = useCallback(() => {
    const nutritionXP = xpBreakdownState.nutrition;

    setNutritionXpClaimsState({});

    saveNutritionXpClaims({});

    setXpBreakdownState(prev => {
      const next = {
        ...prev,
        nutrition: 0,
      };

      saveXpBreakdown(next);

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

      saveXpBreakdown(next);

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

  const value = useMemo<StorageContextType>(
    () => ({
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
      shareHealthPlan: shareHealthPlanState,
      setShareHealthPlan,
      takenDates: takenDatesState,
      setTakenDates,
      customSupplements: customSupplementsState,
      setCustomSupplements,
      myAreas: myAreasState,
      setMyAreas,
      errorMessage,
      setErrorMessage,
      hasCompletedOnboarding: hasCompletedOnboardingState,
      setHasCompletedOnboarding,
      isInitialized,
      onboardingStep: onboardingStepState,
      setOnboardingStep,
      myXP: myXPState,
      setMyXP,
      clearNutritionXP,
      clearEducationXP,
      xpBreakdown: xpBreakdownState,
      myLevel: myLevelState,
      setMyLevel,
      levelUpModalVisible,
      setLevelUpModalVisible,
      newLevelReached,
      clearNewLevelReached,
      viewedTips: viewedTipsState,
      setViewedTips,
      addTipView,
      incrementTipChat,
      addChatMessageXP,
      setTipVerdict,
      claimNutritionTipCompletionXP,
      nutritionXpClaims: nutritionXpClaimsState,
      dailyNutritionTracking: dailyNutritionTrackingState,
      setDailyNutritionTracking,
      weeklyNutritionTracking: weeklyNutritionTrackingState,
      setWeeklyNutritionTracking,
      dailyDrinkTracking: dailyDrinkTrackingState,
      setDailyDrinkTracking,
      trainingPlanSettings: trainingPlanSettingsState,
      setTrainingPlanSettings,
      dailyTrainingTracking: dailyTrainingTrackingState,
      setDailyTrainingTracking,
      addTrainingEntry,
      dailyHabitTracking: dailyHabitTrackingState,
      setDailyHabitTracking,
      showMusic: showMusicState,
      setShowMusic,
      tempPlans,
      setTempPlans,
      metricEntries: metricEntriesState,
      setMetricEntries,
      addMetricEntry,
      upsertMetricEntries,
      getMetricHistory,
      healthSyncEnabled: healthSyncEnabledState,
      setHealthSyncEnabled,
      userProfile: userProfileState,
      saveUserProfile,
      updateUserProfile,
      clearUserProfile,
    }),
    // prettier-ignore
    [plansState, setPlans, saveSupplementToPlan, archivedPlansState, hasVisitedChatState, shareHealthPlanState, takenDatesState, customSupplementsState, myAreasState, errorMessage, hasCompletedOnboardingState, onboardingStepState, isInitialized, myXPState, setMyXP, clearNutritionXP, clearEducationXP, xpBreakdownState, myLevelState, levelUpModalVisible, newLevelReached, viewedTipsState, setViewedTips, addTipView, incrementTipChat, addChatMessageXP, setTipVerdict, claimNutritionTipCompletionXP, nutritionXpClaimsState, 
      dailyNutritionTrackingState, setDailyNutritionTracking, weeklyNutritionTrackingState, setWeeklyNutritionTracking, dailyDrinkTrackingState, setDailyDrinkTracking, trainingPlanSettingsState, setTrainingPlanSettings, dailyTrainingTrackingState, setDailyTrainingTracking, addTrainingEntry, dailyHabitTrackingState, setDailyHabitTracking, showMusicState, setShowMusic, tempPlans, setTempPlans, metricEntriesState, addMetricEntry, upsertMetricEntries, getMetricHistory, healthSyncEnabledState, setHealthSyncEnabled, userProfileState, saveUserProfile, updateUserProfile, clearUserProfile]
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
