import { extractAndValidateNutritionAnalysis } from '@/utils/analyzeNutrition';
import { getNutritionTrackingAnalysis } from '@/utils/nutritionTrackingPrompt';

it('does not request AI tracking for a group identifier', () => {
  for (const premium of [true, false]) {
    const analysis = getNutritionTrackingAnalysis([{ tipId: 'sulfate' }], premium);
    expect(analysis.targets).toEqual([]);
    expect(analysis.keys.has('sulfur_rich_vegetables')).toBe(false);
    expect(analysis.prompt).toBe('nutrition_analysis');
  }
});
it('extracts detected vegetables and separate sulfur amino acids from the analysis response', () => {
  const keys = new Set(['sulfur_rich_vegetables']);
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
