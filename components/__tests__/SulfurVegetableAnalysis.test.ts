import { extractAndValidateNutritionAnalysis } from '@/utils/analyzeNutrition';
import { getNutritionTrackingAnalysis } from '@/utils/nutritionTrackingPrompt';

it('includes the sulfur vegetable instruction only for an active premium goal', () => {
  const active = [{ tipId: 'sulfate' }];
  const premium = getNutritionTrackingAnalysis(active, true);
  expect(premium.targets).toEqual([expect.objectContaining({ key: 'sulfur_rich_vegetables', unit: 'items', amount: 1 })]);
  expect(premium.prompt).toContain('broccoli, cauliflower, cabbage, Brussels sprouts, kale, garlic, onions and leeks');
  expect(premium.prompt).toContain('nutritionDetails.aminoAcids');
  expect(premium.keys.has('sulfur_rich_vegetables')).toBe(true);
  expect(getNutritionTrackingAnalysis(active, false).keys.has('sulfur_rich_vegetables')).toBe(false);
  expect(getNutritionTrackingAnalysis([], true).prompt).toBe('nutrition_analysis');
});
it('extracts detected vegetables and separate sulfur amino acids from the analysis response', () => {
  const { keys } = getNutritionTrackingAnalysis([{ tipId: 'sulfate' }], true);
  const result = extractAndValidateNutritionAnalysis({
    data: { nutrition: { name: 'Eggs and broccoli', calories: 200, protein: 15 },
      nutritionDetails: { aminoAcids: { methionine: 300, cysteine: 150 } },
      weeklyTrackingSignals: [{ key: 'sulfur_rich_vegetables', items: [{ en: 'broccoli', local: 'Broccoli' }, { en: 'broccoli', local: 'Broccoli' }] }],
    },
    t: (key: string) => key, activeTrackingKeys: keys,
    setAnalysisResult: jest.fn(), setPendingAnalysisReview: jest.fn(), setIsAnalysisReviewModalVisible: jest.fn(), setSelectedNutrition: jest.fn(),
  });
  expect(result?.mealWeeklyTrackingSignals.sulfur_rich_vegetables).toEqual([{ en: 'broccoli', local: 'Broccoli' }]);
  expect(result?.analysis.aminoAcidsByType).toMatchObject({ methionine: 300, cysteine: 150 });
});
