export type NutritionStepNavigation = {
  currentStep?: number;
  totalSteps?: number;
  onContinue?: () => void;
  onBack?: () => void;
  onManual?: () => void;
};
