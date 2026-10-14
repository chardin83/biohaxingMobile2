import { distributionForAge, DISTRIBUTIONS, goalsForDistribution, minimumProteinGoal } from '../nutritionGoals';

it('uses 15 percent protein in the balanced distribution and totals 100 percent', () => {
  expect(DISTRIBUTIONS.balanced).toEqual({ protein: 15, carbohydrates: 55, fat: 30 });
  expect(goalsForDistribution('balanced', 2000, 70)).toEqual({ protein: 75, carbohydrates: 275, fat: 67 });
});

it.each(['balanced', 'lowCarb', 'ketogenic', 'lowFat'] as const)('uses 15 percent protein and totals 100 percent for %s', distribution => {
  const percentages = DISTRIBUTIONS[distribution];
  expect(percentages.protein).toBe(15);
  expect(percentages.protein + percentages.carbohydrates + percentages.fat).toBe(100);
  expect(goalsForDistribution(distribution, 2000, 70).protein).toBe(75);
});

it('raises protein to at least 0.83 g/kg and transfers energy from carbohydrates', () => {
  const goals = goalsForDistribution('balanced', 1600, 100);
  expect(goals).toEqual({ protein: 83, carbohydrates: 197, fat: 53 });
  expect(goals.protein * 4 + goals.carbohydrates * 4 + goals.fat * 9).toBeCloseTo(1600, -1);
});

it('rounds the weight minimum up so it never falls below the reference', () => {
  expect(minimumProteinGoal(70)).toBe(59);
  expect(goalsForDistribution('ketogenic', 1000, 100).protein).toBe(83);
});

it.each([undefined, 0, -5, NaN, Infinity])('does not invent a weight minimum for invalid weight %s', weight => {
  expect(minimumProteinGoal(weight)).toBe(0);
  expect(goalsForDistribution('balanced', 2000, weight).protein).toBe(75);
});

const today = new Date(2026, 9, 13);

it.each(['balanced', 'lowCarb', 'ketogenic', 'lowFat'] as const)('uses 18 percent protein and the senior minimum from age 65 with %s', distribution => {
  const percentages = distributionForAge(distribution, '1960-10-13', today);
  expect(percentages.protein).toBe(18);
  expect(percentages.protein + percentages.carbohydrates + percentages.fat).toBe(100);
  expect(goalsForDistribution(distribution, 2000, 70, '1960-10-13', today).protein).toBe(105);
});

it.each(['1961-10-14', '1990-01-01', undefined, 'invalid', '2030-01-01'])('keeps the adult default below age 65 or for unknown birth date %s', birthDate => {
  expect(distributionForAge('balanced', birthDate, today).protein).toBe(15);
});

it('keeps carbohydrate levels in low-carb presets and fat levels in other presets when adjusting for age', () => {
  expect(distributionForAge('ketogenic', '1950-01-01', today)).toEqual({ protein: 18, carbohydrates: 5, fat: 77 });
  expect(distributionForAge('lowCarb', '1950-01-01', today)).toEqual({ protein: 18, carbohydrates: 20, fat: 62 });
  expect(distributionForAge('balanced', '1950-01-01', today)).toEqual({ protein: 18, carbohydrates: 52, fat: 30 });
  expect(distributionForAge('lowFat', '1950-01-01', today)).toEqual({ protein: 18, carbohydrates: 62, fat: 20 });
});

it('still applies the weight minimum when it exceeds the older adult energy target', () => {
  expect(goalsForDistribution('balanced', 1200, 100, '1950-01-01', today).protein).toBe(150);
});

it('switches both the percentage and minimum on the 65th birthday', () => {
  expect(minimumProteinGoal(70, '1961-10-13', new Date(2026, 9, 12))).toBe(59);
  expect(minimumProteinGoal(70, '1961-10-13', today)).toBe(105);
  expect(distributionForAge('balanced', '1961-10-13', today).protein).toBe(18);
});

it('allows the energy-based goal to exceed the senior minimum', () => {
  expect(goalsForDistribution('balanced', 3000, 70, '1961-10-13', today).protein).toBe(135);
});

it('keeps energy consistent when the senior minimum exhausts ketogenic carbohydrates', () => {
  const goals = goalsForDistribution('ketogenic', 2000, 100, '1961-10-13', today);
  expect(goals.protein).toBe(150);
  expect(goals.carbohydrates).toBe(0);
  expect(Math.abs(goals.protein * 4 + goals.carbohydrates * 4 + goals.fat * 9 - 2000)).toBeLessThanOrEqual(5);
});
