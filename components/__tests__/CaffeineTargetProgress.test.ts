import { renderHook } from '@testing-library/react-native';

import { addNutritionEntryToTracking, removeNutritionEntryFromTracking } from '@/app/context/storage/nutrition/nutritionStorage';
import type { DailyNutritionTracking, NutritionEntry } from '@/app/context/storage/nutrition/nutritionTypes';
import { useNutritionPlanProgress } from '@/hooks/nutrition/useNutritionPlanProgress';
import { useNutritionTipTargets } from '@/hooks/nutrition/useNutritionTipTargets';
import { getDrinkNutritionData } from '@/locales/drinkCatalog';
import { tips } from '@/locales/tips';
import { normalizeNutritionTargets } from '@/services/targetProgress/normalizeNutritionTargets';
import { resolveDailyNutritionTargetDetails } from '@/services/targetProgress/nutritionTargetProgress';
import { getTargetProgress } from '@/services/targetProgress/targetProgressService';

const date = '2026-10-16';
const tip = tips.find(item => item.id === 'coffee_polyphenols_longevity')!;
let mockTracking: DailyNutritionTracking = {};
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({
  plans: { nutrition: [{ tipId: 'coffee_polyphenols_longevity' }] }, userProfile: {},
  dailyNutritionTracking: mockTracking, weeklyNutritionTracking: {}, dailyHabitTracking: {}, dailyTrainingTracking: {}, takenDates: {},
}) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const coffee: NutritionEntry = { id: 'coffee', type: 'drink', recordedAt: `${date}T12:00:00Z`, ...getDrinkNutritionData('coffee', 'Coffee', 200) };
const caffeineTarget = () => normalizeNutritionTargets(tip).find(target => target.trackingKey === 'caffeine')!;

beforeEach(() => { mockTracking = {}; });

it.each([[1, 90, false], [2, 180, false], [3, 270, true]] as const)('tracks %s standard cups against the caffeine goal', (cups, amount, fulfilled) => {
  const target = caffeineTarget();
  expect(target).toMatchObject({ amount: 270, unit: 'mg', labelGroup: 'nutrientLabels' });
  let tracking: DailyNutritionTracking = {};
  for (let index = 0; index < cups; index++) {
    tracking = addNutritionEntryToTracking(tracking, date, { ...coffee, id: `coffee-${index}` });
  }
  const progress = getTargetProgress({ target, selectedDate: date, storage: {
    dailyNutritionTracking: tracking, weeklyNutritionTracking: {}, dailyHabitTracking: {}, dailyTrainingTracking: {}, takenDates: {},
  } });
  expect(progress).toMatchObject({ current: amount, target: 270, isFulfilled: fulfilled });
});

it('counts food and drinks once and updates the plan and journal when an entry is removed', () => {
  mockTracking = addNutritionEntryToTracking({}, date, { ...coffee, ...getDrinkNutritionData('coffee', 'Coffee', 600) });
  const { result, rerender } = renderHook(() => ({ plan: useNutritionPlanProgress(date), journal: useNutritionTipTargets([date]) }));
  expect(result.current.plan[0].targets.find(target => target.tag === 'caffeine')).toMatchObject({ actual: 270, isMet: true });
  expect(result.current.journal[date][tip.id].find(target => target.tag === 'caffeine')).toMatchObject({ actual: 270, isMet: true, label: 'journal:nutritionLogger.nutrientLabels.caffeine' });
  expect(result.current.plan[0].isFulfilled).toBe(true);
  mockTracking = removeNutritionEntryFromTracking(mockTracking, date, 'coffee');
  rerender({});
  expect(result.current.plan[0].targets.find(target => target.tag === 'caffeine')).toMatchObject({ actual: 0, isMet: false });
  expect(result.current.journal[date][tip.id].find(target => target.tag === 'caffeine')).toMatchObject({ actual: 0, isMet: false });
});

it('adds caffeine from food and keeps unrelated days separate', () => {
  const food: NutritionEntry = { ...coffee, id: 'food', type: 'food', caffeineMg: 20 };
  const tracking = addNutritionEntryToTracking(addNutritionEntryToTracking({}, date, coffee), date, food);
  const target = caffeineTarget();
  const details = resolveDailyNutritionTargetDetails({ target, dateKey: date, dailyNutritionTracking: tracking });
  expect(details).toMatchObject({ actual: 110, foodActual: 110 });
  expect(resolveDailyNutritionTargetDetails({ target, dateKey: '2026-10-15', dailyNutritionTracking: tracking }).actual).toBe(0);
});
