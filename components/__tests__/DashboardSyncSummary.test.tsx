import { act, fireEvent, render } from '@testing-library/react-native';
import i18next from 'i18next';
import React from 'react';
import { Platform } from 'react-native';

import { EMPTY_PLANS, type PlansByCategory, type PlanTipEntry } from '@/app/context/storage/plans/planTypes';
import { useStorage } from '@/app/context/StorageContext';
import { DashboardSyncSummary } from '@/components/DashboardSyncSummary';
import common from '@/locales/sv/common.json';
import { tips } from '@/locales/tips';
import { GOAL_CATEGORIES, type GoalCategory } from '@/services/targetProgress/plannedGoalCategories';
import { useWearable } from '@/wearables/wearableProvider';

const mockPush = jest.fn();
const mockSetOnboardingStep = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/app/context/StorageContext', () => ({ useStorage: jest.fn() }));
jest.mock('@/wearables/wearableProvider', () => ({ useWearable: jest.fn() }));
jest.mock('@react-navigation/native', () => ({
  useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: jest.requireActual('i18next').t.bind(jest.requireActual('i18next')) }),
}));
jest.mock('@/components/ui/IconSymbol', () => ({ IconSymbol: () => null }));

beforeAll(async () => {
  await i18next.init({ lng: 'sv', resources: { sv: { common } }, defaultNS: 'common', interpolation: { escapeValue: false } });
});

function plansFor(categories: readonly GoalCategory[]): PlansByCategory {
  const plans = { ...EMPTY_PLANS };
  for (const category of categories) {
    const tip = tips.find(item => item.targetPeriod && item.planCategory?.includes(category));
    const entry: PlanTipEntry = {
      tipId: tip!.id,
      startedAt: '2026-01-01',
      planCategory: category,
      createdBy: 'test',
      editedBy: 'test',
      editedAt: '2026-01-01',
    };
    plans[category] = [entry];
  }
  return plans;
}

function setSummary(
  isReady: boolean,
  count: number,
  error: string | null = null,
  plans = plansFor(GOAL_CATEGORIES),
  onboardingStep?: number,
  healthSyncEnabled = false,
  hideHealthSyncPrompt = false
) {
  jest.mocked(useStorage).mockReturnValue({
    automaticHabitSummary: { isReady, newGoalsCount: count },
    plans,
    onboardingStep,
    setOnboardingStep: mockSetOnboardingStep,
    healthSyncEnabled,
    hideHealthSyncPrompt,
  } as unknown as ReturnType<typeof useStorage>);
  jest.mocked(useWearable).mockReturnValue({ syncError: error } as unknown as ReturnType<typeof useWearable>);
}

it('shows a spinner until sync and habit processing finish, then shows the actual count', () => {
  setSummary(false, 0);
  const screen = render(<DashboardSyncSummary />);
  expect(screen.getByTestId('dashboard-sync-spinner')).toBeTruthy();
  expect(screen.queryByText('Nya framsteg!')).toBeNull();
  setSummary(true, 1);
  screen.rerender(<DashboardSyncSummary />);
  expect(screen.queryByTestId('dashboard-sync-spinner')).toBeNull();
  expect(screen.getByText('Nya framsteg!')).toBeTruthy();
  expect(screen.getByLabelText('1 nytt habit-mål.')).toBeTruthy();
  fireEvent.press(screen.getByText('Kom ihåg att logga manuellt.'));
  expect(mockPush).toHaveBeenCalledWith('/(tabs)/journal');
});

it('uses plural and zero forms without inventing progress', () => {
  setSummary(true, 2);
  const screen = render(<DashboardSyncSummary />);
  expect(screen.getByLabelText('2 nya habit-mål.')).toBeTruthy();
  setSummary(true, 0);
  screen.rerender(<DashboardSyncSummary />);
  expect(screen.getByText('Allt är uppdaterat!')).toBeTruthy();
  expect(screen.getByText('Inga nya mål sedan senaste besöket.')).toBeTruthy();
});

it('shows failed sync information and keeps the manual logging link available', () => {
  setSummary(true, 0, 'offline');
  const screen = render(<DashboardSyncSummary />);
  expect(screen.getByText('Synkningen kunde inte slutföras')).toBeTruthy();
  expect(screen.queryByText('Nya framsteg!')).toBeNull();
  expect(screen.queryByTestId('countdown-circle')).toBeNull();
  expect(screen.getByText('Kom ihåg att logga manuellt.')).toBeTruthy();
});

it('counts down from five and dismisses only the up-to-date card at zero', () => {
  jest.useFakeTimers();
  try {
    setSummary(false, 0);
    const screen = render(<DashboardSyncSummary />);
    expect(screen.queryByTestId('countdown-circle')).toBeNull();
    setSummary(true, 0);
    screen.rerender(<DashboardSyncSummary />);
    expect(screen.getByText('5')).toBeTruthy();
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByText('4')).toBeTruthy();
    act(() => jest.advanceTimersByTime(3000));
    expect(screen.getByText('1')).toBeTruthy();
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.queryByTestId('dashboard-sync-summary')).toBeNull();
    screen.unmount();
  } finally {
    jest.useRealTimers();
  }
});

it('dismisses the whole card with the close button without navigating', () => {
  mockPush.mockClear();
  setSummary(true, 1);
  const screen = render(<DashboardSyncSummary />);
  fireEvent.press(screen.getByRole('button', { name: 'Stäng' }));
  expect(screen.queryByTestId('dashboard-sync-summary')).toBeNull();
  expect(mockPush).not.toHaveBeenCalled();
});

it('cancels automatic dismissal if new progress arrives during the countdown', () => {
  jest.useFakeTimers();
  try {
    setSummary(true, 0);
    const screen = render(<DashboardSyncSummary />);
    act(() => jest.advanceTimersByTime(3000));
    setSummary(true, 1);
    screen.rerender(<DashboardSyncSummary />);
    expect(screen.queryByTestId('countdown-circle')).toBeNull();
    act(() => jest.advanceTimersByTime(5000));
    expect(screen.getByText('Nya framsteg!')).toBeTruthy();
    screen.unmount();
  } finally {
    jest.useRealTimers();
  }
});

it('welcomes users without goal tips and opens search for their first tip', () => {
  mockPush.mockClear();
  setSummary(true, 0, null, EMPTY_PLANS);
  const screen = render(<DashboardSyncSummary />);
  expect(screen.getByText('Kom igång')).toBeTruthy();
  expect(screen.queryByText('Kom ihåg att logga manuellt.')).toBeNull();
  expect(screen.queryByTestId('countdown-circle')).toBeNull();
  fireEvent.press(screen.getByText('Lägg till ditt första tips'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(tabs)/search', params: { planCategories: 'other,nutrition,training', targetPeriods: 'daily,weekly' } });
});

it.each([
  ['training', 'Lägg till ditt första träningsmål'],
  ['nutrition', 'Lägg till ditt första nutritionsmål'],
  ['other', 'Lägg till ditt första mål för goda vanor'],
] as const)('offers a missing %s goal instead of closing the card', (missing, label) => {
  mockPush.mockClear();
  setSummary(true, 0, null, plansFor(GOAL_CATEGORIES.filter(category => category !== missing)));
  const screen = render(<DashboardSyncSummary />);
  expect(screen.getByText('Allt är uppdaterat!')).toBeTruthy();
  expect(screen.queryByTestId('countdown-circle')).toBeNull();
  expect(screen.queryByText('Kom ihåg att logga manuellt.')).toBeNull();
  fireEvent.press(screen.getByText(label));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(tabs)/search', params: { planCategories: missing, targetPeriods: 'daily,weekly', goalIntro: missing } });
});

it('offers every missing category when only habits have been added', () => {
  setSummary(true, 0, null, plansFor(['other']));
  const screen = render(<DashboardSyncSummary />);
  expect(screen.getByText('Lägg till ditt första träningsmål')).toBeTruthy();
  expect(screen.getByText('Lägg till ditt första nutritionsmål')).toBeTruthy();
  expect(screen.queryByText('Lägg till ditt första mål för goda vanor')).toBeNull();
  expect(screen.queryByTestId('countdown-circle')).toBeNull();
});

it('does not count tips without measurable targets as goal tips', () => {
  const tip = tips.find(item => !item.targetPeriod)!;
  const plans = plansFor(['other']);
  plans.other = [{ ...plans.other[0], tipId: tip.id }];
  setSummary(true, 0, null, plans);
  const screen = render(<DashboardSyncSummary />);
  expect(screen.getByText('Kom igång')).toBeTruthy();
});

it('shows the first-goal welcome after onboarding without an accepted AI tip, even while sync is pending', () => {
  setSummary(false, 0, null, EMPTY_PLANS, 6);
  const screen = render(<DashboardSyncSummary />);
  expect(screen.getByText('Välkommen!')).toBeTruthy();
  expect(screen.getByText('Kom igång med att välja ditt första mål.')).toBeTruthy();
  expect(screen.queryByText('Allt är uppdaterat!')).toBeNull();
  expect(screen.queryByTestId('dashboard-sync-spinner')).toBeNull();
  fireEvent.press(screen.getByText('Lägg till ditt första tips'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(tabs)/search', params: { planCategories: 'other,nutrition,training', targetPeriods: 'daily,weekly' } });
  expect(mockSetOnboardingStep).toHaveBeenCalledWith(7);
});

it.each([
  ['ios', 'Koppla Apple Hälsa'],
  ['android', 'Koppla Health Connect'],
] as const)('offers health configuration on %s after an accepted AI plan', (platform, title) => {
  const replacement = jest.replaceProperty(Platform, 'OS', platform);
  try {
    setSummary(false, 0, null, plansFor(['other']), 5);
    const screen = render(<DashboardSyncSummary />);
    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByText('Synka aktivitet, sömn och andra hälsodata.')).toBeTruthy();
    expect(screen.queryByText('Allt är uppdaterat!')).toBeNull();
    expect(screen.queryByTestId('countdown-circle')).toBeNull();
    expect(screen.getByText('Välkommen!')).toBeTruthy();
    expect(screen.getByText('Din AI-plan är redo. Utforska dagboken – logga måltider och vanor.')).toBeTruthy();
    fireEvent.press(screen.getByText(title));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/settings/health-sync');
  } finally {
    replacement.restore();
  }
});

it('does not prompt to connect health when sync is already enabled', () => {
  setSummary(true, 0, null, plansFor(GOAL_CATEGORIES), 5, true);
  const screen = render(<DashboardSyncSummary />);
  expect(screen.queryByText('Koppla Apple Hälsa')).toBeNull();
  expect(screen.getByText('Välkommen!')).toBeTruthy();
  expect(screen.getByText('Din AI-plan är redo. Utforska dagboken – logga måltider och vanor.')).toBeTruthy();
});

it('keeps the AI welcome available when opening health configuration', () => {
  mockSetOnboardingStep.mockClear();
  setSummary(true, 0, null, plansFor(['other']), 5);
  const screen = render(<DashboardSyncSummary />);
  mockSetOnboardingStep.mockClear();
  fireEvent.press(screen.getByText(Platform.OS === 'android' ? 'Koppla Health Connect' : 'Koppla Apple Hälsa'));
  expect(mockSetOnboardingStep).not.toHaveBeenCalled();
  expect(screen.getByText('Välkommen!')).toBeTruthy();
});
it('offers a recovery health link for an AI plan after the old handler dismissed its welcome', () => {
  const plans = plansFor(['other']);
  plans.other[0].createdBy = 'AI';
  setSummary(true, 0, null, plans, 7);
  const screen = render(<DashboardSyncSummary />);
  fireEvent.press(screen.getByText(Platform.OS === 'android' ? 'Koppla Health Connect' : 'Koppla Apple Hälsa'));
  expect(mockPush).toHaveBeenCalledWith('/(stack)/settings/health-sync');
});

it.each([5, 7])('respects the saved hide-health preference for onboarding state %s', step => {
  const plans = plansFor(['other']);
  plans.other[0].createdBy = 'AI';
  setSummary(true, 0, null, plans, step, false, true);
  const screen = render(<DashboardSyncSummary />);
  const title = Platform.OS === 'android' ? 'Koppla Health Connect' : 'Koppla Apple Hälsa';
  expect(screen.queryByText(title)).toBeNull();
  setSummary(true, 0, null, plans, step, false, false);
  screen.rerender(<DashboardSyncSummary />);
  expect(screen.getByText(title)).toBeTruthy();
});

it('shows the onboarding welcome once, then restores the normal status after restarting', () => {
  mockSetOnboardingStep.mockClear();
  const plans = plansFor(GOAL_CATEGORIES);
  plans.other[0].createdBy = 'AI';
  setSummary(true, 0, null, plans, 5, false, true);
  const firstVisit = render(<DashboardSyncSummary />);
  expect(firstVisit.getByText('Välkommen!')).toBeTruthy();
  expect(mockSetOnboardingStep).toHaveBeenCalledWith(7);
  setSummary(true, 0, null, plans, 7, false, true);
  firstVisit.rerender(<DashboardSyncSummary />);
  expect(firstVisit.getByText('Välkommen!')).toBeTruthy();
  firstVisit.unmount();
  const nextVisit = render(<DashboardSyncSummary />);
  expect(nextVisit.queryByText('Välkommen!')).toBeNull();
  expect(nextVisit.getByText('Allt är uppdaterat!')).toBeTruthy();
  expect(nextVisit.getByText('Inga nya mål sedan senaste besöket.')).toBeTruthy();
  expect(nextVisit.queryByText('Koppla Apple Hälsa')).toBeNull();
});

it('does not repeat the welcome on restarting without any goals', () => {
  setSummary(true, 0, null, EMPTY_PLANS, 7);
  const screen = render(<DashboardSyncSummary />);
  expect(screen.queryByText('Välkommen!')).toBeNull();
  expect(screen.getByText('Kom igång med att välja ditt första mål.')).toBeTruthy();
});


it('links from the up-to-date card to health settings even when sync is enabled, unless hidden', () => {
  setSummary(true, 0, null, plansFor(GOAL_CATEGORIES), 7, true);
  const screen = render(<DashboardSyncSummary />);
  const title = Platform.OS === 'android' ? 'Koppla Health Connect' : 'Koppla Apple Hälsa';
  expect(screen.getByText('Allt är uppdaterat!')).toBeTruthy();
  fireEvent.press(screen.getByText(title));
  expect(mockPush).toHaveBeenCalledWith('/(stack)/settings/health-sync');
  setSummary(true, 0, null, plansFor(GOAL_CATEGORIES), 7, true, true);
  screen.rerender(<DashboardSyncSummary />);
  expect(screen.queryByText(title)).toBeNull();
});


it('shows the health settings link while syncing unless the prompt is hidden', () => {
  setSummary(false, 0, null, plansFor(GOAL_CATEGORIES), 7, true);
  const screen = render(<DashboardSyncSummary />);
  const title = Platform.OS === 'android' ? 'Koppla Health Connect' : 'Koppla Apple Hälsa';
  expect(screen.getByTestId('dashboard-sync-spinner')).toBeTruthy();
  fireEvent.press(screen.getByText(title));
  expect(mockPush).toHaveBeenCalledWith('/(stack)/settings/health-sync');
  setSummary(false, 0, null, plansFor(GOAL_CATEGORIES), 7, true, true);
  screen.rerender(<DashboardSyncSummary />);
  expect(screen.queryByText(title)).toBeNull();
});
