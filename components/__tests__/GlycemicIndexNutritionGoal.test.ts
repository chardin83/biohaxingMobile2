import { act, renderHook } from '@testing-library/react-native';
import type { DailyNutritionTracking, NutritionEntry } from '@/app/context/storage/nutrition/nutritionTypes';
import { useNutritionPlanProgress } from '@/hooks/nutrition/useNutritionPlanProgress';
import { useNutritionTipTargets } from '@/hooks/nutrition/useNutritionTipTargets';
import { tips } from '@/locales/tips';
import { prepareManualHabitResult } from '@/services/targetProgress/habitResultStorage';
import { logHabitTarget } from '@/services/targetProgress/habitTrackingService';
import { getNutritionInputSignature } from '@/services/targetProgress/completedNutritionProgress';

const date = '2026-10-11';
const mockStorage = {
  plans: { nutrition: [{ tipId: 'glycemic_index', startedAt: '2026-01-01', planCategory: 'nutrition' as const, createdBy: 'user', editedAt: '', editedBy: 'user' }], other: [] },
  userProfile: {}, dailyNutritionTracking: {} as DailyNutritionTracking,
  dailyHabitTracking: {} as Record<string, Record<string, { value: number; isFulfilled?: boolean }>>,
  weeklyNutritionTracking: {}, dailyTrainingTracking: {}, takenDates: {},
};
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => mockStorage }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const meal: NutritionEntry = { id: 'meal', name: 'Rice meal', type: 'meal', recordedAt: `${date}T12:00:00`, calories: 100, protein: 0, fat: 0, fiber: 0, carbohydrates: 20, glycemicIndex: 50 };
function log(entries: NutritionEntry[]) {
  mockStorage.dailyNutritionTracking = { [date]: { date, entries, totals: { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 }, goalsMet: { calories: false, protein: false, carbohydrates: false, fat: false, fiber: false } } };
}
beforeEach(() => {
  jest.useFakeTimers(); jest.setSystemTime(new Date(`${date}T12:00:00`));
  mockStorage.dailyNutritionTracking = {}; mockStorage.dailyHabitTracking = {};
});
afterEach(() => jest.useRealTimers());

it('keeps one nutrition tip with two requirements; neither meal nor review completes it alone', () => {
  const gi = tips.find(tip => tip.id === 'glycemic_index')!;
  expect(gi.planCategory).toEqual(['nutrition']);
  const { result, rerender } = renderHook(() => useNutritionPlanProgress(date));
  expect(result.current).toHaveLength(1);
  expect(result.current[0]).toMatchObject({ totalCount: 2, metCount: 0, isFulfilled: false });
  act(() => { log([meal]); }); rerender({});
  expect(result.current[0]).toMatchObject({ metCount: 1, isFulfilled: false });
  const review = prepareManualHabitResult(mockStorage.plans.nutrition, 'glycemic_index_review', date, logHabitTarget({ value: 1, slot: 'daily' }))!;
  expect(review.isFulfilled).toBe(true);
  act(() => { mockStorage.dailyHabitTracking = { [date]: { glycemic_index_review: review } }; }); rerender({});
  expect(result.current[0]).toMatchObject({ metCount: 2, isFulfilled: true });
  act(() => { log([]); }); rerender({});
  expect(result.current[0]).toMatchObject({ metCount: 1, isFulfilled: false });
});

it('does not count unknown GI, zero-carb meals, or drinks as a logged meal with GI', () => {
  log([{ ...meal, glycemicIndex: undefined }, { ...meal, id: 'no-carbs', carbohydrates: 0 }, { ...meal, id: 'drink', type: 'drink' }]);
  const { result } = renderHook(() => useNutritionPlanProgress(date));
  expect(result.current[0].metCount).toBe(0);
});

it('exposes both targets in daily nutrition details and starts fresh on another day', () => {
  log([meal]); mockStorage.dailyHabitTracking = { [date]: { glycemic_index_review: { value: 1, isFulfilled: true } } };
  const { result } = renderHook(() => useNutritionTipTargets([date, '2026-10-12']));
  expect(result.current[date].glycemic_index).toHaveLength(2);
  expect(result.current[date].glycemic_index.every(target => target.isMet)).toBe(true);
  expect(result.current['2026-10-12'].glycemic_index.every(target => !target.isMet)).toBe(true);
});

it('invalidates a completion snapshot if the review is undone', () => {
  const signature = getNutritionInputSignature('daily', date, mockStorage);
  mockStorage.dailyHabitTracking = { [date]: { glycemic_index_review: { value: 1, isFulfilled: true } } };
  expect(getNutritionInputSignature('daily', date, mockStorage)).not.toBe(signature);
});
