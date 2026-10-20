import { resetFreePhotoAnalysisQuota } from '@/services/nutrition/photoAnalysisQuota';

type DevelopmentResetOptions = {
  premiumTrials: boolean;
};

// Enable only while resetting test data, reload the app, then turn it off again.
// This resets only the Premium trial counter; saved meals and analyses are retained.
export const DEVELOPMENT_RESET_OPTIONS: DevelopmentResetOptions = {
  premiumTrials: false,
};

export async function resetDevelopmentData(options: DevelopmentResetOptions = DEVELOPMENT_RESET_OPTIONS): Promise<void> {
  if (!__DEV__) return;
  if (options.premiumTrials) await resetFreePhotoAnalysisQuota();
}
