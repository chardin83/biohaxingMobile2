import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { COACH_WEEKLY_QUESTION_LIMIT, PREMIUM } from '@/constants/Premium';
import { claimCoachQuestion,type CoachQuestionUsage, getCoachQuestionUsage, getNextCoachReset } from '@/services/coach/weeklyQuestions';

export function useCoachQuestions() {
  const [usage, setUsage] = useState<CoachQuestionUsage | null>(null);
  const refresh = useCallback(async () => {
    setUsage(await getCoachQuestionUsage());
  }, []);
  useFocusEffect(useCallback(() => {
    refresh().catch(console.error);
  }, [refresh]));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh().catch(console.error);
    });
    return () => subscription.remove();
  }, [refresh]);
  useEffect(() => {
    const timer = setTimeout(() => { refresh().catch(console.error); }, getNextCoachReset().getTime() - Date.now());
    return () => clearTimeout(timer);
  }, [refresh, usage?.week]);
  const consumeQuestion = useCallback(async () => {
    if (PREMIUM) return true;
    const result = await claimCoachQuestion();
    setUsage(result.usage);
    return result.allowed;
  }, []);
  return {
    remaining: PREMIUM ? Number.POSITIVE_INFINITY : COACH_WEEKLY_QUESTION_LIMIT - (usage?.used ?? 0),
    total: COACH_WEEKLY_QUESTION_LIMIT,
    ready: PREMIUM || usage !== null,
    consumeQuestion,
  };
}
