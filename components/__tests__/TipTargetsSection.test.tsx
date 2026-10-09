import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import TargetsSection from '@/app/(stack)/dashboard/area/[areaId]/details/sections/TargetsSection';
import { Colors } from '@/app/theme/Colors';
import { tips } from '@/locales/tips';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));

const t = (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key;

it.each(['habitTargets', 'activityTargets', 'hydrationTargets', 'fiberTargets'] as const)('shows %s with the target amount and explainer', field => {
  const tip = tips.find(item => item[field]?.length);
  expect(tip).toBeDefined();
  const screen = render(<TargetsSection tip={tip} colors={Colors.light} t={t} />);
  expect(screen.getByText('common:nutritionTargetSection.title')).toBeTruthy();
  expect(screen.getByText('nutritionTargetSection.description')).toBeTruthy();
  const target = tip![field]![0];
  expect(screen.getAllByText(new RegExp(`${target.amount}.*${target.unit} / common:nutritionTargetSection.periods.${tip!.targetPeriod}`)).length).toBeGreaterThan(0);
});

it('does not show an empty goal card', () => {
  const tip = tips.find(item => !item.targetPeriod);
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
