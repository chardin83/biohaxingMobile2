import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, LayoutAnimation, Platform, UIManager } from 'react-native';

import type { TipProgressItem } from '@/app/context/storage/nutrition/nutritionTypes';
import { useStorage } from '@/app/context/StorageContext';
import { XP_FOR_NUTRITION_TIP_DAILY_COMPLETION, XP_FOR_NUTRITION_TIP_WEEKLY_COMPLETION } from '@/constants/XP';
import { useNutritionPlanProgress } from '@/hooks/nutrition/useNutritionPlanProgress';
import type { NutritionTargetPeriod } from '@/types/nutrition/nutritionTargets';
import { getTipProgressKey } from '@/utils/nutritionTipProgress';

interface UseNutritionTipCompletionParams {
  selectedDate: string;
  weekStartKey: string;
  onTipCompleted?: (targetY?: number) => void;
}

type RefBox<T> = {
  current: T;
};

type HandleTipCompletionTransitionsParams = {
  nutritionPlanTipProgress: TipProgressItem[];
  previousFulfilledByKeyRef: RefBox<Record<string, boolean>>;
  hasInitializedFulfilledTrackingRef: RefBox<boolean>;
  pendingCompletionScrollTimeoutRef: RefBox<ReturnType<typeof setTimeout> | null>;
  pendingCompletionAnimTimeoutRef: RefBox<ReturnType<typeof setTimeout> | null>;
  onTipCompleted?: (targetY?: number) => void;
  tipRowPeriodByKeyRef: RefBox<Record<string, NutritionTargetPeriod>>;
  tipRowLocalYByKeyRef: RefBox<Record<string, number>>;
  fulfilledTipsSectionYRef: RefBox<number>;
  periodSectionYRef: RefBox<Record<NutritionTargetPeriod, number>>;
  animateTipCompletion: (tipKey: string) => void;
};

const COMPLETION_SCROLL_DELAY_MS = 80;
const COMPLETION_ANIMATION_DELAY_AFTER_SCROLL_MS = 180;

const computeTargetY = (
  tipKey: string,
  tipRowPeriodByKey: Record<string, NutritionTargetPeriod>,
  tipRowLocalYByKey: Record<string, number>,
  sectionY: number,
  periodSectionY: Record<NutritionTargetPeriod, number>
): number | undefined => {
  const period = tipRowPeriodByKey[tipKey];
  const rowLocalY = tipRowLocalYByKey[tipKey];
  const periodY = period ? periodSectionY[period] : 0;
  if (period && typeof rowLocalY === 'number') {
    return sectionY + periodY + rowLocalY;
  }
  return sectionY > 0 ? sectionY : undefined;
};

const handleTipCompletionTransitions = ({
  nutritionPlanTipProgress,
  previousFulfilledByKeyRef,
  hasInitializedFulfilledTrackingRef,
  pendingCompletionScrollTimeoutRef,
  pendingCompletionAnimTimeoutRef,
  onTipCompleted,
  tipRowPeriodByKeyRef,
  tipRowLocalYByKeyRef,
  fulfilledTipsSectionYRef,
  periodSectionYRef,
  animateTipCompletion,
}: HandleTipCompletionTransitionsParams) => {
  const nextFulfilledByKey: Record<string, boolean> = {};
  const newlyFulfilledTipKeys: string[] = [];
  nutritionPlanTipProgress.forEach(tipProgress => {
    const tipKey = getTipProgressKey(tipProgress);
    const wasFulfilled = previousFulfilledByKeyRef.current[tipKey] ?? false;
    nextFulfilledByKey[tipKey] = tipProgress.isFulfilled;
    if (tipProgress.isFulfilled && !wasFulfilled) {
      newlyFulfilledTipKeys.push(tipKey);
    }
  });
  if (!hasInitializedFulfilledTrackingRef.current) {
    previousFulfilledByKeyRef.current = nextFulfilledByKey;
    hasInitializedFulfilledTrackingRef.current = true;
    return;
  }
  if (newlyFulfilledTipKeys.length > 0) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    const firstNewlyFulfilledTip = newlyFulfilledTipKeys[0];
    if (pendingCompletionScrollTimeoutRef.current) {
      clearTimeout(pendingCompletionScrollTimeoutRef.current);
    }
    if (pendingCompletionAnimTimeoutRef.current) {
      clearTimeout(pendingCompletionAnimTimeoutRef.current);
    }
    requestAnimationFrame(() => {
      pendingCompletionScrollTimeoutRef.current = setTimeout(() => {
        onTipCompleted?.(
          computeTargetY(
            firstNewlyFulfilledTip,
            tipRowPeriodByKeyRef.current,
            tipRowLocalYByKeyRef.current,
            fulfilledTipsSectionYRef.current,
            periodSectionYRef.current
          )
        );
        pendingCompletionScrollTimeoutRef.current = null;
      }, COMPLETION_SCROLL_DELAY_MS);
    });
    pendingCompletionAnimTimeoutRef.current = setTimeout(() => {
      newlyFulfilledTipKeys.forEach(key => animateTipCompletion(key));
      pendingCompletionAnimTimeoutRef.current = null;
    }, COMPLETION_SCROLL_DELAY_MS + COMPLETION_ANIMATION_DELAY_AFTER_SCROLL_MS);
  }
  previousFulfilledByKeyRef.current = nextFulfilledByKey;
};

export const useNutritionTipCompletion = ({ selectedDate, weekStartKey, onTipCompleted }: UseNutritionTipCompletionParams) => {
  const nutritionPlanTipProgress = useNutritionPlanProgress(selectedDate);
  const { claimNutritionTipCompletionXP } = useStorage();

  const previousFulfilledByKeyRef = useRef<Record<string, boolean>>({});
  const hasInitializedFulfilledTrackingRef = useRef(false);
  const completionAnimByKeyRef = useRef<Record<string, Animated.Value>>({});
  const fulfilledTipsSectionYRef = useRef(0);
  const periodSectionYRef = useRef<Record<NutritionTargetPeriod, number>>({
    daily: 0,
    weekly: 0,
  });
  const tipRowLocalYByKeyRef = useRef<Record<string, number>>({});
  const tipRowPeriodByKeyRef = useRef<Record<string, NutritionTargetPeriod>>({});
  const pendingCompletionScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCompletionAnimTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getCompletionAnimValue = useCallback((tipKey: string): Animated.Value => {
    if (!completionAnimByKeyRef.current[tipKey]) {
      completionAnimByKeyRef.current[tipKey] = new Animated.Value(0);
    }
    return completionAnimByKeyRef.current[tipKey];
  }, []);

  const animateTipCompletion = useCallback(
    (tipKey: string) => {
      const anim = getCompletionAnimValue(tipKey);
      anim.stopAnimation();
      anim.setValue(0);
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [getCompletionAnimValue]
  );

  const nutritionPlanTipProgressByPeriod = useMemo(() => {
    const byPeriod = (period: NutritionTargetPeriod) =>
      nutritionPlanTipProgress
        .filter(tipProgress => tipProgress.period === period)
        .sort((left, right) => {
          if (left.isFulfilled !== right.isFulfilled) {
            return left.isFulfilled ? -1 : 1;
          }
          if (left.progress !== right.progress) {
            return right.progress - left.progress;
          }
          return left.title.localeCompare(right.title);
        });
    return {
      daily: byPeriod('daily'),
      weekly: byPeriod('weekly'),
    };
  }, [nutritionPlanTipProgress]);

  useEffect(() => {
    previousFulfilledByKeyRef.current = {};
    hasInitializedFulfilledTrackingRef.current = false;
    periodSectionYRef.current = {
      daily: 0,
      weekly: 0,
    };
    tipRowLocalYByKeyRef.current = {};
    tipRowPeriodByKeyRef.current = {};
    if (pendingCompletionScrollTimeoutRef.current) {
      clearTimeout(pendingCompletionScrollTimeoutRef.current);
      pendingCompletionScrollTimeoutRef.current = null;
    }
    if (pendingCompletionAnimTimeoutRef.current) {
      clearTimeout(pendingCompletionAnimTimeoutRef.current);
      pendingCompletionAnimTimeoutRef.current = null;
    }
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      if (pendingCompletionScrollTimeoutRef.current) {
        clearTimeout(pendingCompletionScrollTimeoutRef.current);
      }
      if (pendingCompletionAnimTimeoutRef.current) {
        clearTimeout(pendingCompletionAnimTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    handleTipCompletionTransitions({
      nutritionPlanTipProgress,
      previousFulfilledByKeyRef,
      hasInitializedFulfilledTrackingRef,
      pendingCompletionScrollTimeoutRef,
      pendingCompletionAnimTimeoutRef,
      onTipCompleted,
      tipRowPeriodByKeyRef,
      tipRowLocalYByKeyRef,
      fulfilledTipsSectionYRef,
      periodSectionYRef,
      animateTipCompletion,
    });
  }, [animateTipCompletion, nutritionPlanTipProgress, onTipCompleted]);

  useEffect(() => {
    nutritionPlanTipProgress.forEach(tipProgress => {
      if (!tipProgress.isFulfilled) return;
      if (tipProgress.period === 'daily') {
        claimNutritionTipCompletionXP?.({
          claimKey: `${tipProgress.tipId}|daily|${selectedDate}`,
          tipId: tipProgress.tipId,
          period: 'daily',
          periodKey: selectedDate,
          amount: XP_FOR_NUTRITION_TIP_DAILY_COMPLETION,
        });
      }
      if (tipProgress.period === 'weekly') {
        claimNutritionTipCompletionXP?.({
          claimKey: `${tipProgress.tipId}|weekly|${weekStartKey}`,
          tipId: tipProgress.tipId,
          period: 'weekly',
          periodKey: weekStartKey,
          amount: XP_FOR_NUTRITION_TIP_WEEKLY_COMPLETION,
        });
      }
    });
  }, [claimNutritionTipCompletionXP, nutritionPlanTipProgress, selectedDate, weekStartKey]);

  return {
    fulfilledTipsSectionYRef,
    periodSectionYRef,
    nutritionPlanTipProgressByPeriod,
    getCompletionAnimValue,
    tipRowLocalYByKeyRef,
    tipRowPeriodByKeyRef,
  };
};
