import { useStorage } from '@/app/context/StorageContext';
import NutritionPersonalDetails from '@/components/NutritionPersonalDetails';
import NutritionSettings from '@/components/NutritionSettings';

export default function NutritionPage() {
  const { userProfile } = useStorage();
  return userProfile.nutritionGuideCompleted ? <NutritionSettings /> : <NutritionPersonalDetails />;
}
