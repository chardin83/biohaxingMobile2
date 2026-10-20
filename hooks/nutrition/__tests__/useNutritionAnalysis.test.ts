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
        { name: 'Lax', grams: 125 },
        { name: 'Ris', grams: 150 },
      ],
    })
    .mockResolvedValueOnce({
      type: 'nutrition',
      analyzedFoods: [
        { name: 'Tofu', grams: 100 },
        { name: 'Potatis', grams: 150 },
      ],
    });
  const { result } = renderHook(() => useNutritionAnalysis(params));
  act(() => result.current.handleAnalyzePackaging(file, '', null));
  await waitFor(() =>
    expect(result.current.foodReviewFoods).toEqual([
      { name: 'Lax', grams: 125 },
      { name: 'Ris', grams: 150 },
    ])
  );
  expect(NutritionAnalyze).toHaveBeenCalledTimes(1);
  expect(NutritionAnalyze).toHaveBeenLastCalledWith(expect.objectContaining({ stage: 'identify', confirmedFoods: undefined }));
  expect(reserveFreePhotoAnalysis).not.toHaveBeenCalled();
  expect(extractAndValidateNutritionAnalysis).not.toHaveBeenCalled();
  act(() =>
    result.current.setFoodReviewFoods([
      { name: 'Tofu', grams: 100 },
      { name: 'Potatis', grams: 150 },
    ])
  );
  act(() => result.current.confirmFoods());
  await waitFor(() => expect(NutritionAnalyze).toHaveBeenCalledTimes(2));
  expect(NutritionAnalyze).toHaveBeenLastCalledWith(
    expect.objectContaining({
      stage: 'analyze',
      confirmedFoods: [
        { name: 'Tofu', grams: 100 },
        { name: 'Potatis', grams: 150 },
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
    .mockResolvedValueOnce({ type: 'identification', mealName: 'Nötköttsgryta med potatismos', detectedFoods: [{ name: 'Nötfärs', grams: 150 }] })
    .mockResolvedValueOnce({
      type: 'nutrition',
      analyzedFoods: [
        { name: 'Nötfärs', grams: 200, preparation: 'i gryta' },
        { name: 'Olivolja', grams: 12.5, preparation: 'tillsatt efter tillagning' },
      ],
    });
  const { result } = renderHook(() => useNutritionAnalysis(params));
  act(() => result.current.handleAnalyzePackaging(file, '', null));
  await waitFor(() => expect(result.current.foodReviewFoods).not.toBeNull());
  const corrected = [
    { name: 'Nötfärs', grams: 200, preparation: 'i gryta' },
    { name: 'Olivolja', grams: 12.5, preparation: 'tillsatt efter tillagning' },
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

test.each([undefined, [{ name: 'Lax', grams: 999 }]])('rejects a backend response without matching analyzed weights: %j', async analyzedFoods => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest
    .mocked(NutritionAnalyze)
    .mockResolvedValueOnce({ type: 'identification', mealName: 'Nötköttsgryta med potatismos', detectedFoods: [{ name: 'Lax', grams: 125 }] })
    .mockResolvedValueOnce({ type: 'nutrition', analyzedFoods });
  const { result } = renderHook(() => useNutritionAnalysis(params));
  act(() => result.current.handleAnalyzePackaging(file, '', null));
  await waitFor(() => expect(result.current.foodReviewFoods).not.toBeNull());
  act(() => result.current.confirmFoods());
  await waitFor(() => expect(result.current.analysisResult).toBe('journal:nutritionLogger.analysisIngredientsMismatch'));
  expect(result.current.pendingAnalysisReview?.analysis).toBeNull();
  expect(extractAndValidateNutritionAnalysis).not.toHaveBeenCalled();
  jest.restoreAllMocks();
});

test('rejects a response that dropped the confirmed preparation', async () => {
  const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
  jest
    .mocked(NutritionAnalyze)
    .mockResolvedValueOnce({ type: 'identification', mealName: 'Gryta', detectedFoods: [{ name: 'Morot', grams: 60, preparation: 'i gryta' }] })
    .mockResolvedValueOnce({ type: 'nutrition', analyzedFoods: [{ name: 'Morot', grams: 60 }] });
  const { result } = renderHook(() => useNutritionAnalysis(params));
  act(() => result.current.handleAnalyzePackaging(file, '', null));
  await waitFor(() => expect(result.current.foodReviewFoods).not.toBeNull());
  act(() => result.current.confirmFoods());
  await waitFor(() => expect(result.current.analysisResult).toBe('journal:nutritionLogger.analysisIngredientsMismatch'));
  expect(extractAndValidateNutritionAnalysis).not.toHaveBeenCalled();
  errorLog.mockRestore();
});
