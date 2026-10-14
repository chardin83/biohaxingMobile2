import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';
import { calculateEnergyNeeds } from '@/utils/energyNeeds';

const today = new Date(2026, 9, 3);
const profile: UserProfile = { birthDate: '1996-10-03', weightKg: 80, heightCm: 180, biologicalSex: 'male', activityPal: 1.6 };

describe('energy needs', () => {
  it.each([
    [18, 1824, 1651], [24, 1824, 1651], [25, 1745, 1546],
    [50, 1745, 1546], [51, 1630, 1449], [75, 1630, 1449],
  ])('uses NNR weight-height coefficients for age %s', (age, male, female) => {
    const agedProfile = { ...profile, birthDate: `${2026 - age}-10-03` };
    expect(calculateEnergyNeeds(agedProfile, today)?.basal).toBe(male);
    expect(calculateEnergyNeeds({ ...agedProfile, biologicalSex: 'female' }, today)?.basal).toBe(female);
  });
  it('calculates basal metabolism, activity energy and total', () => {
    expect(calculateEnergyNeeds(profile, today)).toEqual({ basal: 1745, activity: 1047, total: 2792, pal: 1.6 });
  });

  it('uses the female coefficient', () => {
    expect(calculateEnergyNeeds({ ...profile, biologicalSex: 'female' }, today)?.basal).toBe(1546);
  });

  it('changes activity energy without changing basal metabolism', () => {
    expect(calculateEnergyNeeds({ ...profile, activityPal: 1.2 }, today)).toEqual({ basal: 1745, activity: 349, total: 2094, pal: 1.2 });
  });

  it.each([
    [1.1, 175, 1920],
    [2.4, 2443, 4188],
  ])('supports the extended activity level %s', (pal, activity, total) => {
    expect(calculateEnergyNeeds({ ...profile, activityPal: pal }, today)).toEqual({ basal: 1745, activity, total, pal });
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
