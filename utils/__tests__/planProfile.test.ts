import { DEFAULT_PROFILE_SHARING } from '@/types/aiSharing';
import { getPlanProfile, getSharedPlanProfile, isTipAgeEligible } from '../planProfile';

const today = new Date(2026, 9, 25);
it('sends completed years and profile details without a birth date', () => {
  const profile = getPlanProfile({ birthDate: '1990-10-26', biologicalSex: 'female', weightKg: 60, heightCm: 170, activityPal: 1.6 }, today);
  expect(profile).toEqual({ age: 35, activityPal: 1.6 });
  expect(profile).not.toHaveProperty('birthDate');
});
it('does not assume an age when it is missing, invalid, future or under 18', () => {
  for (const birthDate of [undefined, 'invalid', '2030-01-01', '2020-01-01']) {
    expect(getPlanProfile({ birthDate }, today).age).toBeUndefined();
  }
});
it('only permits 65+ tips from the 65th birthday onwards', () => {
  expect(isTipAgeEligible({ minAge: 65 }, getPlanProfile({ birthDate: '1961-10-26' }, today).age)).toBe(false);
  expect(isTipAgeEligible({ minAge: 65 }, getPlanProfile({ birthDate: '1961-10-25' }, today).age)).toBe(true);
  expect(isTipAgeEligible({ minAge: 65 }, 35)).toBe(false);
  expect(isTipAgeEligible({ minAge: 65 })).toBe(false);
  expect(isTipAgeEligible({}, 35)).toBe(true);
});

it('only includes explicitly selected fields in the AI profile', () => {
  const profile = { birthDate: '1990-01-01', biologicalSex: 'female' as const, heightCm: 170, weightKg: 60, activityPal: 1.6 };
  expect(getSharedPlanProfile(profile, { ...DEFAULT_PROFILE_SHARING, age: true }, today)).toEqual({ age: 36 });
  expect(getSharedPlanProfile(profile, { ...DEFAULT_PROFILE_SHARING, age: true, activityPal: true }, today)).toEqual({ age: 36, activityPal: 1.6 });
  expect(getSharedPlanProfile(profile, DEFAULT_PROFILE_SHARING, today)).toEqual({});
});

it('never includes sex, height or weight even with old saved permissions', () => {
  const legacy = { ...DEFAULT_PROFILE_SHARING, age: true, biologicalSex: true, heightCm: true, weightKg: true };
  const shared = getSharedPlanProfile({ birthDate: '1990-01-01', biologicalSex: 'female', heightCm: 170, weightKg: 60 }, legacy, today);
  expect(shared).toEqual({ age: 36 });
});
