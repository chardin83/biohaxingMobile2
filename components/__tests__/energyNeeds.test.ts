import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';
import { calculateEnergyNeeds } from '@/utils/energyNeeds';

const today = new Date(2026, 9, 3);
const profile: UserProfile = { birthDate: '1996-10-03', weightKg: 80, heightCm: 180, biologicalSex: 'male', activityPal: 1.6 };

describe('energy needs', () => {
  it('calculates basal metabolism, activity energy and total', () => {
    expect(calculateEnergyNeeds(profile, today)).toEqual({ basal: 1780, activity: 1068, total: 2848, pal: 1.6 });
  });

  it('uses the female coefficient', () => {
    expect(calculateEnergyNeeds({ ...profile, biologicalSex: 'female' }, today)?.basal).toBe(1614);
  });

  it('changes activity energy without changing basal metabolism', () => {
    expect(calculateEnergyNeeds({ ...profile, activityPal: 1.2 }, today)).toEqual({ basal: 1780, activity: 356, total: 2136, pal: 1.2 });
  });

  it.each([
    [1.1, 178, 1958],
    [2.4, 2492, 4272],
  ])('supports the extended activity level %s', (pal, activity, total) => {
    expect(calculateEnergyNeeds({ ...profile, activityPal: pal }, today)).toEqual({ basal: 1780, activity, total, pal });
  });

  it('keeps displayed rounded numbers consistent', () => {
    const result = calculateEnergyNeeds({ ...profile, weightKg: 80.25, heightCm: 179.5, activityPal: 1.4 }, today)!;
    expect(result.basal + result.activity).toBe(result.total);
  });

  it.each([
    { weightKg: undefined },
    { heightCm: 0 },
    { activityPal: undefined },
    { birthDate: 'invalid' },
    { weightKg: Number.NaN },
    { biologicalSex: 'intersex' as const },
    { birthDate: '2020-10-03' },
  ])('does not invent estimates for incomplete or unsupported data: %s', updates => {
    expect(calculateEnergyNeeds({ ...profile, ...updates }, today)).toBeNull();
  });
});
