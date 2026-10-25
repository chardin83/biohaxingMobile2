import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';
import type { ProfileSharing } from '@/types/aiSharing';
import { fromDateKey, getAge } from '@/utils/dateUtils';

export function getPlanProfile(profile: UserProfile, today = new Date()) {
  const birthDate = profile.birthDate ? fromDateKey(profile.birthDate.slice(0, 10)) : null;
  const age = birthDate && Number.isFinite(birthDate.getTime()) && birthDate <= today ? getAge(birthDate, today) : undefined;
  return {
    age: age !== undefined && age >= 18 ? age : undefined,
    activityPal: profile.activityPal,
  };
}

export const isTipAgeEligible = (tip: { minAge?: number }, age?: number) => tip.minAge === undefined || (age !== undefined && age >= tip.minAge);

export function getSharedPlanProfile(profile: UserProfile, sharing: ProfileSharing, today = new Date()) {
  const available = getPlanProfile(profile, today);
  return Object.fromEntries(
    Object.entries(available).filter(([field, value]) => sharing[field as keyof ProfileSharing] === true && value !== undefined)
  ) as Partial<ReturnType<typeof getPlanProfile>>;
}
