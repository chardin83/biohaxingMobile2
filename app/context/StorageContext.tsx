import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  levels,
  XP_FOR_CHAT_QUESTION,
  XP_FOR_VERDICT,
  XP_FOR_VIEW,
  XP_PER_CHAT_MESSAGE,
  type XpSource,
} from '@/constants/XP';
import { MetricId } from '@/locales/metrics';
import { PlanCategory } from '@/types/planCategory';
import { VerdictValue } from '@/types/verdict';

import { Plan } from '../domain/Plan';
import { SupplementTime } from '../domain/SupplementTime';

export type MealNutrition = {
  id?: string;
  date: string; // YYYY-MM-DD
  mealName?: string;
  protein: number;
  calories: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  fiberByType?: Record<string, number>;
  fiberSubtypeTotals?: Record<string, number>;
  polyphenolByType?: Record<string, number>;
  mineralsByType?: Record<string, number>;
  mineralsConfidenceByType?: Record<string, 'high' | 'medium' | 'low' | 'unknown'>;
  microbiomeSupport?: Array<{
    microbe: string;
    supportLevel: 'high' | 'medium' | 'low' | 'unknown';
    linkedNutrients: string[];
    likelyFoods: string[];
    rationale?: string;
  }>;
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
  createdBy: string;
  editedAt: string;
  editedBy: string;
  tipId: string;
  planCategory: Exclude<PlanCategory, 'supplement'>;
  comment?: string;
};

export type ReasonSummary = {
  text: string;
  createdAt: string;
};

export type MetricEntry = {
  metricId: MetricId;
  value: number;
  unit: string;
  recordedAt: string;
  notes?: string;
};

export type PlansByCategory = {
  supplements: Plan[];
  training: PlanTipEntry[];
  nutrition: PlanTipEntry[];
  other: PlanTipEntry[];
  reasonSummary: ReasonSummary;
};

const EMPTY_PLANS: PlansByCategory = {
  supplements: [],
  training: [],
  nutrition: [],
  other: [],
  reasonSummary: { text: '', createdAt: '' },
};

export type TrainingPlanSettings = {
  sessionsPerWeek?: number;
  sessionDurationMinutes?: number;
};

export interface ViewedTip {
  tipId: string;
  viewedAt: string;
  askedQuestions: string[]; // Array av frågor som ställts: ["studies", "experts", "risks"]
  xpEarned: number;
  verdict?: VerdictValue; // Uppdaterad för att använda VerdictValue
}

export type XpBreakdown = {
  education: number;
  nutrition: number;
};

export type NutritionXpClaim = {
  xp: number;
  awardedAt: string;
  period: 'daily' | 'weekly';
  periodKey: string;
  tipId: string;
};

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
  xpBreakdown?: XpBreakdown;
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
  addTipView: (areaId: string, tipId: string) => number;
  incrementTipChat: (areaId: string, tipId: string, questionType: string) => number;
  addChatMessageXP: (areaId: string, tipId: string) => number;
  setTipVerdict: (areaId: string, tipId: string, verdict: VerdictValue) => number;
  claimNutritionTipCompletionXP?: (input: {
    claimKey: string;
    tipId: string;
    period: 'daily' | 'weekly';
    periodKey: string;
    amount: number;
  }) => number;
  nutritionXpClaims?: Record<string, NutritionXpClaim>;
  trainingPlanSettings: Record<string, TrainingPlanSettings>;
  setTrainingPlanSettings: (
    updater:
      | Record<string, TrainingPlanSettings>
      | ((prev: Record<string, TrainingPlanSettings>) => Record<string, TrainingPlanSettings>)
  ) => void;
  showMusic: boolean;
  setShowMusic: (val: boolean) => void;
  tempPlans: PlansByCategory | null;
  setTempPlans: React.Dispatch<React.SetStateAction<PlansByCategory | null>>;
  metricEntries: MetricEntry[];
  setMetricEntries: (
    updater: MetricEntry[] | ((prev: MetricEntry[]) => MetricEntry[])
  ) => void;
  addMetricEntry: (entry: MetricEntry) => void;
  upsertMetricEntries: (entries: MetricEntry[]) => void;
  getMetricHistory: (metricId: MetricId) => MetricEntry[];
  weeklyTracking: Record<string, Record<string, string[] | number>>;
  setWeeklyTracking: (
    updater: Record<string, Record<string, string[] | number>> | ((prev: Record<string, Record<string, string[] | number>>) => Record<string, Record<string, string[] | number>>)
  ) => void;
  addToWeeklyTracking: (weekStartISO: string, key: string, value: string | number) => void;
  getWeeklyTrackingValue: (weekStartISO: string, key: string) => string[] | number | undefined;
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
  XP_BREAKDOWN: 'xpBreakdown',
  MY_LEVEL: 'myLevel',
  DAILY_NUTRITION: 'dailyNutritionSummary',
  VIEWED_TIPS: 'viewedTips',
  TRAINING_PLAN_SETTINGS: 'trainingPlanSettings',
  SHOW_MUSIC: 'showMusic',
  METRIC_ENTRIES: 'metricEntries',
  WEEKLY_TRACKING: 'weeklyTracking',
  NUTRITION_XP_CLAIMS: 'nutritionXpClaims',
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
  const [xpBreakdownState, setXpBreakdownState] = useState<XpBreakdown>({ education: 0, nutrition: 0 });
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
  const [tempPlans, setTempPlans] = useState<PlansByCategory | null>(null);
  const [metricEntriesState, setMetricEntriesState] = useState<MetricEntry[]>([]);
  const [weeklyTrackingState, setWeeklyTrackingState] = useState<Record<string, Record<string, string[] | number>>>({});
  const [nutritionXpClaimsState, setNutritionXpClaimsState] = useState<Record<string, NutritionXpClaim>>({});

  const normalizeReasonSummary = (value: any): ReasonSummary => {
    if (!value) return { text: '', createdAt: '' };
    if (typeof value === 'string') {
      return { text: value, createdAt: new Date().toISOString() };
    }
    const text = typeof value.text === 'string' ? value.text : '';
    const createdAt = typeof value.createdAt === 'string' ? value.createdAt : '';
    return { text, createdAt };
  };

  const normalizeViewedTips = (value: unknown): ViewedTip[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item: any) => {
        const tipId = typeof item?.tipId === 'string' ? item.tipId : '';
        if (!tipId) return null;

        return {
          tipId,
          viewedAt: typeof item?.viewedAt === 'string' ? item.viewedAt : new Date().toISOString(),
          askedQuestions: Array.isArray(item?.askedQuestions)
            ? item.askedQuestions.filter((q: unknown) => typeof q === 'string')
            : [],
          xpEarned: Number.isFinite(item?.xpEarned) ? item.xpEarned : 0,
          verdict: item?.verdict,
        } as ViewedTip;
      })
      .filter((item): item is ViewedTip => Boolean(item));
  };

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
          xpBreakdownRaw,
          myLevelRaw,
          dailyNutritionRaw,
          viewedTipsRaw,
          trainingSettingsRaw,
          metricEntriesRaw,
          weeklyTrackingRaw,
          nutritionXpClaimsRaw,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PLANS),
          AsyncStorage.getItem(STORAGE_KEYS.HAS_VISITED_CHAT),
          AsyncStorage.getItem(STORAGE_KEYS.SHARE_HEALTH_PLAN),
          AsyncStorage.getItem(STORAGE_KEYS.TAKEN_DATES),
          AsyncStorage.getItem(STORAGE_KEYS.MY_GOALS),
          AsyncStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING),
          AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP),
          AsyncStorage.getItem(STORAGE_KEYS.MY_XP),
          AsyncStorage.getItem(STORAGE_KEYS.XP_BREAKDOWN),
          AsyncStorage.getItem(STORAGE_KEYS.MY_LEVEL),
          AsyncStorage.getItem(STORAGE_KEYS.DAILY_NUTRITION),
          AsyncStorage.getItem(STORAGE_KEYS.VIEWED_TIPS),
          AsyncStorage.getItem(STORAGE_KEYS.TRAINING_PLAN_SETTINGS),
          AsyncStorage.getItem(STORAGE_KEYS.METRIC_ENTRIES),
          AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_TRACKING),
          AsyncStorage.getItem(STORAGE_KEYS.NUTRITION_XP_CLAIMS),
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

            return {
              supplements,
              training,
              nutrition,
              other,
              reasonSummary: normalizeReasonSummary(parsed.reasonSummary),
            };
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
        if (myXPRaw) {
          const parsedXp = Number.parseInt(myXPRaw, 10);
          setMyXPState(Number.isFinite(parsedXp) ? parsedXp : 0);
        }
        if (xpBreakdownRaw) {
          const parsed = JSON.parse(xpBreakdownRaw);
          setXpBreakdownState({
            education: Number.isFinite(parsed?.education) ? parsed.education : 0,
            nutrition: Number.isFinite(parsed?.nutrition) ? parsed.nutrition : 0,
          });
        }
        if (myLevelRaw) setMyLevelState(Number.parseInt(myLevelRaw, 10));
        if (dailyNutritionRaw) setDailyNutritionSummariesState(JSON.parse(dailyNutritionRaw));
        if (viewedTipsRaw) {
          setViewedTipsState(normalizeViewedTips(JSON.parse(viewedTipsRaw)));
        }
        if (trainingSettingsRaw) setTrainingPlanSettingsState(JSON.parse(trainingSettingsRaw));
        if (metricEntriesRaw) setMetricEntriesState(JSON.parse(metricEntriesRaw));
        if (weeklyTrackingRaw) setWeeklyTrackingState(JSON.parse(weeklyTrackingRaw));
        if (nutritionXpClaimsRaw) setNutritionXpClaimsState(JSON.parse(nutritionXpClaimsRaw));
      } catch (err) {
        console.error('Kunde inte ladda från AsyncStorage:', err);
      } finally {
        setIsInitialized(true); // ✅ sätt när allt är laddat
      }
    };
    loadData();
  }, []);

  const setPlans = useCallback(
    (update: PlansByCategory | ((prev: PlansByCategory) => PlansByCategory)) => {
      setPlansState(prev => {
        const newPlans = typeof update === 'function' ? update(prev) : update;
        const normalizedPlans: PlansByCategory = {
          ...EMPTY_PLANS,
          ...newPlans,
          supplements: newPlans.supplements ?? [],
          training: newPlans.training ?? [],
          nutrition: newPlans.nutrition ?? [],
          other: (newPlans as any).other ?? [],
          reasonSummary: normalizeReasonSummary((newPlans as any).reasonSummary),
        };
        AsyncStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(normalizedPlans));
        return normalizedPlans;
      });
    },
    []
  );

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

  const awardXP = useCallback(
    (amount: number, source: XpSource) => {
      if (!Number.isFinite(amount) || amount <= 0) return;

      setXpBreakdownState(prev => {
        const next = {
          ...prev,
          [source]: (prev[source] ?? 0) + amount,
        };
        AsyncStorage.setItem(STORAGE_KEYS.XP_BREAKDOWN, JSON.stringify(next));
        return next;
      });

      setMyXP(prev => prev + amount);
    },
    [setMyXP]
  );

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

  const setMetricEntries = (
    updater: MetricEntry[] | ((prev: MetricEntry[]) => MetricEntry[])
  ) => {
    setMetricEntriesState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      AsyncStorage.setItem(STORAGE_KEYS.METRIC_ENTRIES, JSON.stringify(updated));
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

      return next;
    });
  }, []);

  const getMetricHistory = useCallback((metricId: MetricId): MetricEntry[] => {
    return metricEntriesState.filter(entry => {
      const matchesMetric = entry.metricId === metricId;
      return matchesMetric;
    });
  }, [metricEntriesState]);


  const addTipView = useCallback((_areaId: string, tipId: string): number => {
    const existing = viewedTipsState.find(v => v.tipId === tipId);
    const xpForView = XP_FOR_VIEW;

    if (!existing) {
      const newView: ViewedTip = {
        tipId,
        viewedAt: new Date().toISOString(),
        askedQuestions: [],
        xpEarned: xpForView,
      };

      setViewedTips([...viewedTipsState, newView]);
      awardXP(xpForView, 'education');
      return xpForView;
    }

    return 0;
  }, [viewedTipsState, setViewedTips, awardXP]);

  const incrementTipChat = useCallback(
    (_areaId: string, tipId: string, questionType: string): number => {
      const existing = viewedTipsState.find(v => v.tipId === tipId);

      // Om frågan redan ställts, ingen XP
      if (existing?.askedQuestions.includes(questionType)) {
        return 0;
      }

      const xpForChat = XP_FOR_CHAT_QUESTION;

      const updated = viewedTipsState.map(v => {
        if (v.tipId === tipId) {
          return {
            ...v,
            askedQuestions: [...v.askedQuestions, questionType],
            xpEarned: v.xpEarned + xpForChat,
          };
        }
        return v;
      });

      setViewedTips(updated);
      awardXP(xpForChat, 'education');
      return xpForChat;
    },
    [viewedTipsState, setViewedTips, awardXP]
  );

  // Lägg till ny funktion för att ge XP för varje chat-meddelande
  const addChatMessageXP = useCallback((_areaId: string, tipId: string): number => {
    const xpPerMessage = XP_PER_CHAT_MESSAGE; // 2 XP per meddelande

    const updated = viewedTipsState.map(v => {
      if (v.tipId === tipId) {
        return {
          ...v,
          xpEarned: v.xpEarned + xpPerMessage,
        };
      }
      return v;
    });

    setViewedTips(updated);
    awardXP(xpPerMessage, 'education');
    return xpPerMessage;
  }, [viewedTipsState, setViewedTips, awardXP]);

  const setTipVerdict = useCallback(
    (_areaId: string, tipId: string, verdict: VerdictValue): number => {
      const existing = viewedTipsState.find(v => v.tipId === tipId);

      // Om verdict redan satt, ingen XP
      if (existing?.verdict) {
        // Uppdatera bara verdict, ingen XP
        const updated = viewedTipsState.map(v => {
          if (v.tipId === tipId) {
            return { ...v, verdict };
          }
          return v;
        });
        setViewedTips(updated);
        return 0;
      }

      const xpForVerdict = XP_FOR_VERDICT;

      const updated = viewedTipsState.map(v => {
        if (v.tipId === tipId) {
          return {
            ...v,
            verdict,
            xpEarned: v.xpEarned + xpForVerdict,
          };
        }
        return v;
      });

      setViewedTips(updated);
      awardXP(xpForVerdict, 'education');
      return xpForVerdict;
    },
    [viewedTipsState, setViewedTips, awardXP]
  );

  const claimNutritionTipCompletionXP = useCallback(
    (input: {
      claimKey: string;
      tipId: string;
      period: 'daily' | 'weekly';
      periodKey: string;
      amount: number;
    }): number => {
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

        AsyncStorage.setItem(STORAGE_KEYS.NUTRITION_XP_CLAIMS, JSON.stringify(next));
        return next;
      });


      awardXP(amount, 'nutrition');
      return amount;
    },
    [awardXP, nutritionXpClaimsState]
  );

  const setWeeklyTracking = (
    updater: Record<string, Record<string, string[] | number>> | ((prev: Record<string, Record<string, string[] | number>>) => Record<string, Record<string, string[] | number>>)
  ) => {
    setWeeklyTrackingState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_TRACKING, JSON.stringify(updated));
      return updated;
    });
  };

  const addToWeeklyTracking = useCallback((weekStartISO: string, key: string, value: string | number) => {
    setWeeklyTracking(prev => {
      const updated = { ...prev };
      if (!updated[weekStartISO]) {
        updated[weekStartISO] = {};
      }
      const weekData = updated[weekStartISO];

      // If value is a string, treat as array (for collecting items like plants, colors)
      if (typeof value === 'string') {
        const existing = weekData[key];
        if (Array.isArray(existing)) {
          // Only add if not already present (unique constraint)
          if (!existing.includes(value)) {
            weekData[key] = [...existing, value];
          }
        } else {
          weekData[key] = [value];
        }
      } else {
        // If value is a number, just set/overwrite (for counts)
        weekData[key] = value;
      }

      return updated;
    });
  }, []);

  const getWeeklyTrackingValue = useCallback(
    (weekStartISO: string, key: string): string[] | number | undefined => {
      return weeklyTrackingState[weekStartISO]?.[key];
    },
    [weeklyTrackingState]
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
      xpBreakdown: xpBreakdownState,
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
      claimNutritionTipCompletionXP,
      nutritionXpClaims: nutritionXpClaimsState,
      trainingPlanSettings: trainingPlanSettingsState,
      setTrainingPlanSettings,
      showMusic: showMusicState,
      setShowMusic,
      tempPlans,
      setTempPlans,
      metricEntries: metricEntriesState,
      setMetricEntries,
      addMetricEntry,
      upsertMetricEntries,
      getMetricHistory,
      weeklyTracking: weeklyTrackingState,
      setWeeklyTracking,
      addToWeeklyTracking,
      getWeeklyTrackingValue,
    }),
    [plansState, setPlans, activeGoals, hasVisitedChatState, shareHealthPlanState, takenDatesState, myGoalsState, errorMessage, hasCompletedOnboardingState, onboardingStepState, isInitialized, myXPState, setMyXP, xpBreakdownState, myLevelState, levelUpModalVisible, newLevelReached, dailyNutritionSummariesState, viewedTipsState, setViewedTips, addTipView, incrementTipChat, addChatMessageXP, setTipVerdict, claimNutritionTipCompletionXP, nutritionXpClaimsState, trainingPlanSettingsState, showMusicState, tempPlans, metricEntriesState, addMetricEntry, upsertMetricEntries, getMetricHistory, weeklyTrackingState, addToWeeklyTracking, getWeeklyTrackingValue]
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


