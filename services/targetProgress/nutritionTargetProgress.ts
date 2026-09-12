import type { DailyNutritionSummary, DailyNutritionTracking, WeeklyNutritionTracking } from '@/app/context/storage/nutrition/nutritionTypes';
import type { SupplementTime } from '@/app/domain/SupplementTime';
import type { NutritionTargetUnit } from '@/types/nutritionTargets';

import { getTargetDates } from './dateRange';
import type { NutritionTargetDefinition } from './targetProgressTypes';

export type TakenDates = Record<string, SupplementTime[]>;

export type NutritionTargetDetails = {
  actual: number;
  foodActual: number;
  supplementActual: number;
};

// ─────────────────────────────────────────────────────────────
// Unit conversion
// ─────────────────────────────────────────────────────────────

const normalizeUnit = (unit: string | undefined): string => (unit ?? '').trim().toLowerCase();

export const toMilligrams = (quantity: number, unit: string): number | null => {
  const normalizedUnit = normalizeUnit(unit);

  if (normalizedUnit === 'mg') {
    return quantity;
  }

  if (normalizedUnit === 'g') {
    return quantity * 1000;
  }

  if (normalizedUnit === 'mcg' || normalizedUnit === 'ug' || normalizedUnit === 'μg') {
    return quantity / 1000;
  }

  return null;
};

export const toMicrograms = (quantity: number, unit: string): number | null => {
  const normalizedUnit = normalizeUnit(unit);

  if (normalizedUnit === 'g') {
    return quantity * 1_000_000;
  }

  if (normalizedUnit === 'mg') {
    return quantity * 1000;
  }

  if (normalizedUnit === 'mcg' || normalizedUnit === 'ug' || normalizedUnit === 'μg') {
    return quantity;
  }

  return null;
};

export const toGrams = (quantity: number, unit: string): number | null => {
  const normalizedUnit = normalizeUnit(unit);

  if (normalizedUnit === 'g') {
    return quantity;
  }

  if (normalizedUnit === 'mg') {
    return quantity / 1000;
  }

  if (normalizedUnit === 'mcg' || normalizedUnit === 'ug' || normalizedUnit === 'μg') {
    return quantity / 1_000_000;
  }

  return null;
};

const convertQuantity = (quantity: number, sourceUnit: string, targetUnit: NutritionTargetUnit): number | null => {
  switch (targetUnit) {
    case 'mg':
      return toMilligrams(quantity, sourceUnit);

    case 'μg':
      return toMicrograms(quantity, sourceUnit);

    case 'g':
      return toGrams(quantity, sourceUnit);

    default:
      return null;
  }
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const normalizeSupplementKey = (value: string | undefined): string => (value ?? '').trim().toLowerCase();

const parseQuantity = (value: string | number | undefined): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number.parseFloat((value ?? '').replace(',', '.'));

  return Number.isFinite(parsed) ? parsed : null;
};

const getNumericRecordValue = (source: object | undefined, key: string): number => {
  if (!source) {
    return 0;
  }

  const value = (source as Record<string, number | undefined>)[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};

const resolveNutritionValueFromMeals = (meals: DailyNutritionSummary['meals'], trackingKey: string): number => {
  return meals.reduce((total, meal) => {
    const sources = [meal.fiberByType, meal.fiberSubtypeTotals, meal.polyphenolByType, meal.mineralsByType, meal.vitaminsByType, meal.aminoAcidsByType];

    for (const source of sources) {
      const value = getNumericRecordValue(source, trackingKey);

      if (value !== 0) {
        return total + value;
      }
    }

    return total;
  }, 0);
};

/**
 * Nutrient maps are stored using the same convention as before:
 * nutrient values are essentially represented in mg, while μg targets
 * therefore need converting from mg -> μg.
 *
 * Macro/fiber totals are already stored in their normal unit.
 */
const convertFoodValueToTargetUnit = (value: number, targetUnit: NutritionTargetUnit): number => {
  if (targetUnit === 'μg') {
    return value * 1000;
  }

  return value;
};

const resolveFoodActual = ({ target, summary }: { target: NutritionTargetDefinition; summary: DailyNutritionSummary | undefined }): number => {
  if (!summary) {
    return 0;
  }

  const trackingKey = target.trackingKey;

  switch (trackingKey) {
    case 'fiber_total':
      return summary.totals?.fiber ?? 0;

    case 'protein':
      return summary.totals?.protein ?? 0;

    case 'calories':
      return summary.totals?.calories ?? 0;

    case 'carbohydrates':
      return summary.totals?.carbohydrates ?? 0;

    case 'fat':
      return summary.totals?.fat ?? 0;

    default: {
      const rawValue = resolveNutritionValueFromMeals(summary.meals ?? [], trackingKey);

      return convertFoodValueToTargetUnit(rawValue, target.unit);
    }
  }
};

const resolveSupplementActual = ({
  target,
  dateKey,
  takenDates,
  supplementIds,
}: {
  target: NutritionTargetDefinition;
  dateKey: string;
  takenDates: TakenDates;
  supplementIds: readonly string[];
}): number => {
  if (target.unit !== 'mg' && target.unit !== 'g' && target.unit !== 'μg') {
    return 0;
  }

  if (supplementIds.length === 0) {
    return 0;
  }

  const matchedIds = new Set(supplementIds.map(normalizeSupplementKey).filter(Boolean));

  if (matchedIds.size === 0) {
    return 0;
  }

  const supplementsForDay = takenDates[dateKey] ?? [];

  let total = 0;

  supplementsForDay.forEach(supplement => {
    const components = supplement.components?.length ? supplement.components : [supplement];

    components.forEach(component => {
      const idKey = normalizeSupplementKey(component.id);

      const nameKey = normalizeSupplementKey(component.name);

      if (!matchedIds.has(idKey) && !matchedIds.has(nameKey)) {
        return;
      }

      const quantity = parseQuantity(component.quantity);

      if (quantity === null) {
        return;
      }

      const converted = convertQuantity(quantity, component.unit ?? '', target.unit);

      if (converted === null) {
        return;
      }

      total += converted;
    });
  });

  return total;
};

// ─────────────────────────────────────────────────────────────
// Daily target details
// ─────────────────────────────────────────────────────────────

export const resolveDailyNutritionTargetDetails = ({
  target,
  dateKey,
  dailyNutritionTracking,
  takenDates = {},
  supplementIds,
}: {
  target: NutritionTargetDefinition;
  dateKey: string;
  dailyNutritionTracking: DailyNutritionTracking;
  takenDates?: TakenDates;

  /**
   * IDs associated with this target/tip.
   *
   * If supplied, these take precedence over target.supplementIds.
   */
  supplementIds?: readonly string[];
}): NutritionTargetDetails => {
  const summary = dailyNutritionTracking[dateKey];

  const foodActual = resolveFoodActual({
    target,
    summary,
  });

  const resolvedSupplementIds = supplementIds ?? target.supplementIds ?? [];

  const supplementActual = resolveSupplementActual({
    target,
    dateKey,
    takenDates,
    supplementIds: resolvedSupplementIds,
  });

  const actual = foodActual + supplementActual;

  return {
    actual,
    foodActual,
    supplementActual,
  };
};

// ─────────────────────────────────────────────────────────────
// Weekly targets
// ─────────────────────────────────────────────────────────────

const resolveWeeklyNutritionTarget = ({
  target,
  selectedDate,
  weeklyNutritionTracking,
}: {
  target: NutritionTargetDefinition;
  selectedDate: string;
  weeklyNutritionTracking: WeeklyNutritionTracking;
}): number => {
  const weekStartKey = getTargetDates(selectedDate, 'weekly')[0];

  const value = weeklyNutritionTracking[weekStartKey]?.[target.trackingKey];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    const uniqueItems = new Set(value.map(item => (item.en ?? item.local ?? '').trim().toLowerCase()).filter(Boolean));

    return uniqueItems.size;
  }

  return 0;
};

// ─────────────────────────────────────────────────────────────
// Public resolver used by targetProgressService
// ─────────────────────────────────────────────────────────────

export const resolveNutritionTarget = ({
  target,
  selectedDate,
  dailyNutritionTracking,
  weeklyNutritionTracking,
  takenDates = {},
  supplementIds,
}: {
  target: NutritionTargetDefinition;
  selectedDate: string;
  dailyNutritionTracking: DailyNutritionTracking;
  weeklyNutritionTracking: WeeklyNutritionTracking;
  takenDates?: TakenDates;
  supplementIds?: readonly string[];
}): number => {
  if (target.period === 'weekly') {
    return resolveWeeklyNutritionTarget({
      target,
      selectedDate,
      weeklyNutritionTracking,
    });
  }

  return resolveDailyNutritionTargetDetails({
    target,
    dateKey: selectedDate,
    dailyNutritionTracking,
    takenDates,
    supplementIds,
  }).actual;
};
