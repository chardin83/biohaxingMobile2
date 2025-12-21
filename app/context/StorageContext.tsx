import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SupplementTime } from "../domain/SupplementTime";
import { Plan } from "../domain/Plan";
import { levels } from "@/locales/levels";

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

type ActiveGoal = {
  mainGoalId: string;
  startedAt: string;
  goalId: string;
};

type FinishedGoal = {
  mainGoalId: string;
  finished: string;
  goalId: string;
};

interface StorageContextType {
  plans: Plan[];
  setPlans: (plans: Plan[] | ((prev: Plan[]) => Plan[])) => void;
  hasVisitedChat: boolean;
  setHasVisitedChat: (val: boolean) => void;
  shareHealthPlan: boolean;
  setShareHealthPlan: (val: boolean) => void;
  takenDates: Record<string, SupplementTime[]>;
  setTakenDates: (
    update:
      | Record<string, SupplementTime[]>
      | ((
          prev: Record<string, SupplementTime[]>
        ) => Record<string, SupplementTime[]>)
  ) => void;
  myGoals: string[];
  setMyGoals: (goals: string[] | ((prev: string[]) => string[])) => void;
  activeGoals: ActiveGoal[];
  setActiveGoals: (
    goals: ActiveGoal[] | ((prev: ActiveGoal[]) => ActiveGoal[])
  ) => void;
  finishedGoals: FinishedGoal[];
  setFinishedGoals: (
    goals: FinishedGoal[] | ((prev: FinishedGoal[]) => FinishedGoal[])
  ) => void;
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
  dailyNutritionSummaries: Record<string, DailyNutritionSummary>;
  setDailyNutritionSummaries: (
    updater:
      | Record<string, DailyNutritionSummary>
      | ((
          prev: Record<string, DailyNutritionSummary>
        ) => Record<string, DailyNutritionSummary>)
  ) => void;
}

const STORAGE_KEYS = {
  PLANS: "plans",
  HAS_VISITED_CHAT: "hasVisitedChat",
  SHARE_HEALTH_PLAN: "shareHealthPlan",
  TAKEN_DATES: "takenDates",
  MY_GOALS: "myGoals",
  ACTIVE_GOALS: "activeGoals",
  FINISHED_GOALS: "finishedGoals",
  HAS_COMPLETED_ONBOARDING: "hasCompletedOnboarding",
  ONBOARDING_STEP: "onBoardingStep",
  MY_XP: "myXP",
  MY_LEVEL: "myLevel",
  DAILY_NUTRITION: "dailyNutritionSummary",
};

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [plansState, setPlansState] = useState<Plan[]>([]);
  const [hasVisitedChatState, setHasVisitedChatState] = useState(false);
  const [shareHealthPlanState, setShareHealthPlanState] = useState(false);
  const [takenDatesState, setTakenDatesState] = useState<
    Record<string, SupplementTime[]>
  >({});
  const [myGoalsState, setMyGoalsState] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeGoalsState, setActiveGoalsState] = useState<ActiveGoal[]>([]);
  const [finishedGoalsState, setFinishedGoalsState] = useState<FinishedGoal[]>(
    []
  );
  const [hasCompletedOnboardingState, setHasCompletedOnboardingState] =
    useState(false);
  const [onboardingStepState, setOnboardingStepState] = useState(0);
  const [myXPState, setMyXPState] = useState(0);
  const [myLevelState, setMyLevelState] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [levelUpModalVisible, setLevelUpModalVisible] = useState(false);
  const [newLevelReached, setNewLevelReached] = useState<number | null>(null);
  const [dailyNutritionSummariesState, setDailyNutritionSummariesState] =
    useState<Record<string, DailyNutritionSummary>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          plansRaw,
          visitedRaw,
          shareRaw,
          takenRaw,
          myGoalsRaw,
          activeGoalsRaw,
          finishedGoalsRaw,
          onboardingRaw,
          onboardingStepRaw,
          myXPRaw,
          myLevelRaw,
          dailyNutritionRaw,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PLANS),
          AsyncStorage.getItem(STORAGE_KEYS.HAS_VISITED_CHAT),
          AsyncStorage.getItem(STORAGE_KEYS.SHARE_HEALTH_PLAN),
          AsyncStorage.getItem(STORAGE_KEYS.TAKEN_DATES),
          AsyncStorage.getItem(STORAGE_KEYS.MY_GOALS),
          AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_GOALS),
          AsyncStorage.getItem(STORAGE_KEYS.FINISHED_GOALS),
          AsyncStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING),
          AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP),
          AsyncStorage.getItem(STORAGE_KEYS.MY_XP),
          AsyncStorage.getItem(STORAGE_KEYS.MY_LEVEL),
          AsyncStorage.getItem(STORAGE_KEYS.DAILY_NUTRITION),
        ]);

        if (plansRaw) setPlansState(JSON.parse(plansRaw));
        if (visitedRaw === "true") setHasVisitedChatState(true);
        if (shareRaw === "true") setShareHealthPlanState(true);
        if (takenRaw) setTakenDatesState(JSON.parse(takenRaw));
        if (myGoalsRaw) setMyGoalsState(JSON.parse(myGoalsRaw));
        if (activeGoalsRaw) setActiveGoalsState(JSON.parse(activeGoalsRaw));
        if (finishedGoalsRaw)
          setFinishedGoalsState(JSON.parse(finishedGoalsRaw));
        if (onboardingRaw === "true") setHasCompletedOnboardingState(true);
        if (onboardingStepRaw)
          setOnboardingStepState(parseInt(onboardingStepRaw));
        if (myXPRaw) setMyXP(parseInt(myXPRaw));
        if (myLevelRaw) setMyLevelState(parseInt(myLevelRaw));
        if (dailyNutritionRaw)
          setDailyNutritionSummariesState(JSON.parse(dailyNutritionRaw));
      } catch (err) {
        console.error("Kunde inte ladda från AsyncStorage:", err);
      } finally {
        setIsInitialized(true); // ✅ sätt när allt är laddat
      }
    };
    loadData();
  }, []);

  const setPlans = (update: Plan[] | ((prev: Plan[]) => Plan[])) => {
    setPlansState((prev) => {
      const newPlans = typeof update === "function" ? update(prev) : update;
      AsyncStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(newPlans));
      return newPlans;
    });
  };

  const setTakenDates = (
    update:
      | Record<string, SupplementTime[]>
      | ((
          prev: Record<string, SupplementTime[]>
        ) => Record<string, SupplementTime[]>)
  ) => {
    setTakenDatesState((prev) => {
      const newDates = typeof update === "function" ? update(prev) : update;
      AsyncStorage.setItem(STORAGE_KEYS.TAKEN_DATES, JSON.stringify(newDates));
      return newDates;
    });
  };

  const setHasVisitedChat = async (val: boolean) => {
    setHasVisitedChatState(val);
    await AsyncStorage.setItem(
      STORAGE_KEYS.HAS_VISITED_CHAT,
      val ? "true" : "false"
    );
  };

  const setShareHealthPlan = async (val: boolean) => {
    setShareHealthPlanState(val);
    await AsyncStorage.setItem(
      STORAGE_KEYS.SHARE_HEALTH_PLAN,
      val ? "true" : "false"
    );
  };

  const setMyGoals = (update: string[] | ((prev: string[]) => string[])) => {
    setMyGoalsState((prev) => {
      const newGoals = typeof update === "function" ? update(prev) : update;
      AsyncStorage.setItem(STORAGE_KEYS.MY_GOALS, JSON.stringify(newGoals));
      return newGoals;
    });
  };

  const setActiveGoals = (
    update: ActiveGoal[] | ((prev: ActiveGoal[]) => ActiveGoal[])
  ) => {
    setActiveGoalsState((prev) => {
      const newGoals = typeof update === "function" ? update(prev) : update;
      AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_GOALS, JSON.stringify(newGoals));
      return newGoals;
    });
  };

  const setFinishedGoals = (
    update: FinishedGoal[] | ((prev: FinishedGoal[]) => FinishedGoal[])
  ) => {
    setFinishedGoalsState((prev) => {
      const newGoals = typeof update === "function" ? update(prev) : update;
      AsyncStorage.setItem(
        STORAGE_KEYS.FINISHED_GOALS,
        JSON.stringify(newGoals)
      );
      return newGoals;
    });
  };

  const setHasCompletedOnboarding = (val: boolean) => {
    setHasCompletedOnboardingState(val);
    AsyncStorage.setItem(
      STORAGE_KEYS.HAS_COMPLETED_ONBOARDING,
      val ? "true" : "false"
    );
  };

  const setOnboardingStep = (val: number) => {
    setOnboardingStepState(val);
    AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_STEP, val.toString());
  };

  const setMyXP = (update: number | ((prev: number) => number)) => {
    setMyXPState((prevXP) => {
      const newXP = typeof update === "function" ? update(prevXP) : update;

      const oldLevelObj = levels.findLast((l) => l.requiredXP <= prevXP);
      const newLevelObj = levels.findLast((l) => l.requiredXP <= newXP);

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
  };

  const setMyLevel = (level: number) => {
    setMyLevelState(level);
    AsyncStorage.setItem(STORAGE_KEYS.MY_LEVEL, level.toString());
  };

  const setDailyNutritionSummaries = (
    updater:
      | Record<string, DailyNutritionSummary>
      | ((
          prev: Record<string, DailyNutritionSummary>
        ) => Record<string, DailyNutritionSummary>)
  ) => {
    setDailyNutritionSummariesState((prev) => {
      const updated = typeof updater === "function" ? updater(prev) : updater;
      AsyncStorage.setItem(
        STORAGE_KEYS.DAILY_NUTRITION,
        JSON.stringify(updated)
      );
      return updated;
    });
  };

  const value = useMemo(
    () => ({
      plans: plansState,
      setPlans,
      hasVisitedChat: hasVisitedChatState,
      setHasVisitedChat,
      shareHealthPlan: shareHealthPlanState,
      setShareHealthPlan,
      takenDates: takenDatesState,
      setTakenDates,
      myGoals: myGoalsState,
      setMyGoals,
      activeGoals: activeGoalsState,
      setActiveGoals,
      finishedGoals: finishedGoalsState,
      setFinishedGoals,
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
      dailyNutritionSummaries: dailyNutritionSummariesState,
      setDailyNutritionSummaries,
    }),
    [
      plansState,
      hasVisitedChatState,
      shareHealthPlanState,
      takenDatesState,
      myGoalsState,
      activeGoalsState,
      finishedGoalsState,
      errorMessage,
      hasCompletedOnboardingState,
      onboardingStepState,
      myXPState,
      myLevelState,
      isInitialized,
      levelUpModalVisible,
      setLevelUpModalVisible,
      newLevelReached,
      dailyNutritionSummariesState,
      setDailyNutritionSummaries,
    ]
  );

  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  );
};

export const useStorage = (): StorageContextType => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error("useStorage måste användas inom en <StorageProvider>");
  }
  return context;
};
