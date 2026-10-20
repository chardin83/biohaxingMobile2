import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { PREMIUM } from '@/constants/Premium';
import { type NutritionAnalysisResponse, NutritionAnalyze } from '@/services/gptServices';
import { refundFreePhotoAnalysis, reserveFreePhotoAnalysis } from '@/services/nutrition/photoAnalysisQuota';
import type { IdentifiedFood, PendingAnalysisReview, SelectedImageFile } from '@/types/nutrition/nutritionAnalysis';
import { extractAndValidateNutritionAnalysis, type WeeklyTrackingSignals } from '@/utils/analyzeNutrition';
import { toDateKey } from '@/utils/dateUtils';

interface NutritionAnalysisTrackingTarget {
  key: string;
  unit: 'items' | 'count';
  amount?: number;
  aiInstruction?: string;
}

interface UseNutritionAnalysisParams {
  selectedDate: string;
  trackingPrompt: string;
  trackingTargets: NutritionAnalysisTrackingTarget[];
  activeTrackingKeys: Set<string>;
  clearSelectedNutrition: () => void;
  presentAnalysisSheet: () => void;
  dismissAnalysisSheet: () => void;
}

const emptyReview = (overrides: Partial<PendingAnalysisReview> = {}): PendingAnalysisReview => ({
  analysis: null,
  weeklyTrackingSignals: {} as WeeklyTrackingSignals,
  detectedDrinks: [],
  evidence: null,
  aiDescription: null,
  evidenceMessage: null,
  statusMessage: null,
  ...overrides,
});

export const useNutritionAnalysis = ({
  selectedDate,
  trackingPrompt,
  trackingTargets,
  activeTrackingKeys,
  clearSelectedNutrition,
  presentAnalysisSheet,
  dismissAnalysisSheet,
}: UseNutritionAnalysisParams) => {
  const { t, i18n } = useTranslation();
  const [foodReviewMealName, setFoodReviewMealName] = useState('');
  const [foodReviewFoods, setFoodReviewFoods] = useState<IdentifiedFood[] | null>(null);
  const [analyzingFoods, setAnalyzingFoods] = useState<IdentifiedFood[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalysisReviewModalVisible, setIsAnalysisReviewModalVisible] = useState(false);
  const [pendingAnalysisReview, setPendingAnalysisReview] = useState<PendingAnalysisReview | null>(null);
  const [isPackagingModalVisible, setIsPackagingModalVisible] = useState(false);
  const [packagingMealImage, setPackagingMealImage] = useState<SelectedImageFile | null>(null);
  const [mealTime, setMealTime] = useState<Date>(() => new Date());
  const lastAnalyzedFilesRef = useRef<{
    mealFile: SelectedImageFile;
    mealDescription: string;
    ingredientFile: SelectedImageFile | null;
    confirmedFoods?: IdentifiedFood[];
    confirmedMealName?: string;
  } | null>(null);

  const closeAnalysisReviewModal = useCallback(() => {
    setIsAnalysisReviewModalVisible(false);
    setPendingAnalysisReview(null);
  }, []);

  const handleToggleDrinkConfirmation = useCallback((index: number) => {
    setPendingAnalysisReview(current => {
      if (!current) return current;
      return {
        ...current,
        detectedDrinks: (current.detectedDrinks ?? []).map((drink, drinkIndex) =>
          drinkIndex === index
            ? {
                ...drink,
                confirmed: !drink.confirmed,
              }
            : drink
        ),
      };
    });
  }, []);

  const handleNutritionError = useCallback(
    (data: NutritionAnalysisResponse) => {
      const backendMessage = data.message || data.content || t('journal:dayEdit.analysisFailed') || '❌ Misslyckades med att analysera bilden.';
      let rawDetails: string | null = null;
      if (typeof data.raw === 'string') {
        rawDetails = data.raw;
      } else if (data.raw) {
        rawDetails = JSON.stringify(data.raw);
      }
      const statusMessage = `❌ ${backendMessage}`;
      setAnalysisResult(statusMessage);
      setPendingAnalysisReview(
        emptyReview({
          aiDescription: typeof data.content === 'string' ? data.content : null,
          evidenceMessage: rawDetails ? `Backend details: ${rawDetails}` : null,
          statusMessage,
        })
      );
      setIsAnalysisReviewModalVisible(true);
    },
    [t]
  );

  const runNutritionImageAnalysis = useCallback(
    async (
      mealFile: SelectedImageFile,
      mealDescription?: string,
      ingredientFile?: SelectedImageFile | null,
      confirmedFoods?: IdentifiedFood[],
      confirmedMealName?: string
    ) => {
      const todayKey = toDateKey(new Date());
      if (selectedDate > todayKey) {
        setAnalysisResult(t('journal:nutritionLogger.futureDateLocked'));
        clearSelectedNutrition();
        return;
      }
      const activeLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'en').toLowerCase();
      const locale: 'sv' | 'en' = activeLanguage.startsWith('sv') ? 'sv' : 'en';
      setAnalyzingFoods(confirmedFoods ? confirmedFoods.map(food => ({ ...food })) : null);
      setIsAnalyzing(true);
      setAnalysisResult(null);
      setPendingAnalysisReview(null);
      setIsAnalysisReviewModalVisible(false);
      clearSelectedNutrition();
      let reservedAnalysis = false;
      let successfulAnalysis = false;
      try {
        if (confirmedFoods && !PREMIUM) reservedAnalysis = await reserveFreePhotoAnalysis();
        if (confirmedFoods && !PREMIUM && !reservedAnalysis) {
          setAnalysisResult(t('journal:nutritionLogger.mealLogger.noAnalysesRemaining'));
          Alert.alert(t('common:premium.title'), t('journal:nutritionLogger.mealLogger.noAnalysesRemaining'));
          return;
        }
        const data = await NutritionAnalyze({
          stage: confirmedFoods ? 'analyze' : 'identify',
          confirmedFoods,
          mealName: confirmedMealName,
          uri: mealFile.uri,
          name: mealFile.name,
          type: mealFile.type,
          mealDescription,
          ingredientListUri: ingredientFile?.uri,
          ingredientListName: ingredientFile?.name,
          ingredientListType: ingredientFile?.type,
          locale,
          analysisTier: PREMIUM ? 'premium' : 'free',
          prompt: trackingPrompt,
          trackingTargets: trackingTargets.filter(target => PREMIUM || !target.aiInstruction?.trim()),
        });
        if (!confirmedFoods) {
          if (
            data?.type !== 'identification' ||
            typeof data.mealName !== 'string' ||
            (data.detectedFoods?.length && !data.mealName.trim()) ||
            !Array.isArray(data.detectedFoods) ||
            !data.detectedFoods.every(food => food && typeof food.name === 'string' && food.name.trim() && Number.isFinite(food.grams) && food.grams > 0)
          ) {
            throw new Error(data.message || 'Invalid food identification response');
          }
          dismissAnalysisSheet();
          setFoodReviewMealName(data.mealName);
          setFoodReviewFoods(data.detectedFoods);
          return;
        }
        if (data?.type === 'error') {
          handleNutritionError(data);
          return;
        }
        const analyzedFoods = data.analyzedFoods;
        if (
          !Array.isArray(analyzedFoods) ||
          analyzedFoods.length !== confirmedFoods.length ||
          !analyzedFoods.every((food, index) => food && food.name === confirmedFoods[index].name.trim() && food.grams === confirmedFoods[index].grams)
        ) {
          throw new Error(t('journal:nutritionLogger.analysisIngredientsMismatch'));
        }
        const result = extractAndValidateNutritionAnalysis({
          data,
          t,
          activeTrackingKeys,
          setAnalysisResult,
          setPendingAnalysisReview,
          setIsAnalysisReviewModalVisible,
          setSelectedNutrition: value => {
            if (!value) clearSelectedNutrition();
          },
        });
        if (!result) return;
        successfulAnalysis = true;
        setPendingAnalysisReview({
          analyzedFoods: analyzedFoods.map(food => ({ ...food })),
          analysis: result.analysis,
          weeklyTrackingSignals: result.mealWeeklyTrackingSignals,
          detectedDrinks: (data.detectedDrinks ?? []).map(drink => ({
            ...drink,
            confirmed: false,
          })),
          evidence: result.evidence,
          aiDescription: result.aiResponseDescription,
          evidenceMessage: result.evidenceMessage,
          statusMessage: t('journal:nutritionLogger.analysisReadyToSave'),
        });
        setAnalysisResult(t('journal:nutritionLogger.analysisReadyToSave'));
        dismissAnalysisSheet();
        setTimeout(() => {
          setPackagingMealImage(null);
          setIsAnalysisReviewModalVisible(true);
        }, 250);
      } catch (err) {
        console.error('Error analyzing image:', err);
        const errMsg = err instanceof Error ? err.message : '';
        const statusMessage = errMsg.toLowerCase().includes('socket hang up')
          ? '❌ Backend tappade anslutning till AI (socket hang up). Prova igen med en mindre bild.'
          : errMsg === t('journal:nutritionLogger.analysisIngredientsMismatch')
            ? errMsg
            : (t('journal:dayEdit.analysisFailed') ?? '❌ Misslyckades med att analysera bilden.');
        setAnalysisResult(statusMessage);
        setPendingAnalysisReview(emptyReview({ statusMessage }));
        setIsAnalysisReviewModalVisible(true);
        clearSelectedNutrition();
      } finally {
        if (reservedAnalysis && !successfulAnalysis) await refundFreePhotoAnalysis().catch(console.error);
        setIsAnalyzing(false);
      }
    },
    [
      activeTrackingKeys,
      clearSelectedNutrition,
      dismissAnalysisSheet,
      handleNutritionError,
      i18n.language,
      i18n.resolvedLanguage,
      selectedDate,
      t,
      trackingPrompt,
      trackingTargets,
    ]
  );

  const handleImageSelected = useCallback(
    (file: SelectedImageFile) => {
      if (selectedDate > toDateKey(new Date())) {
        setAnalysisResult(t('journal:nutritionLogger.futureDateLocked'));
        return;
      }
      setMealTime(new Date());
      setPackagingMealImage(file);
      setIsPackagingModalVisible(true);
    },
    [selectedDate, t]
  );

  const handleAnalyzePackaging = useCallback(
    (mealFile: SelectedImageFile, mealDescription: string, ingredientFile: SelectedImageFile | null) => {
      lastAnalyzedFilesRef.current = {
        mealFile,
        mealDescription,
        ingredientFile,
      };
      setIsPackagingModalVisible(false);
      setPackagingMealImage(mealFile);
      requestAnimationFrame(presentAnalysisSheet);
      runNutritionImageAnalysis(mealFile, mealDescription || undefined, ingredientFile).catch(console.error);
    },
    [presentAnalysisSheet, runNutritionImageAnalysis]
  );

  const handleClosePackagingModal = useCallback(() => {
    setIsPackagingModalVisible(false);
    setPackagingMealImage(null);
  }, []);

  const handlePickNutritionImage = useCallback(
    async (fromCamera: boolean) => {
      const permission = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      const granted = permission.granted ?? permission.status === 'granted';
      if (!granted) {
        Alert.alert(t('permissions.title'), t('permissions.message'));
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ base64: false, quality: 0.45 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, base64: false, quality: 0.45 });
      if (result.canceled || !result.assets?.length) return;

      const image = result.assets[0];
      const uri = image.uri;
      handleImageSelected({
        uri,
        name: image.fileName ?? uri.split('/').pop() ?? `photo_${Date.now()}.jpg`,
        type: image.mimeType?.trim() || 'image/jpeg',
      });
    },
    [handleImageSelected, t]
  );

  const handleAnalyzePhoto = useCallback(() => {
    Alert.alert(t('journal:imagePicker.title'), undefined, [
      { text: t('journal:imagePicker.takePhoto'), onPress: () => handlePickNutritionImage(true).catch(console.error) },
      { text: t('journal:imagePicker.chooseFromLibrary'), onPress: () => handlePickNutritionImage(false).catch(console.error) },
      { text: t('general.cancel'), style: 'cancel' },
    ]);
  }, [handlePickNutritionImage, t]);

  const handleReAnalyze = useCallback(() => {
    const last = lastAnalyzedFilesRef.current;
    if (!last) return;
    closeAnalysisReviewModal();
    if (last.confirmedFoods?.length) {
      setFoodReviewMealName(last.confirmedMealName ?? '');
      setFoodReviewFoods(last.confirmedFoods.map(food => ({ ...food })));
      return;
    }
    setFoodReviewFoods(null);
    runNutritionImageAnalysis(last.mealFile, last.mealDescription || undefined, last.ingredientFile).catch(console.error);
  }, [closeAnalysisReviewModal, runNutritionImageAnalysis]);

  const confirmFoods = useCallback(() => {
    const last = lastAnalyzedFilesRef.current;
    const foods = foodReviewFoods ?? [];
    if (!last || !foods.length || isAnalyzing || foods.some(food => !food.name.trim() || !Number.isFinite(food.grams) || food.grams <= 0)) return;
    if (!foodReviewMealName.trim()) return;
    last.confirmedMealName = foodReviewMealName.trim();
    last.confirmedFoods = foods;
    setFoodReviewFoods(null);
    requestAnimationFrame(presentAnalysisSheet);
    runNutritionImageAnalysis(last.mealFile, last.mealDescription || undefined, last.ingredientFile, foods, last.confirmedMealName).catch(console.error);
  }, [foodReviewFoods, foodReviewMealName, isAnalyzing, presentAnalysisSheet, runNutritionImageAnalysis]);

  useEffect(() => {
    setFoodReviewFoods(null);
    setFoodReviewMealName('');
    setIsPackagingModalVisible(false);
    setPackagingMealImage(null);
  }, [selectedDate]);

  return {
    foodReviewMealName,
    setFoodReviewMealName,
    analyzingFoods,
    foodReviewFoods,
    setFoodReviewFoods,
    confirmFoods,
    isAnalyzing,
    analysisResult,
    setAnalysisResult,
    isAnalysisReviewModalVisible,
    pendingAnalysisReview,
    mealTime,
    setMealTime,
    isPackagingModalVisible,
    packagingMealImage,
    canReAnalyze: Boolean(lastAnalyzedFilesRef.current),
    closeAnalysisReviewModal,
    handleToggleDrinkConfirmation,
    handleReAnalyze,
    handleImageSelected,
    handleAnalyzePackaging,
    handleClosePackagingModal,
    handleAnalyzePhoto,
  };
};
