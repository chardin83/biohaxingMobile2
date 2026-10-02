import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { type NutritionAnalysisResponse, NutritionAnalyze } from '@/services/gptServices';
import type { PendingAnalysisReview, SelectedImageFile } from '@/types/nutrition/nutritionAnalysis';
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
    async (mealFile: SelectedImageFile, mealDescription?: string, ingredientFile?: SelectedImageFile | null) => {
      const todayKey = toDateKey(new Date());
      if (selectedDate > todayKey) {
        setAnalysisResult(t('journal:nutritionLogger.futureDateLocked'));
        clearSelectedNutrition();
        return;
      }
      const activeLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'en').toLowerCase();
      const locale: 'sv' | 'en' = activeLanguage.startsWith('sv') ? 'sv' : 'en';
      setIsAnalyzing(true);
      setAnalysisResult(null);
      setPendingAnalysisReview(null);
      setIsAnalysisReviewModalVisible(false);
      clearSelectedNutrition();
      try {
        const data = await NutritionAnalyze({
          uri: mealFile.uri,
          name: mealFile.name,
          type: mealFile.type,
          mealDescription,
          ingredientListUri: ingredientFile?.uri,
          ingredientListName: ingredientFile?.name,
          ingredientListType: ingredientFile?.type,
          locale,
          prompt: trackingPrompt,
          trackingTargets,
        });
        if (data?.type === 'error') {
          handleNutritionError(data);
          return;
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
        setPendingAnalysisReview({
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
          : (t('journal:dayEdit.analysisFailed') ?? '❌ Misslyckades med att analysera bilden.');
        setAnalysisResult(statusMessage);
        setPendingAnalysisReview(emptyReview({ statusMessage }));
        setIsAnalysisReviewModalVisible(true);
        clearSelectedNutrition();
      } finally {
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
    runNutritionImageAnalysis(last.mealFile, last.mealDescription || undefined, last.ingredientFile).catch(console.error);
  }, [closeAnalysisReviewModal, runNutritionImageAnalysis]);

  useEffect(() => {
    setIsPackagingModalVisible(false);
    setPackagingMealImage(null);
  }, [selectedDate]);

  return {
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
