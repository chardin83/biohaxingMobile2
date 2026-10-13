import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Animated } from 'react-native';

import NutritionPlanTargetsSection from '@/components/journal/NutritionPlanTargetsSection';
import { tips } from '@/locales/tips';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: (...args: unknown[]) => mockPush(...args) }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'sv' } }) }));
jest.mock('react-native-paper', () => ({ Icon: () => null }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../journal/ProgressButton', () => ({ __esModule: true, default: () => null }));
jest.mock('../TipTarget', () => ({ __esModule: true, default: () => null }));

const tip = tips.find(item => item.id === 'protein_rotation')!;
const props = {
  untrackedTips: [tip],
  onDiscoverPremium: jest.fn(),
  fulfilledTipsSectionYRef: { current: 0 },
  periodSectionYRef: { current: { daily: 0, weekly: 0 } },
  nutritionPlanTipProgressByPeriod: { daily: [], weekly: [] },
  getCompletionAnimValue: () => new Animated.Value(0),
  tipRowLocalYByKeyRef: { current: {} },
  tipRowPeriodByKeyRef: { current: {} },
};

beforeEach(() => mockPush.mockClear());

it('groups a goal with missing weight and protein under untracked and shows both setup links', () => {
  const { getByText, queryByText } = render(<NutritionPlanTargetsSection {...props} userProfile={{}} />);
  expect(getByText('journal:nutritionLogger.untrackedTargets')).toBeTruthy();
  expect(getByText('tips:protein_rotation.title')).toBeTruthy();
  expect(queryByText('journal:nutritionLogger.untrackedTargetsExplainer')).toBeNull();
  fireEvent.press(getByText('common:nutritionTargetSection.enterWeight'));
  expect(mockPush).toHaveBeenLastCalledWith('/(stack)/settings/person');
  fireEvent.press(getByText('common:nutritionTargetSection.setProteinGoal'));
  expect(mockPush).toHaveBeenLastCalledWith('/settings/nutrition');
});

it('shows only the link for the setting that is missing', () => {
  const { getByText, queryByText, rerender } = render(<NutritionPlanTargetsSection {...props} userProfile={{ weightKg: 70 }} />);
  expect(queryByText('common:nutritionTargetSection.enterWeight')).toBeNull();
  expect(getByText('common:nutritionTargetSection.setProteinGoal')).toBeTruthy();
  rerender(<NutritionPlanTargetsSection {...props} userProfile={{ nutritionGoals: { protein: 140, carbohydrates: 250, fat: 67 } }} />);
  expect(getByText('common:nutritionTargetSection.enterWeight')).toBeTruthy();
  expect(queryByText('common:nutritionTargetSection.setProteinGoal')).toBeNull();
});
