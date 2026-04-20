// Helper functions for NutritionLogger.tsx
// Extracted from runNutritionImageAnalysis and related logic

export function handleNutritionError({ data, t, setAnalysisResult, setPendingAnalysisReview, setIsAnalysisReviewModalVisible }: {
  data: any,
  t: any,
  setAnalysisResult: any,
  setPendingAnalysisReview: any,
  setIsAnalysisReviewModalVisible: any,
}) {
  const backendMessage =
    (typeof data?.message === 'string' && data.message)
    || (typeof data?.content === 'string' && data.content)
    || t('dayEdit.analysisFailed')
    || '❌ Misslyckades med att analysera bilden.';

  let rawDetails: string | null = null;
  if (typeof data?.raw === 'string') {
    rawDetails = data.raw;
  } else if (data?.raw) {
    rawDetails = JSON.stringify(data.raw);
  }

  setAnalysisResult(`❌ ${backendMessage}`);
  setPendingAnalysisReview({
    analysis: null,
    weeklyTrackingSignals: {},
    evidence: null,
    aiDescription: typeof data?.content === 'string' ? data.content : null,
    evidenceMessage: rawDetails ? `Backend details: ${rawDetails}` : null,
    statusMessage: `❌ ${backendMessage}`,
  });
  setIsAnalysisReviewModalVisible(true);
}

export function handleNoStructuredData({
  data,
  t,
  setAnalysisResult,
  setPendingAnalysisReview,
  setIsAnalysisReviewModalVisible,
  evidence,
  aiResponseDescription,
  evidenceMessage,
}: {
  data: any,
  t: any,
  setAnalysisResult: any,
  setPendingAnalysisReview: any,
  setIsAnalysisReviewModalVisible: any,
  evidence: any,
  aiResponseDescription: any,
  evidenceMessage: any,
}) {
  const text = data?.content ?? t('dayEdit.analysisNoStructuredData') ?? 'Ingen strukturerad näringsdata hittades.';
  const statusMessage = typeof text === 'string' ? text : JSON.stringify(text);
  setAnalysisResult(statusMessage);
  setPendingAnalysisReview({
    analysis: null,
    weeklyTrackingSignals: {},
    evidence,
    aiDescription: aiResponseDescription,
    evidenceMessage,
    statusMessage,
  });
  setIsAnalysisReviewModalVisible(true);
}

export function handleNoMacroData({
  data,
  t,
  setAnalysisResult,
  setPendingAnalysisReview,
  setIsAnalysisReviewModalVisible,
  analysis,
  evidence,
  aiResponseDescription,
  evidenceMessage,
  setLastLoggedMeal,
}: {
  data: any,
  t: any,
  setAnalysisResult: any,
  setPendingAnalysisReview: any,
  setIsAnalysisReviewModalVisible: any,
  analysis: any,
  evidence: any,
  aiResponseDescription: any,
  evidenceMessage: any,
  setLastLoggedMeal: any,
}) {
  const text = data?.content ?? 'AI hittade ingen tillforlitlig macro-data i svaret. Prova en tydligare bild eller en narbild pa tallriken.';
  const statusMessage = typeof text === 'string' ? text : JSON.stringify(text);
  setAnalysisResult(statusMessage);
  setPendingAnalysisReview({
    analysis,
    weeklyTrackingSignals: {},
    evidence,
    aiDescription: aiResponseDescription,
    evidenceMessage,
    statusMessage,
  });
  setIsAnalysisReviewModalVisible(true);
  setLastLoggedMeal(null);
}

export function handleSocketError({ t, setAnalysisResult, setPendingAnalysisReview, setIsAnalysisReviewModalVisible, setLastLoggedMeal }: {
  t: any,
  setAnalysisResult: any,
  setPendingAnalysisReview: any,
  setIsAnalysisReviewModalVisible: any,
  setLastLoggedMeal: any,
}) {
  setAnalysisResult('❌ Backend tappade anslutning till AI (socket hang up). Prova igen med en mindre bild.');
  setPendingAnalysisReview({
    analysis: null,
    weeklyTrackingSignals: {},
    evidence: null,
    aiDescription: null,
    evidenceMessage: null,
    statusMessage: '❌ Backend tappade anslutning till AI (socket hang up). Prova igen med en mindre bild.',
  });
  setIsAnalysisReviewModalVisible(true);
  setLastLoggedMeal(null);
}

export function handleGeneralError({ t, setAnalysisResult, setPendingAnalysisReview, setIsAnalysisReviewModalVisible, setLastLoggedMeal }: {
  t: any,
  setAnalysisResult: any,
  setPendingAnalysisReview: any,
  setIsAnalysisReviewModalVisible: any,
  setLastLoggedMeal: any,
}) {
  setAnalysisResult(t('dayEdit.analysisFailed') ?? '❌ Misslyckades med att analysera bilden.');
  setPendingAnalysisReview({
    analysis: null,
    weeklyTrackingSignals: {},
    evidence: null,
    aiDescription: null,
    evidenceMessage: null,
    statusMessage: t('dayEdit.analysisFailed') ?? '❌ Misslyckades med att analysera bilden.',
  });
  setIsAnalysisReviewModalVisible(true);
  setLastLoggedMeal(null);
}
