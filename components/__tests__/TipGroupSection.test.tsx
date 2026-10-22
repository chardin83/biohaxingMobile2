import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import TipGroupSection from '@/components/sections/details/TipGroupSection';
import enGroups from '@/locales/en/tipGroups.json';
import svGroups from '@/locales/sv/tipGroups.json';
import { tipGroupIds } from '@/locales/tipGroups';
import { tips } from '@/locales/tips';

const mockPush = jest.fn();
const mockDismiss = jest.fn();
let mockLevel = 10;
let mockOnDismiss: () => void;
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ myLevel: mockLevel }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, options?: { level?: number }) => options?.level ? `${key}:${options.level}` : key }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/InformationCardLink', () => ({ InformationCardLink: ({ title, children, onDismiss }: any) => {
  const { View, Text } = require('react-native');
  mockOnDismiss = onDismiss;
  return <View><Text>{title}</Text>{children(mockDismiss)}</View>;
} }));

beforeEach(() => { jest.clearAllMocks(); mockLevel = 10; });

it('keeps all groups separate from tips, with valid membership and translations', () => {
  for (const id of tipGroupIds) {
    expect(tips.some(tip => tip.id === id)).toBe(false);
    expect(tips.some(tip => tip.groupIds?.includes(id))).toBe(true);
    expect(svGroups[id].title).toBeTruthy();
    expect(svGroups[id].description).toBeTruthy();
    expect(enGroups[id].title).toBeTruthy();
    expect(enGroups[id].description).toBeTruthy();
  }
  for (const tip of tips) {
    for (const groupId of tip.groupIds ?? []) expect(tipGroupIds).toContain(groupId);
  }
});

it('shows group information and other members, and navigates after the sheet closes', () => {
  const tip = tips.find(item => item.id === 'reishi_mushroom')!;
  const screen = render(<TipGroupSection tip={tip} fromPlan="1" />);
  expect(screen.getByText('tipGroups:medicinal_mushrooms.title')).toBeTruthy();
  expect(screen.getByText('tipGroups:medicinal_mushrooms.description')).toBeTruthy();
  expect(screen.queryByText('tips:reishi_mushroom.title')).toBeNull();
  expect(screen.queryByText('tips:rhodiola_adaptogen.title')).toBeNull();
  fireEvent.press(screen.getByText('tips:lions_mane_mushroom.title'));
  expect(mockDismiss).toHaveBeenCalledTimes(1);
  expect(mockPush).not.toHaveBeenCalled();
  mockOnDismiss();
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/dashboard/area/[areaId]/details', params: { areaId: 'mind', tipId: 'lions_mane_mushroom', fromPlan: '1' } });
});

it('keeps higher-level group members locked', () => {
  mockLevel = 6;
  const screen = render(<TipGroupSection tip={tips.find(item => item.id === 'reishi_mushroom')} />);
  expect(screen.queryByText('tips:lions_mane_mushroom.title')).toBeNull();
  fireEvent.press(screen.getAllByText('common:tipGroupSection.locked:8')[0]);
  expect(mockDismiss).not.toHaveBeenCalled();
  expect(mockPush).not.toHaveBeenCalled();
});

it('does not show a group for a tip without membership', () => {
  const screen = render(<TipGroupSection tip={tips.find(item => !item.groupIds?.length)} />);
  expect(screen.queryByText('common:tipGroupSection.title')).toBeNull();
});

it('shows both groups for GlyNAC and keeps it free of nutrition targets', () => {
  const tip = tips.find(item => item.id === 'glynac')!;
  const screen = render(<TipGroupSection tip={tip} />);
  expect(screen.getByText('tipGroups:sulfate.title')).toBeTruthy();
  expect(screen.getByText('tipGroups:amino_acids.title')).toBeTruthy();
  expect(screen.getByText('tips:msm_joint_health.title')).toBeTruthy();
  expect(screen.getByText('tips:muscle_leucine.title')).toBeTruthy();
  expect(tip.areas[0].id).toBe('longevity');
  expect(tip.areas.some(area => area.id === 'mind')).toBe(true);
  expect(tip.targetPeriod).toBeUndefined();
  expect(tip.aminoAcidTargets).toBeUndefined();
  expect(tip.supplements).toEqual([{ id: 'glycine' }, { id: 'nac' }]);
});
