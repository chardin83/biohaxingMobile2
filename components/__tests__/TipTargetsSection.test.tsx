import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import TargetsSection from '@/app/(stack)/dashboard/area/[areaId]/details/sections/TargetsSection';
import { Colors } from '@/app/theme/Colors';
import { tips } from '@/locales/tips';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));

let mockWeight: number | undefined = 70;
let mockProteinGoal: number | undefined = 140;
let mockPlanned = false;
jest.mock('@/app/context/StorageContext', () => ({
  useStorage: () => ({ userProfile: { weightKg: mockWeight, nutritionGoals: { protein: mockProteinGoal } }, plans: { nutrition: mockPlanned ? [{ tipId: 'protein_rotation' }] : [] } }),
}));
beforeEach(() => {
  mockWeight = 70;
  mockProteinGoal = 140;
  mockPlanned = false;
  mockPush.mockClear();
});

it.each(['weight', 'proteinGoal'])('warns about a planned goal with missing %s only until it can be tracked', missing => {
  const tip = tips.find(item => item.id === 'protein_rotation')!;
  if (missing === 'weight') mockWeight = undefined;
  else mockProteinGoal = undefined;
  const screen = render(<TargetsSection tip={tip} colors={Colors.light} t={t} />);
  expect(screen.queryByText('common:nutritionTargetSection.trackingUnavailable')).toBeNull();
  mockPlanned = true;
  screen.rerender(<TargetsSection tip={tip} colors={Colors.light} t={t} />);
  expect(screen.getByText('common:nutritionTargetSection.trackingUnavailable')).toBeTruthy();
  mockWeight = 70;
  mockProteinGoal = 140;
  screen.rerender(<TargetsSection tip={tip} colors={Colors.light} t={t} />);
  expect(screen.queryByText('common:nutritionTargetSection.trackingUnavailable')).toBeNull();
});

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));

const t = (key: string, options?: { defaultValue?: string }) => {
  if (key === 'journal:nutritionLogger.macroLabels.protein') return 'Totalprotein';
  if (key.endsWith('.methionineCysteine')) return 'Metionin + cystein';
  if (key.endsWith('.phenylalanineTyrosine')) return 'Fenylalanin + tyrosin';
  return options?.defaultValue ?? key;
};

it.each(['habitTargets', 'activityTargets', 'hydrationTargets', 'fiberTargets'] as const)('shows %s with the target amount', field => {
  const tip = tips.find(item => item[field]?.length);
  expect(tip).toBeDefined();
  const screen = render(<TargetsSection tip={tip} colors={Colors.light} t={t} />);
  expect(screen.getByText('common:nutritionTargetSection.title')).toBeTruthy();
  const target = tip![field]![0];
  expect(
    screen.getAllByText(new RegExp(`${target.amount}.*${target.unit} / common:nutritionTargetSection.periods.${tip!.targetPeriod}`)).length
  ).toBeGreaterThan(0);
});

it('does not show an empty goal card', () => {
  const tip = tips.find(item => !item.targetPeriod && !item.targetDescriptionKey && !item.noNutritionTarget);
  expect(tip).toBeDefined();
  const screen = render(<TargetsSection tip={tip} colors={Colors.light} t={t} />);
  expect(screen.queryByText('common:nutritionTargetSection.title')).toBeNull();
});

it('shows the journal link only when the tip has a plan action', () => {
  const tip = tips.find(item => item.habitTargets?.length);
  const onShowJournal = jest.fn();
  const screen = render(<TargetsSection tip={tip} colors={Colors.light} t={t} />);
  expect(screen.queryByRole('link')).toBeNull();
  screen.rerender(<TargetsSection tip={tip} colors={Colors.light} t={t} onShowJournal={onShowJournal} />);
  fireEvent.press(screen.getByRole('link'));
  expect(onShowJournal).toHaveBeenCalledTimes(1);
});

it('shows premium information and opens Premium only for AI tracking targets', () => {
  const aiTip = tips.find(item => item.trackingTargets?.some(target => target.aiInstruction));
  const regularTip = tips.find(item => item.habitTargets?.length);
  expect(aiTip).toBeDefined();
  const onDiscoverPremium = jest.fn();
  const screen = render(<TargetsSection tip={aiTip} colors={Colors.light} t={t} onDiscoverPremium={onDiscoverPremium} />);
  expect(screen.getByText('common:nutritionTargetSection.premiumExplainer')).toBeTruthy();
  fireEvent.press(screen.getByRole('button'));
  expect(onDiscoverPremium).toHaveBeenCalledTimes(1);
  screen.rerender(<TargetsSection tip={regularTip} colors={Colors.light} t={t} onDiscoverPremium={onDiscoverPremium} />);
  expect(screen.queryByText('common:nutritionTargetSection.premiumExplainer')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
});

it('renders nine weight-based amino acid goals and updates them when weight changes', () => {
  const tip = tips.find(item => item.id === 'protein_rotation')!;
  const screen = render(<TargetsSection tip={tip} colors={Colors.light} t={t} />);
  expect(screen.getAllByText(/\d+ mg \/ common:nutritionTargetSection.periods.daily/)).toHaveLength(9);
  expect(screen.getByText('Metionin + cystein')).toBeTruthy();
  expect(screen.getByText('Fenylalanin + tyrosin')).toBeTruthy();
  expect(screen.getByText('tips:protein_rotation.targets.description')).toBeTruthy();
  expect(screen.getByText(/2730 mg/)).toBeTruthy();
  expect(screen.queryByText('common:nutritionTargetSection.enterWeight')).toBeNull();
  mockWeight = 80;
  screen.rerender(<TargetsSection tip={tip} colors={Colors.light} t={t} />);
  expect(screen.getByText(/3120 mg/)).toBeTruthy();
});

it('asks for weight instead of displaying invented or zero goals', () => {
  mockWeight = undefined;
  const tip = tips.find(item => item.id === 'protein_rotation')!;
  const screen = render(<TargetsSection tip={tip} colors={Colors.light} t={t} />);
  expect(screen.getByText('common:nutritionTargetSection.weightRequired')).toBeTruthy();
  fireEvent.press(screen.getByText('common:nutritionTargetSection.enterWeight'));
  expect(mockPush).toHaveBeenCalledWith('/(stack)/settings/person');
  expect(screen.queryAllByText(/\d+ mg \/ common:nutritionTargetSection.periods.daily/)).toHaveLength(0);
});

it('displays and updates total protein from the user nutrition goal', () => {
  const tip = tips.find(item => item.id === 'protein_rotation')!;
  const screen = render(<TargetsSection tip={tip} colors={Colors.light} t={t} />);
  expect(screen.getByText('Totalprotein')).toBeTruthy();
  expect(screen.getByText(/140.0 g/)).toBeTruthy();
  mockProteinGoal = 160;
  screen.rerender(<TargetsSection tip={tip} colors={Colors.light} t={t} />);
  expect(screen.getByText(/160.0 g/)).toBeTruthy();
});

it('links to the person card nutrition goals and hides tracking when protein is unset', () => {
  mockProteinGoal = undefined;
  const tip = tips.find(item => item.id === 'protein_rotation')!;
  const screen = render(<TargetsSection tip={tip} colors={Colors.light} t={t} onShowJournal={jest.fn()} />);
  expect(screen.getByText('common:nutritionTargetSection.proteinGoalRequired')).toBeTruthy();
  expect(screen.queryByText('Totalprotein')).toBeNull();
  expect(screen.queryByText('common:nutritionTargetSection.showJournal')).toBeNull();
  fireEvent.press(screen.getByText('common:nutritionTargetSection.setProteinGoal'));
  expect(mockPush).toHaveBeenCalledWith('/settings/nutrition');
  mockProteinGoal = 150;
  screen.rerender(<TargetsSection tip={tip} colors={Colors.light} t={t} onShowJournal={jest.fn()} />);
  expect(screen.queryByText('common:nutritionTargetSection.setProteinGoal')).toBeNull();
  expect(screen.getByText('Totalprotein')).toBeTruthy();
  expect(screen.getByText('common:nutritionTargetSection.showJournal')).toBeTruthy();
});

it.each(['berberine', 'ashwagandha_adaptogen', 'astaxanthin_recovery_antioxidant', 'reishi_mushroom', 'rhodiola_adaptogen', 'lions_mane_mushroom', 'cordyceps_adaptogen', 'chaga_mushroom', 'glynac'])('shows an explanatory target card without inventing a nutrition goal for %s', tipId => {
  const tip = tips.find(item => item.id === tipId)!;
  const screen = render(<TargetsSection tip={tip} colors={Colors.light} t={t} />);
  expect(tip.targetPeriod).toBeUndefined();
  expect(screen.getByText('common:nutritionTargetSection.title')).toBeTruthy();
  expect(screen.getByText('common:nutritionTargetSection.noNutritionTarget')).toBeTruthy();
  expect(screen.queryByText(/common:nutritionTargetSection.periods/)).toBeNull();
});
