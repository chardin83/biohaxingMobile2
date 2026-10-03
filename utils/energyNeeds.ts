import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';

import { fromDateKey, getAge } from './dateUtils';

// Mifflin–St Jeor, https://pubmed.ncbi.nlm.nih.gov/2305711/
export function calculateEnergyNeeds(profile: UserProfile, today = new Date()) {
  const { birthDate, weightKg, heightCm, biologicalSex, activityPal } = profile;
  if (!birthDate || !weightKg || !heightCm || !activityPal || (biologicalSex !== 'male' && biologicalSex !== 'female')) return null;
  const birthday = fromDateKey(birthDate.slice(0, 10));
  const age = getAge(birthday, today);
  if (
    !Number.isFinite(birthday.getTime()) ||
    birthday > today ||
    age < 18 ||
    ![weightKg, heightCm, activityPal].every(Number.isFinite) ||
    weightKg <= 0 ||
    heightCm <= 0 ||
    activityPal < 1
  )
    return null;
  const basal = 10 * weightKg + 6.25 * heightCm - 5 * age + (biologicalSex === 'male' ? 5 : -161);
  if (basal <= 0) return null;
  const total = Math.round(basal * activityPal);
  const roundedBasal = Math.round(basal);
  return { basal: roundedBasal, activity: total - roundedBasal, total, pal: activityPal };
}
