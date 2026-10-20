import { act, renderHook, waitFor } from '@testing-library/react-native';

import { NutritionAnalyze } from '@/services/gptServices';
import { refundFreePhotoAnalysis, reserveFreePhotoAnalysis } from '@/services/nutrition/photoAnalysisQuota';
import { extractAndValidateNutritionAnalysis } from '@/utils/analyzeNutrition';

import { useNutritionAnalysis } from '../useNutritionAnalysis';

jest.mock('expo-image-picker', () => ({}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'sv' } }) }));
jest.mock('@/constants/Premium', () => ({ PREMIUM: false }));
jest.mock('@/services/gptServices', () => ({ NutritionAnalyze: jest.fn() }));
jest.mock('@/services/nutrition/photoAnalysisQuota', () => ({ reserveFreePhotoAnalysis: jest.fn(), refundFreePhotoAnalysis: jest.fn() }));
jest.mock('@/utils/analyzeNutrition', () => ({ extractAndValidateNutritionAnalysis: jest.fn() }));

const file = { uri: 'file:///meal.jpg', name: 'meal.jpg', type: 'image/jpeg' };
const params = {
  selectedDate: '2020-01-01',
  trackingPrompt: '',
  trackingTargets: [],
  activeTrackingKeys: new Set<string>(),
  clearSelectedNutrition: jest.fn(),
  presentAnalysisSheet: jest.fn(),
  dismissAnalysisSheet: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(refundFreePhotoAnalysis).mockResolvedValue(true);
  jest.mocked(reserveFreePhotoAnalysis).mockResolvedValue(true);
  jest.mocked(extractAndValidateNutritionAnalysis).mockReturnValue(null);
});

test('waits for confirmation and sends corrected foods only in the nutrition request', async () => {
  jest
    .mocked(NutritionAnalyze)
    .mockResolvedValueOnce({
      type: 'identification',
      mealName: 'Nötköttsgryta med potatismos',
      detectedFoods: [
        { name: 'Lax', amount: 125, unit: 'g' as const },
        { name: 'Ris', amount: 150, unit: 'g' as const },
      ],
    })
    .mockResolvedValueOnce({
      type: 'nutrition',
      analyzedFoods: [
        { name: 'Tofu', amount: 100, unit: 'g' as const },
        { name: 'Potatis', amount: 150, unit: 'g' as const },
      ],
    });
  const { result } = renderHook(() => useNutritionAnalysis(params));
  act(() => result.current.handleAnalyzePackaging(file, '', null));
  await waitFor(() =>
    expect(result.current.foodReviewFoods).toEqual([
      { name: 'Lax', amount: 125, unit: 'g' as const },
      { name: 'Ris', amount: 150, unit: 'g' as const },
    ])
  );
  expect(NutritionAnalyze).toHaveBeenCalledTimes(1);
  expect(NutritionAnalyze).toHaveBeenLastCalledWith(expect.objectContaining({ stage: 'identify', confirmedFoods: undefined }));
  expect(reserveFreePhotoAnalysis).not.toHaveBeenCalled();
  expect(extractAndValidateNutritionAnalysis).not.toHaveBeenCalled();
  act(() =>
    result.current.setFoodReviewFoods([
      { name: 'Tofu', amount: 100, unit: 'g' as const },
      { name: 'Potatis', amount: 150, unit: 'g' as const },
    ])
  );
  act(() => result.current.confirmFoods());
  await waitFor(() => expect(NutritionAnalyze).toHaveBeenCalledTimes(2));
  expect(NutritionAnalyze).toHaveBeenLastCalledWith(
    expect.objectContaining({
      stage: 'analyze',
      confirmedFoods: [
        { name: 'Tofu', amount: 100, unit: 'g' as const },
        { name: 'Potatis', amount: 150, unit: 'g' as const },
      ],
    })
  );
  expect(reserveFreePhotoAnalysis).toHaveBeenCalledTimes(1);
  expect(NutritionAnalyze).toHaveBeenLastCalledWith(expect.objectContaining({ mealName: 'Nötköttsgryta med potatismos' }));
});

test('canceling identification never starts nutrition analysis', async () => {
  jest.mocked(NutritionAnalyze).mockResolvedValueOnce({ type: 'identification', mealName: 'Nötköttsgryta med potatismos', detectedFoods: [] });
  const { result } = renderHook(() => useNutritionAnalysis(params));
  act(() => result.current.handleAnalyzePackaging(file, '', null));
  await waitFor(() => expect(result.current.foodReviewFoods).toEqual([]));
  act(() => result.current.confirmFoods());
  act(() => result.current.setFoodReviewFoods(null));
  expect(NutritionAnalyze).toHaveBeenCalledTimes(1);
  expect(reserveFreePhotoAnalysis).not.toHaveBeenCalled();
});

test('keeps edited weights and added ingredients in the final review and when reopening it', async () => {
  jest.mocked(extractAndValidateNutritionAnalysis).mockReturnValue({
    analysis: { name: 'Lunch', calories: 450, protein: 30, carbohydrates: 40, fat: 15, fiber: 5 },
    mealWeeklyTrackingSignals: {},
    evidence: { sources: [], inferred: [], confidence: 'medium' },
    aiResponseDescription: 'An old description without the extra ingredient',
    evidenceMessage: '',
  });
  jest
    .mocked(NutritionAnalyze)
    .mockResolvedValueOnce({
      type: 'identification',
      mealName: 'Nötköttsgryta med potatismos',
      detectedFoods: [{ name: 'Nötfärs', amount: 150, unit: 'g' as const }],
    })
    .mockResolvedValueOnce({
      type: 'nutrition',
      analyzedFoods: [
        { name: 'Nötfärs', amount: 200, unit: 'g' as const, preparation: 'i gryta' },
        { name: 'Olivolja', amount: 12.5, unit: 'g' as const, preparation: 'tillsatt efter tillagning' },
        { name: 'Rödvin', amount: 175, unit: 'ml' as const },
      ],
    });
  const { result } = renderHook(() => useNutritionAnalysis(params));
  act(() => result.current.handleAnalyzePackaging(file, '', null));
  await waitFor(() => expect(result.current.foodReviewFoods).not.toBeNull());
  const corrected = [
    { name: 'Nötfärs', amount: 200, unit: 'g' as const, preparation: 'i gryta' },
    { name: 'Olivolja', amount: 12.5, unit: 'g' as const, preparation: 'tillsatt efter tillagning' },
    { name: 'Rödvin', amount: 175, unit: 'ml' as const },
  ];
  act(() => result.current.setFoodReviewFoods(corrected));
  act(() => result.current.setFoodReviewMealName('Min nötköttsgryta med potatismos'));
  act(() => result.current.confirmFoods());
  await waitFor(() => expect(result.current.isAnalysisReviewModalVisible).toBe(true));
  expect(NutritionAnalyze).toHaveBeenLastCalledWith(expect.objectContaining({ confirmedFoods: corrected, mealName: 'Min nötköttsgryta med potatismos' }));
  expect(result.current.pendingAnalysisReview?.analyzedFoods).toEqual(corrected);
  act(() => result.current.handleReAnalyze());
  expect(result.current.foodReviewFoods).toEqual(corrected);
  expect(result.current.foodReviewMealName).toBe('Min nötköttsgryta med potatismos');
  expect(NutritionAnalyze).toHaveBeenCalledTimes(2);
});

test.each([undefined, [{ name: 'Lax', amount: 999, unit: 'g' as const }], [{ name: 'Lax', amount: 125, unit: 'ml' as const }]])(
  'rejects a backend response without matching analyzed weights: %j',
  async analyzedFoods => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest
      .mocked(NutritionAnalyze)
      .mockResolvedValueOnce({
        type: 'identification',
        mealName: 'Nötköttsgryta med potatismos',
        detectedFoods: [{ name: 'Lax', amount: 125, unit: 'g' as const }],
      })
      .mockResolvedValueOnce({ type: 'nutrition', analyzedFoods });
    const { result } = renderHook(() => useNutritionAnalysis(params));
    act(() => result.current.handleAnalyzePackaging(file, '', null));
    await waitFor(() => expect(result.current.foodReviewFoods).not.toBeNull());
    act(() => result.current.confirmFoods());
    await waitFor(() => expect(result.current.analysisResult).toBe('journal:nutritionLogger.analysisIngredientsMismatch'));
    expect(result.current.pendingAnalysisReview?.analysis).toBeNull();
    expect(extractAndValidateNutritionAnalysis).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  }
);

test('rejects a response that dropped the confirmed preparation', async () => {
  const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
  jest
    .mocked(NutritionAnalyze)
    .mockResolvedValueOnce({
      type: 'identification',
      mealName: 'Gryta',
      detectedFoods: [{ name: 'Morot', amount: 60, unit: 'g' as const, preparation: 'i gryta' }],
    })
    .mockResolvedValueOnce({ type: 'nutrition', analyzedFoods: [{ name: 'Morot', amount: 60, unit: 'g' as const }] });
  const { result } = renderHook(() => useNutritionAnalysis(params));
  act(() => result.current.handleAnalyzePackaging(file, '', null));
  await waitFor(() => expect(result.current.foodReviewFoods).not.toBeNull());
  act(() => result.current.confirmFoods());
  await waitFor(() => expect(result.current.analysisResult).toBe('journal:nutritionLogger.analysisIngredientsMismatch'));
  expect(extractAndValidateNutritionAnalysis).not.toHaveBeenCalled();
  errorLog.mockRestore();
});
