import { render } from '@testing-library/react-native';
import React from 'react';

import NutritionAnalysisReviewModal from '../journal/NutritionAnalysisReviewModal';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/locales/drinkCatalog', () => ({ getDrinkImage: jest.fn(), getDrinkNutritionData: jest.fn() }));
jest.mock('@/services/gptServices', () => ({ isAlcohol: jest.fn() }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../ThemedModal', () => ({ ThemedModal: ({ children }: any) => children }));
jest.mock('../ui/Card', () => ({ Card: require('react-native').View }));
jest.mock('../Collapsible', () => ({ Collapsible: () => null }));
jest.mock('../NutritionBreakdown', () => () => null);
jest.mock('../ui/AddButton', () => () => null);
jest.mock('../ui/DateTimeInput', () => ({ DateTimeInput: () => null }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));

test('shows the confirmed ingredient names and exact weights instead of AI prose', () => {
  const screen = render(
    <NutritionAnalysisReviewModal
      visible
      pendingReview={{
        analysis: null,
        weeklyTrackingSignals: {},
        evidence: null,
        aiDescription: 'Outdated AI interpretation',
        evidenceMessage: null,
        statusMessage: null,
        analyzedFoods: [
          { name: 'Nötfärs', amount: 200, unit: 'g' },
          { name: 'Olivolja', amount: 12.5, unit: 'g', preparation: 'i gryta' },
          { name: 'Rödvin', amount: 150, unit: 'ml' },
        ],
      }}
      analysisResult={null}
      mealTime={new Date()}
      onMealTimeChange={jest.fn()}
      isAnalyzing={false}
      canReAnalyze
      onReAnalyze={jest.fn()}
      onToggleDrink={jest.fn()}
      onClose={jest.fn()}
      onSave={jest.fn()}
    />
  );
  expect(screen.getByText('Nötfärs')).toBeTruthy();
  expect(screen.getByText('200 g')).toBeTruthy();
  expect(screen.getByText('Olivolja')).toBeTruthy();
  expect(screen.getByText('12,5 g')).toBeTruthy();
  expect(screen.getByText('150 ml')).toBeTruthy();
  expect(screen.getByText('(i gryta)')).toBeTruthy();
  expect(screen.queryByText('Outdated AI interpretation')).toBeNull();
  expect(screen.queryByText('AI Interpretation')).toBeNull();
});
