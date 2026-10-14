import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';

import { fromDateKey, getAge } from './dateUtils';

// Henry (2005), weight and height equations with NNR 2023 age bands.
// https://pub.norden.org/nord2023-003/appendix.html, Appendix 4, Table 5.
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
  const equations = biologicalSex === 'male'
    ? [[0.0600, 1.31, 0.473], [0.0476, 2.26, -0.574], [0.0478, 2.26, -1.070]]
    : [[0.0433, 2.57, -1.180], [0.0342, 2.10, -0.0486], [0.0356, 1.76, 0.0448]];
  const group = age < 25 ? 0 : age <= 50 ? 1 : 2;
  const [weightCoefficient, heightCoefficient, constant] = equations[group];
  const basalMj = weightCoefficient * weightKg + heightCoefficient * (heightCm / 100) + constant;
  const basal = basalMj * 239; // NNR uses 1 MJ = 239 kcal.
  if (basal <= 0) return null;
  const total = Math.round(basal * activityPal);
  const roundedBasal = Math.round(basal);
  return { basal: roundedBasal, activity: total - roundedBasal, total, pal: activityPal };
}
