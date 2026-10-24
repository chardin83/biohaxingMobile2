import type { DrinkType } from '@/services/gptServices';

export function hasCaffeine(drink: { type?: DrinkType; caffeinated?: boolean }): boolean {
  if (typeof drink.caffeinated === 'boolean') return drink.caffeinated;
  return drink.type === 'coffee' || drink.type === 'tea' || drink.type === 'energy_drink' || drink.type === 'sugar_free_energy_drink';
}
