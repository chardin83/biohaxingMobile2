import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { levels, XP_FOR_CHAT_QUESTION, XP_FOR_VERDICT, XP_FOR_VIEW, XP_PER_CHAT_MESSAGE } from '@/constants/XP';
import { PlanCategory } from '@/types/planCategory';
import { VerdictValue } from '@/types/verdict';

import { Plan } from '../domain/Plan';
import { SupplementTime } from '../domain/SupplementTime';

export type MealNutrition = {
  date: string; // YYYY-MM-DD
  protein: number;
  calories: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
};

export type DailyNutritionSummary = {
  date: string;
  meals: MealNutrition[];
  totals: {
    protein: number;
    calories: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
  };
  goalsMet: {
    protein: boolean;
    calories: boolean;
    carbohydrates: boolean;
    fat: boolean;
    fiber: boolean;
  };
};

// PlanCategory is shared from types/planCategory.ts

export type PlanTipEntry = {
  startedAt: string;
  tipId: string;
  planCategory: Exclude<PlanCategory, 'supplement'>;
};

export type PlansByCategory = {
  supplements: Plan[];
  training: PlanTipEntry[];
  nutrition: PlanTipEntry[];
  other: PlanTipEntry[];
};

const EMPTY_PLANS: PlansByCategory = {
  supplements: [],
  training: [],
  nutrition: [],
  other: [],
};

export type TrainingPlanSettings = {
  sessionsPerWeek?: number;
  sessionDurationMinutes?: number;
};

export interface ViewedTip {
  mainGoalId: string;
  tipId: string;
  viewedAt: string;
  askedQuestions: string[]; // Array av frågor som ställts: ["studies", "experts", "risks"]
  xpEarned: number;
  verdict?: VerdictValue; // Uppdaterad för att använda VerdictValue
}

interface StorageContextType {
  plans: PlansByCategory;
  setPlans: (plans: PlansByCategory | ((prev: PlansByCategory) => PlansByCategory)) => void;
  activeGoals: PlanTipEntry[];
  hasVisitedChat: boolean;
  setHasVisitedChat: (val: boolean) => void;
  shareHealthPlan: boolean;
  setShareHealthPlan: (val: boolean) => void;
  takenDates: Record<string, SupplementTime[]>;
  setTakenDates: (
    update:
      | Record<string, SupplementTime[]>
      | ((prev: Record<string, SupplementTime[]>) => Record<string, SupplementTime[]>)
  ) => void;
  myGoals: string[];
  setMyGoals: (goals: string[] | ((prev: string[]) => string[])) => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (val: boolean) => void;
  isInitialized: boolean;
  onboardingStep: number;
  setOnboardingStep: (val: number) => void;
  myXP: number;
  setMyXP: (xp: number | ((prev: number) => number)) => void;
  myLevel: number;
  setMyLevel: (level: number) => void;
  levelUpModalVisible: boolean;
  setLevelUpModalVisible: (v: boolean) => void;
  newLevelReached: number | null;
  clearNewLevelReached: () => void;
  dailyNutritionSummaries: Record<string, DailyNutritionSummary>;
  setDailyNutritionSummaries: (
    updater:
      | Record<string, DailyNutritionSummary>
      | ((prev: Record<string, DailyNutritionSummary>) => Record<string, DailyNutritionSummary>)
  ) => void;
  viewedTips: ViewedTip[];
  setViewedTips: (tips: ViewedTip[] | ((prev: ViewedTip[]) => ViewedTip[])) => void;
  addTipView: (mainGoalId: string, tipId: string) => number;
  incrementTipChat: (mainGoalId: string, tipId: string, questionType: string) => number;
  addChatMessageXP: (mainGoalId: string, tipId: string) => number;
  setTipVerdict: (mainGoalId: string, tipId: string, verdict: VerdictValue) => number;
  trainingPlanSettings: Record<string, TrainingPlanSettings>;
  setTrainingPlanSettings: (
    updater:
      | Record<string, TrainingPlanSettings>
      | ((prev: Record<string, TrainingPlanSettings>) => Record<string, TrainingPlanSettings>)
  ) => void;
  showMusic: boolean;
  setShowMusic: (val: boolean) => void;
}

const STORAGE_KEYS = {
  PLANS: 'plans',
  HAS_VISITED_CHAT: 'hasVisitedChat',
  SHARE_HEALTH_PLAN: 'shareHealthPlan',
  TAKEN_DATES: 'takenDates',
  MY_GOALS: 'myGoals',
  HAS_COMPLETED_ONBOARDING: 'hasCompletedOnboarding',
  ONBOARDING_STEP: 'onBoardingStep',
  MY_XP: 'myXP',
  MY_LEVEL: 'myLevel',
  DAILY_NUTRITION: 'dailyNutritionSummary',
  VIEWED_TIPS: 'viewedTips',
  TRAINING_PLAN_SETTINGS: 'trainingPlanSettings',
  SHOW_MUSIC: 'showMusic',
};

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider = ({ children }: { children: React.ReactNode }) => {
  const [plansState, setPlansState] = useState<PlansByCategory>(EMPTY_PLANS);
  const [hasVisitedChatState, setHasVisitedChatState] = useState(false);
  const [shareHealthPlanState, setShareHealthPlanState] = useState(false);
  const [takenDatesState, setTakenDatesState] = useState<Record<string, SupplementTime[]>>({});
  const [myGoalsState, setMyGoalsState] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCompletedOnboardingState, setHasCompletedOnboardingState] = useState(false);
  const [onboardingStepState, setOnboardingStepState] = useState(0);
  const [myXPState, setMyXPState] = useState(0);
  const [myLevelState, setMyLevelState] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [levelUpModalVisible, setLevelUpModalVisible] = useState(false);
  const [newLevelReached, setNewLevelReached] = useState<number | null>(null);
  const [dailyNutritionSummariesState, setDailyNutritionSummariesState] = useState<
    Record<string, DailyNutritionSummary>
  >({});
  const [viewedTipsState, setViewedTipsState] = useState<ViewedTip[]>([]);
  const [trainingPlanSettingsState, setTrainingPlanSettingsState] = useState<Record<string, TrainingPlanSettings>>({});
  const [showMusicState, setShowMusicState] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          plansRaw,
          visitedRaw,
          shareRaw,
          takenRaw,
          myGoalsRaw,
          onboardingRaw,
          onboardingStepRaw,
          myXPRaw,
          myLevelRaw,
          dailyNutritionRaw,
          viewedTipsRaw,
          trainingSettingsRaw,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PLANS),
          AsyncStorage.getItem(STORAGE_KEYS.HAS_VISITED_CHAT),
          AsyncStorage.getItem(STORAGE_KEYS.SHARE_HEALTH_PLAN),
          AsyncStorage.getItem(STORAGE_KEYS.TAKEN_DATES),
          AsyncStorage.getItem(STORAGE_KEYS.MY_GOALS),
          AsyncStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING),
          AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP),
          AsyncStorage.getItem(STORAGE_KEYS.MY_XP),
          AsyncStorage.getItem(STORAGE_KEYS.MY_LEVEL),
          AsyncStorage.getItem(STORAGE_KEYS.DAILY_NUTRITION),
          AsyncStorage.getItem(STORAGE_KEYS.VIEWED_TIPS),
          AsyncStorage.getItem(STORAGE_KEYS.TRAINING_PLAN_SETTINGS),
        ]);

        const normalizePlans = (raw: string | null): PlansByCategory => {
          if (!raw) return EMPTY_PLANS;
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              return { ...EMPTY_PLANS, supplements: parsed };
            }

            const supplements = Array.isArray(parsed?.supplements) ? parsed.supplements : [];
            const training = Array.isArray(parsed?.training) ? parsed.training : [];
            const nutrition = Array.isArray(parsed?.nutrition) ? parsed.nutrition : [];
            const other = Array.isArray(parsed?.other) ? parsed.other : [];

            return { supplements, training, nutrition, other };
          } catch (error) {
            console.warn('Failed to parse plans', error);
            return EMPTY_PLANS;
          }
        };

        setPlansState(normalizePlans(plansRaw));
        if (visitedRaw === 'true') setHasVisitedChatState(true);
        if (shareRaw === 'true') setShareHealthPlanState(true);
        if (takenRaw) setTakenDatesState(JSON.parse(takenRaw));
        if (myGoalsRaw) setMyGoalsState(JSON.parse(myGoalsRaw));
        if (onboardingRaw === 'true') setHasCompletedOnboardingState(true);
        if (onboardingStepRaw) setOnboardingStepState(Number.parseInt(onboardingStepRaw, 10));
        // Ladda XP och level direkt utan att trigga level-up-logik vid initial laddning
        if (myXPRaw) setMyXPState(Number.parseInt(myXPRaw, 10));
        if (myLevelRaw) setMyLevelState(Number.parseInt(myLevelRaw, 10));
        if (dailyNutritionRaw) setDailyNutritionSummariesState(JSON.parse(dailyNutritionRaw));
        if (viewedTipsRaw) setViewedTipsState(JSON.parse(viewedTipsRaw));
        if (trainingSettingsRaw) setTrainingPlanSettingsState(JSON.parse(trainingSettingsRaw));
      } catch (err) {
        console.error('Kunde inte ladda från AsyncStorage:', err);
      } finally {
        setIsInitialized(true); // ✅ sätt när allt är laddat
      }
    };
    loadData();
  }, []);

  const setPlans = (update: PlansByCategory | ((prev: PlansByCategory) => PlansByCategory)) => {
    setPlansState(prev => {
      const newPlans = typeof update === 'function' ? update(prev) : update;
      const normalizedPlans: PlansByCategory = {
        ...EMPTY_PLANS,
        ...newPlans,
        supplements: newPlans.supplements ?? [],
        training: newPlans.training ?? [],
        nutrition: newPlans.nutrition ?? [],
        other: (newPlans as any).other ?? [],
      };
      AsyncStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(normalizedPlans));
      return normalizedPlans;
    });
  };

  const setTakenDates = (
    update:
      | Record<string, SupplementTime[]>
      | ((prev: Record<string, SupplementTime[]>) => Record<string, SupplementTime[]>)
  ) => {
    setTakenDatesState(prev => {
      const newDates = typeof update === 'function' ? update(prev) : update;
      AsyncStorage.setItem(STORAGE_KEYS.TAKEN_DATES, JSON.stringify(newDates));
      return newDates;
    });
  };

  const setHasVisitedChat = async (val: boolean) => {
    setHasVisitedChatState(val);
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_VISITED_CHAT, val ? 'true' : 'false');
  };

  const setShareHealthPlan = async (val: boolean) => {
    setShareHealthPlanState(val);
    await AsyncStorage.setItem(STORAGE_KEYS.SHARE_HEALTH_PLAN, val ? 'true' : 'false');
  };

  const setMyGoals = (update: string[] | ((prev: string[]) => string[])) => {
    setMyGoalsState(prev => {
      const newGoals = typeof update === 'function' ? update(prev) : update;
      AsyncStorage.setItem(STORAGE_KEYS.MY_GOALS, JSON.stringify(newGoals));
      return newGoals;
    });
  };

  const setHasCompletedOnboarding = (val: boolean) => {
    setHasCompletedOnboardingState(val);
    AsyncStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, val ? 'true' : 'false');
  };

  const setOnboardingStep = (val: number) => {
    setOnboardingStepState(val);
    AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_STEP, val.toString());
  };

  const setMyXP = useCallback((update: number | ((prev: number) => number)) => {
    setMyXPState(prevXP => {
      const newXP = typeof update === 'function' ? update(prevXP) : update;

      const oldLevelObj = levels.findLast(l => l.requiredXP <= prevXP);
      const newLevelObj = levels.findLast(l => l.requiredXP <= newXP);

      const oldLevel = oldLevelObj?.level ?? 1;
      const newLevel = newLevelObj?.level ?? 1;

      // Om man gått upp minst en level
      if (newLevel > oldLevel) {
        setMyLevel(newLevel);
        setNewLevelReached(newLevel);
        setLevelUpModalVisible(true);
        AsyncStorage.setItem(STORAGE_KEYS.MY_LEVEL, newLevel.toString());
      } else if (newLevel !== myLevelState) {
        // Om man inte gått upp, men XP ändå ökat, säkerställ att nivå stämmer
        setMyLevel(newLevel);
        AsyncStorage.setItem(STORAGE_KEYS.MY_LEVEL, newLevel.toString());
      }

      AsyncStorage.setItem(STORAGE_KEYS.MY_XP, newXP.toString());
      return newXP;
    });
  }, [myLevelState]);

  const setMyLevel = (level: number) => {
    setMyLevelState(level);
    AsyncStorage.setItem(STORAGE_KEYS.MY_LEVEL, level.toString());
  };

  const clearNewLevelReached = () => {
    setNewLevelReached(null);
  };

  const setDailyNutritionSummaries = (
    updater:
      | Record<string, DailyNutritionSummary>
      | ((prev: Record<string, DailyNutritionSummary>) => Record<string, DailyNutritionSummary>)
  ) => {
    setDailyNutritionSummariesState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      AsyncStorage.setItem(STORAGE_KEYS.DAILY_NUTRITION, JSON.stringify(updated));
      return updated;
    });
  };

  const setViewedTips = useCallback((update: ViewedTip[] | ((prev: ViewedTip[]) => ViewedTip[])) => {
    setViewedTipsState(prev => {
      const newTips = typeof update === 'function' ? update(prev) : update;
      AsyncStorage.setItem(STORAGE_KEYS.VIEWED_TIPS, JSON.stringify(newTips));
      return newTips;
    });
  }, []);

  const setTrainingPlanSettings = (
    updater:
      | Record<string, TrainingPlanSettings>
      | ((prev: Record<string, TrainingPlanSettings>) => Record<string, TrainingPlanSettings>)
  ) => {
    setTrainingPlanSettingsState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      AsyncStorage.setItem(STORAGE_KEYS.TRAINING_PLAN_SETTINGS, JSON.stringify(updated));
      return updated;
    });
  };

  const setShowMusic = (val: boolean) => {
  setShowMusicState(val);
  AsyncStorage.setItem(STORAGE_KEYS.SHOW_MUSIC, val ? 'true' : 'false');
};

  const addTipView = useCallback((mainGoalId: string, tipId: string): number => {
    const existing = viewedTipsState.find(v => v.mainGoalId === mainGoalId && v.tipId === tipId);

    if (existing) {
      return 0; // Redan sett, ingen XP
    }

    const xpForView = XP_FOR_VIEW;
    const newView: ViewedTip = {
      mainGoalId,
      tipId,
      viewedAt: new Date().toISOString(),
      askedQuestions: [], // Tom array från början
      xpEarned: xpForView,
    };

    setViewedTips([...viewedTipsState, newView]);
    setMyXP(prev => prev + xpForView);
    return xpForView;
  }, [viewedTipsState, setViewedTips, setMyXP]);

  const incrementTipChat = useCallback(
    (mainGoalId: string, tipId: string, questionType: string): number => {
      const existing = viewedTipsState.find(v => v.mainGoalId === mainGoalId && v.tipId === tipId);

      // Om frågan redan ställts, ingen XP
      if (existing?.askedQuestions.includes(questionType)) {
        return 0;
      }

      const xpForChat = XP_FOR_CHAT_QUESTION;

      const updated = viewedTipsState.map(v => {
        if (v.mainGoalId === mainGoalId && v.tipId === tipId) {
          return {
            ...v,
            askedQuestions: [...v.askedQuestions, questionType],
            xpEarned: v.xpEarned + xpForChat,
          };
        }
        return v;
      });

      setViewedTips(updated);
      setMyXP(prev => prev + xpForChat);
      return xpForChat;
    },
    [viewedTipsState, setViewedTips, setMyXP]
  );

  // Lägg till ny funktion för att ge XP för varje chat-meddelande
  const addChatMessageXP = useCallback((mainGoalId: string, tipId: string): number => {
    const xpPerMessage = XP_PER_CHAT_MESSAGE; // 2 XP per meddelande

    const updated = viewedTipsState.map(v => {
      if (v.mainGoalId === mainGoalId && v.tipId === tipId) {
        return {
          ...v,
          xpEarned: v.xpEarned + xpPerMessage,
        };
      }
      return v;
    });

    setViewedTips(updated);
    setMyXP(prev => prev + xpPerMessage);
    return xpPerMessage;
  }, [viewedTipsState, setViewedTips, setMyXP]);

  const setTipVerdict = useCallback(
    (mainGoalId: string, tipId: string, verdict: VerdictValue): number => {
      const existing = viewedTipsState.find(v => v.mainGoalId === mainGoalId && v.tipId === tipId);

      // Om verdict redan satt, ingen XP
      if (existing?.verdict) {
        // Uppdatera bara verdict, ingen XP
        const updated = viewedTipsState.map(v => {
          if (v.mainGoalId === mainGoalId && v.tipId === tipId) {
            return { ...v, verdict };
          }
          return v;
        });
        setViewedTips(updated);
        return 0;
      }

      const xpForVerdict = XP_FOR_VERDICT;

      const updated = viewedTipsState.map(v => {
        if (v.mainGoalId === mainGoalId && v.tipId === tipId) {
          return {
            ...v,
            verdict,
            xpEarned: v.xpEarned + xpForVerdict,
          };
        }
        return v;
      });

      setViewedTips(updated);
      setMyXP(prev => prev + xpForVerdict);
      return xpForVerdict;
    },
    [viewedTipsState, setViewedTips, setMyXP]
  );

  const activeGoals = useMemo(
    () => [...plansState.training, ...plansState.nutrition, ...plansState.other],
    [plansState.nutrition, plansState.other, plansState.training]
  );

  const value = useMemo(
    () => ({
      plans: plansState,
      setPlans,
      activeGoals,
      hasVisitedChat: hasVisitedChatState,
      setHasVisitedChat,
      shareHealthPlan: shareHealthPlanState,
      setShareHealthPlan,
      takenDates: takenDatesState,
      setTakenDates,
      myGoals: myGoalsState,
      setMyGoals,
      errorMessage,
      setErrorMessage,
      hasCompletedOnboarding: hasCompletedOnboardingState,
      setHasCompletedOnboarding,
      onboardingStep: onboardingStepState,
      setOnboardingStep,
      isInitialized,
      myXP: myXPState,
      setMyXP,
      myLevel: myLevelState,
      setMyLevel,
      levelUpModalVisible,
      setLevelUpModalVisible,
      newLevelReached,
      clearNewLevelReached,
      dailyNutritionSummaries: dailyNutritionSummariesState,
      setDailyNutritionSummaries,
      viewedTips: viewedTipsState,
      setViewedTips,
      addTipView,
      incrementTipChat,
      addChatMessageXP,
      setTipVerdict,
      trainingPlanSettings: trainingPlanSettingsState,
      setTrainingPlanSettings,
      showMusic: showMusicState,
      setShowMusic,
    }),
    [plansState, activeGoals, hasVisitedChatState, shareHealthPlanState, takenDatesState, myGoalsState, errorMessage, hasCompletedOnboardingState, onboardingStepState, isInitialized, myXPState, setMyXP, myLevelState, levelUpModalVisible, newLevelReached, dailyNutritionSummariesState, viewedTipsState, setViewedTips, addTipView, incrementTipChat, addChatMessageXP, setTipVerdict, trainingPlanSettingsState, showMusicState]
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


