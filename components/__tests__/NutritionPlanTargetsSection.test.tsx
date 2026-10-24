import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Animated } from 'react-native';

import type { TipProgressItem } from '@/app/context/storage/nutrition/nutritionTypes';
import NutritionPlanTargetsSection from '@/components/journal/NutritionPlanTargetsSection';
import { type Tip, tips } from '@/locales/tips';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: (...args: unknown[]) => mockPush(...args) }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'sv' } }) }));
jest.mock('react-native-paper', () => ({ Icon: () => null }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../journal/ProgressButton', () => ({ __esModule: true, default: () => null }));
jest.mock('../TipTarget', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ target }: any) => <Text>{target.label}</Text> };
});

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

it('shows all targets for a premium-blocked tip', () => {
  const sulfurTip: Tip = { ...tip, targetPeriod: 'daily', trackingTargets: [{ trackingKey: 'sulfur_rich_vegetables', amount: 1, unit: 'items', aiInstruction: 'Detect visible vegetables' }] };
  const progress: TipProgressItem = {
    tipId: sulfurTip.id, title: sulfurTip.title, period: 'daily',
    targets: [
      { tag: 'methionine', unit: 'mg', period: 'daily', amount: 1050, actual: 100, isMet: false, label: 'Metionin + cystein' },
      { tag: 'sulfur_rich_vegetables', unit: 'items', period: 'daily', amount: 1, actual: 0, isMet: false, label: 'Svavelrika grönsaker' },
    ],
    metCount: 0, totalCount: 2, isFulfilled: false, progress: 0,
  };
  const screen = render(<NutritionPlanTargetsSection {...props} untrackedTips={[sulfurTip]} userProfile={{ weightKg: 70, nutritionGoals: { protein: 140, carbohydrates: 250, fat: 67 } }} nutritionPlanTipProgressByPeriod={{ daily: [progress], weekly: [] }} />);
  expect(screen.getByText('Metionin + cystein')).toBeTruthy();
  expect(screen.getByText('Svavelrika grönsaker')).toBeTruthy();
  expect(screen.getByText('journal:nutritionLogger.untrackedTargetsExplainer')).toBeTruthy();
});

it('offers the GI follow-up link inside the single nutrition goal card', () => {
  const AppButton = require('../ui/AppButton').default;
  const screen = render(<NutritionPlanTargetsSection {...props} untrackedTips={[]} nutritionPlanTipProgressByPeriod={{ daily: [{
    tipId: 'glycemic_index', title: 'GI', period: 'daily', targets: [], metCount: 0, totalCount: 2, progress: 0, isFulfilled: false,
  }], weekly: [] }} />);
  const link = screen.UNSAFE_getAllByType(AppButton).find(button => button.props.title === 'tips:glycemic_index.goalReview.link');
  expect(link).toBeTruthy();
  link!.props.onPress();
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(stack)/plan/[tipId]/metric/[metricId]', params: { tipId: 'glycemic_index', metricId: 'glycemic_index' } });
});
