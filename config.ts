export const BASE_IP = '192.168.68.74';
export const API_PORT = '7071';

export const BASE_URL = `http://${BASE_IP}:${API_PORT}`;

export const ENDPOINTS = {
    askAIv2: `${BASE_URL}/api/askAIv2`,
    handleSupplementCheck: `${BASE_URL}/api/handleSupplementCheck`,
    handleNutritionCheck: `${BASE_URL}/api/handleNutritionCheck`,
    handleAnalyze: `${BASE_URL}/api/handleAnalyze`,
  };