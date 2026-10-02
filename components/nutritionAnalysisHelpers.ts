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
  data: any;
  t: any;
  setAnalysisResult: any;
  setPendingAnalysisReview: any;
  setIsAnalysisReviewModalVisible: any;
  evidence: any;
  aiResponseDescription: any;
  evidenceMessage: any;
}) {
  const text = data?.content ?? t('journal:dayEdit.analysisNoStructuredData') ?? 'Ingen strukturerad näringsdata hittades.';
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
  t: _t,
  setAnalysisResult,
  setPendingAnalysisReview,
  setIsAnalysisReviewModalVisible,
  analysis,
  evidence,
  aiResponseDescription,
  evidenceMessage,
  setSelectedNutrition,
}: {
  data: any;
  t: any;
  setAnalysisResult: any;
  setPendingAnalysisReview: any;
  setIsAnalysisReviewModalVisible: any;
  analysis: any;
  evidence: any;
  aiResponseDescription: any;
  evidenceMessage: any;
  setSelectedNutrition: any;
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
  setSelectedNutrition(null);
}
