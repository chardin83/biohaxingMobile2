import type { DailyNutritionTracking, NutritionEntry } from '@/app/context/storage/nutrition/nutritionTypes';
import { ESSENTIAL_AMINO_ACID_KEYS } from '@/constants/aminoAcids';
import { tips } from '@/locales/tips';
import { normalizeNutritionTargets } from '@/services/targetProgress/normalizeNutritionTargets';
import { getTargetProgress } from '@/services/targetProgress/targetProgressService';
import { resolveNutritionTip } from '@/utils/resolveNutritionTip';

const tip = tips.find(item => item.id === 'protein_rotation')!;

it('covers all nine essential amino acids using WHO adult mg/kg/day rates', () => {
  const targets = normalizeNutritionTargets(tip, 70, 140).filter(target => target.tag !== 'protein');
  expect(targets.map(target => target.tag)).toEqual([...ESSENTIAL_AMINO_ACID_KEYS]);
  expect(targets.map(target => target.amount)).toEqual([700, 1400, 2730, 2100, 1050, 1750, 1050, 280, 1820]);
  expect(targets.every(target => target.unit === 'mg' && target.period === 'daily')).toBe(true);
});

it('recalculates from current weight without modifying the tip catalog', () => {
  const first = resolveNutritionTip(tip, 60);
  const second = resolveNutritionTip(tip, 80);
  expect(first.aminoAcidTargets?.find(target => target.tag === 'leucine')?.amount).toBe(2340);
  expect(second.aminoAcidTargets?.find(target => target.tag === 'leucine')?.amount).toBe(3120);
  expect(tip.aminoAcidTargets?.every(target => target.amount === 0)).toBe(true);
});

it.each([undefined, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])('does not create zero or invented targets for invalid weight %s', weight => {
  expect(normalizeNutritionTargets(tip, weight, 140)).toEqual([]);
});

it('keeps existing fixed targets unchanged', () => {
  const fixed = tips.find(item => item.aminoAcidTargets?.some(target => target.tag === 'glycine'))!;
  expect(normalizeNutritionTargets(fixed, 60)).toEqual(normalizeNutritionTargets(fixed, 100));
});

it('counts combined sulphur and aromatic amino acids toward the correct goals', () => {
  const date = '2026-10-13';
  const entry: NutritionEntry = {
    id: 'meal',
    type: 'meal',
    name: 'Food',
    recordedAt: date,
    protein: 0,
    calories: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    aminoAcidsByType: { methionine: 600, cysteine: 500, phenylalanine: 800, tyrosine: 1000, leucine: 100 },
  };
  const dailyNutritionTracking: DailyNutritionTracking = {
    [date]: {
      date,
      entries: [entry],
      totals: { protein: 0, calories: 0, carbohydrates: 0, fat: 0, fiber: 0 },
      goalsMet: { protein: false, calories: false, carbohydrates: false, fat: false, fiber: false },
    },
  };
  const storage = { dailyNutritionTracking, weeklyNutritionTracking: {}, dailyHabitTracking: {}, dailyTrainingTracking: {}, takenDates: {} };
  const targets = normalizeNutritionTargets(tip, 70, 140);
  for (const [tag, current] of [
    ['methionine', 1100],
    ['phenylalanine', 1800],
  ] as const) {
    const target = targets.find(item => item.tag === tag)!;
    expect(getTargetProgress({ target, selectedDate: date, storage })).toMatchObject({ current, isFulfilled: true });
    expect(getTargetProgress({ target, selectedDate: '2026-10-14', storage })).toMatchObject({ current: 0, isFulfilled: false });
  }
});

it('uses the profile protein goal and keeps the WHO amino acid goals independent', () => {
  const first = normalizeNutritionTargets(tip, 70, 140);
  const second = normalizeNutritionTargets(tip, 70, 160);
  expect(first).toHaveLength(10);
  expect(first.find(target => target.tag === 'protein')).toMatchObject({ amount: 140, unit: 'g', period: 'daily', labelGroup: 'macroLabels' });
  expect(second.find(target => target.tag === 'protein')?.amount).toBe(160);
  expect(first.filter(target => target.tag !== 'protein')).toEqual(second.filter(target => target.tag !== 'protein'));
});

it.each([undefined, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])('does not allow tracking with an unset or invalid protein goal %s', goal => {
  expect(normalizeNutritionTargets(tip, 70, goal)).toEqual([]);
  expect(resolveNutritionTip(tip, 70, goal).proteinTargets).toEqual([]);
});

it('counts total dietary protein in grams rather than summing amino acids', () => {
  const target = normalizeNutritionTargets(tip, 70, 140).find(item => item.tag === 'protein')!;
  const date = '2026-10-13';
  const dailyNutritionTracking: DailyNutritionTracking = {
    [date]: {
      date,
      entries: [],
      totals: { protein: 145, calories: 0, carbohydrates: 0, fat: 0, fiber: 0 },
      goalsMet: { protein: true, calories: false, carbohydrates: false, fat: false, fiber: false },
    },
  };
  const storage = { dailyNutritionTracking, weeklyNutritionTracking: {}, dailyHabitTracking: {}, dailyTrainingTracking: {}, takenDates: {} };
  expect(getTargetProgress({ target, selectedDate: date, storage })).toMatchObject({ current: 145, target: 140, unit: 'g', isFulfilled: true });
});
