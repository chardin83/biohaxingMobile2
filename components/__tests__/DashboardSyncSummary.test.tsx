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

let mockNutritionEntries: Array<{ type: 'meal' | 'food' | 'drink' }> = [{ type: 'meal' }];
beforeEach(() => {
  jest.clearAllMocks();
  mockNutritionEntries = [{ type: 'meal' }];
});
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
    dailyNutritionTracking: { '2026-01-01': { entries: mockNutritionEntries } },
    plans,
    onboardingStep,
    setOnboardingStep: mockSetOnboardingStep,
    healthSyncEnabled,
    hideHealthSyncPrompt,
  } as unknown as ReturnType<typeof useStorage>);
  jest.mocked(useWearable).mockReturnValue({ syncError: error } as unknown as ReturnType<typeof useWearable>);
}

const mealTitle = 'Lägg in din första måltid';
const nutritionTitle = 'Lägg till ditt första näringsmål';
const habitsTitle = 'Lägg till ditt första mål för goda vanor';
const trainingTitle = 'Lägg till ditt första träningsmål';
const manualTitle = 'Kom ihåg att logga manuellt.';
const healthTitle = () => (Platform.OS === 'android' ? 'Koppla Health Connect' : 'Koppla Apple Hälsa');

function actionTitles(screen: ReturnType<typeof render>): string[] {
  return screen.queryAllByTestId('dashboard-summary-action').map(node => node.props.accessibilityLabel);
}

it('replaces suggestions with clickable progress information after sync', () => {
  setSummary(false, 0);
  const screen = render(<DashboardSyncSummary />);
  expect(actionTitles(screen)).toEqual([healthTitle()]);
  expect(screen.getByTestId('dashboard-sync-spinner')).toBeTruthy();
  setSummary(true, 1);
  screen.rerender(<DashboardSyncSummary />);
  expect(screen.queryByTestId('dashboard-sync-spinner')).toBeNull();
  expect(screen.getByText('Nya framsteg!')).toBeTruthy();
  expect(screen.getByText('Sedan ditt senaste besök har appen automatiskt registrerat: 1 nytt habit-mål.')).toBeTruthy();
  expect(actionTitles(screen)).toEqual([]);
  fireEvent.press(screen.getByRole('button', { name: /Nya framsteg!/ }));
  expect(mockPush).toHaveBeenCalledWith('/(stack)/journal/habits/progress');
  setSummary(true, 2);
  screen.rerender(<DashboardSyncSummary />);
  expect(screen.getByText('Sedan ditt senaste besök har appen automatiskt registrerat: 2 nya habit-mål.')).toBeTruthy();
  expect(actionTitles(screen)).toEqual([]);
});

it.each([false, true])('prioritizes meal and health above all missing goals, ready=%s', ready => {
  mockNutritionEntries = [];
  setSummary(ready, 0, null, EMPTY_PLANS, 7);
  const screen = render(<DashboardSyncSummary />);
  expect(actionTitles(screen)).toEqual([mealTitle, healthTitle()]);
});

it.each([
  { categories: [] as GoalCategory[], hidden: false, expected: () => [healthTitle(), nutritionTitle] },
  { categories: [] as GoalCategory[], hidden: true, expected: () => [nutritionTitle, habitsTitle] },
  { categories: ['nutrition'] as GoalCategory[], hidden: true, expected: () => [habitsTitle, trainingTitle] },
  { categories: ['nutrition', 'other'] as GoalCategory[], hidden: true, expected: () => [trainingTitle] },
  { categories: ['other'] as GoalCategory[], hidden: true, expected: () => [nutritionTitle, trainingTitle] },
  { categories: [...GOAL_CATEGORIES], hidden: true, expected: () => [manualTitle] },
])('selects at most two actions in priority order for $categories, health hidden=$hidden', ({ categories, hidden, expected }) => {
  setSummary(false, 0, null, plansFor(categories), 7, true, hidden);
  const screen = render(<DashboardSyncSummary />);
  expect(actionTitles(screen)).toEqual(expected());
  setSummary(true, 0, null, plansFor(categories), 7, true, hidden);
  screen.rerender(<DashboardSyncSummary />);
  expect(actionTitles(screen)).toEqual(expected());
});

it.each([5, 6, 7])('uses the same priorities for onboarding state %s', step => {
  mockNutritionEntries = [];
  setSummary(false, 0, null, EMPTY_PLANS, step);
  const screen = render(<DashboardSyncSummary />);
  expect(actionTitles(screen)).toEqual([mealTitle, healthTitle()]);
  setSummary(true, 0, null, EMPTY_PLANS, step);
  screen.rerender(<DashboardSyncSummary />);
  expect(actionTitles(screen)).toEqual([mealTitle, healthTitle()]);
  expect(screen.queryByText('Lägg till ditt första tips')).toBeNull();
});

it('shows missing habit goals before sync completes without adding any new actions at completion', () => {
  setSummary(false, 0, null, plansFor(['nutrition']), 7, true, true);
  const screen = render(<DashboardSyncSummary />);
  expect(actionTitles(screen)).toEqual([habitsTitle, trainingTitle]);
  setSummary(true, 0, null, plansFor(['nutrition']), 7, true, true);
  screen.rerender(<DashboardSyncSummary />);
  expect(actionTitles(screen)).toEqual([habitsTitle, trainingTitle]);
});

it.each([
  ['training', trainingTitle],
  ['nutrition', nutritionTitle],
  ['other', habitsTitle],
] as const)('links the %s action to its specific search filters', (missing, title) => {
  setSummary(false, 0, null, plansFor(GOAL_CATEGORIES.filter(category => category !== missing)), 7, false, true);
  const screen = render(<DashboardSyncSummary />);
  fireEvent.press(screen.getByRole('button', { name: title }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(tabs)/search', params: { planCategories: missing, targetPeriods: 'daily,weekly', goalIntro: missing } });
});

it.each(['ios', 'android'] as const)('links health configuration on %s even when sync is enabled', platform => {
  const replacement = jest.replaceProperty(Platform, 'OS', platform);
  try {
    setSummary(false, 0, null, plansFor(GOAL_CATEGORIES), 7, true);
    const screen = render(<DashboardSyncSummary />);
    fireEvent.press(screen.getByRole('button', { name: healthTitle() }));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/settings/health-sync');
  } finally {
    replacement.restore();
  }
});

it('respects hide health and promotes the next goal in the queue', () => {
  mockNutritionEntries = [];
  setSummary(false, 0, null, EMPTY_PLANS, 7);
  const screen = render(<DashboardSyncSummary />);
  expect(actionTitles(screen)).toEqual([mealTitle, healthTitle()]);
  setSummary(false, 0, null, EMPTY_PLANS, 7, false, true);
  screen.rerender(<DashboardSyncSummary />);
  expect(actionTitles(screen)).toEqual([mealTitle, nutritionTitle]);
});

it.each(['meal', 'food'] as const)('removes the first-meal action after a %s entry but does not count drinks', type => {
  mockNutritionEntries = [{ type: 'drink' }];
  setSummary(false, 0, null, EMPTY_PLANS, 7);
  const screen = render(<DashboardSyncSummary />);
  expect(actionTitles(screen)).toEqual([mealTitle, healthTitle()]);
  fireEvent.press(screen.getByRole('button', { name: mealTitle }));
  const today = new Date();
  const selectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(tabs)/journal', params: { openTab: 'meal', selectedDate } });
  mockNutritionEntries = [{ type }];
  setSummary(false, 0, null, EMPTY_PLANS, 7);
  screen.rerender(<DashboardSyncSummary />);
  expect(actionTitles(screen)).toEqual([healthTitle(), nutritionTitle]);
});

it('does not count unmeasurable tips as an existing goal', () => {
  const plans = plansFor(GOAL_CATEGORIES);
  plans.other = [{ ...plans.other[0], tipId: tips.find(tip => !tip.targetPeriod)!.id }];
  setSummary(false, 0, null, plans, 7, false, true);
  const screen = render(<DashboardSyncSummary />);
  expect(actionTitles(screen)).toEqual([habitsTitle]);
});

it('retains the welcome during its visit, consumes it once, and restores ordinary status on restart', () => {
  setSummary(false, 0, null, plansFor(GOAL_CATEGORIES), 5);
  const firstVisit = render(<DashboardSyncSummary />);
  expect(firstVisit.getByText('Välkommen!')).toBeTruthy();
  expect(firstVisit.getByText('Din AI-plan är redo. Utforska dagboken – logga måltider och vanor.')).toBeTruthy();
  expect(mockSetOnboardingStep).toHaveBeenCalledWith(7);
  mockSetOnboardingStep.mockClear();
  fireEvent.press(firstVisit.getByRole('button', { name: healthTitle() }));
  expect(mockSetOnboardingStep).not.toHaveBeenCalled();
  setSummary(true, 0, null, plansFor(GOAL_CATEGORIES), 7);
  firstVisit.rerender(<DashboardSyncSummary />);
  expect(firstVisit.getByText('Välkommen!')).toBeTruthy();
  firstVisit.unmount();
  const nextVisit = render(<DashboardSyncSummary />);
  expect(nextVisit.queryByText('Välkommen!')).toBeNull();
  expect(nextVisit.getByText('Allt är uppdaterat!')).toBeTruthy();
});

it('uses the non-AI welcome text when the AI plan was skipped', () => {
  setSummary(false, 0, null, EMPTY_PLANS, 6);
  const screen = render(<DashboardSyncSummary />);
  expect(screen.getByText('Välkommen!')).toBeTruthy();
  expect(screen.getByText('Kom igång med att välja ditt första mål.')).toBeTruthy();
});

it('only shows the manual action when there are no other suggestions, and counts down after sync', () => {
  jest.useFakeTimers();
  try {
    setSummary(false, 0, null, plansFor(GOAL_CATEGORIES), 7, true, true);
    const screen = render(<DashboardSyncSummary />);
    expect(actionTitles(screen)).toEqual([manualTitle]);
    fireEvent.press(screen.getByRole('button', { name: manualTitle }));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/journal');
    act(() => jest.advanceTimersByTime(6000));
    expect(screen.getByTestId('dashboard-sync-summary')).toBeTruthy();
    expect(screen.queryByText('5')).toBeNull();
    setSummary(true, 0, null, plansFor(GOAL_CATEGORIES), 7, true, true);
    screen.rerender(<DashboardSyncSummary />);
    expect(screen.getByText('5')).toBeTruthy();
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByText('4')).toBeTruthy();
    act(() => jest.advanceTimersByTime(4000));
    expect(screen.queryByTestId('dashboard-sync-summary')).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

it('cancels the closing timer when a higher-priority action becomes available', () => {
  jest.useFakeTimers();
  try {
    setSummary(true, 0, null, plansFor(GOAL_CATEGORIES), 7, true, true);
    const screen = render(<DashboardSyncSummary />);
    act(() => jest.advanceTimersByTime(3000));
    setSummary(true, 0, null, plansFor(GOAL_CATEGORIES), 7, true, false);
    screen.rerender(<DashboardSyncSummary />);
    expect(actionTitles(screen)).toEqual([healthTitle()]);
    expect(screen.queryByText('5')).toBeNull();
    act(() => jest.advanceTimersByTime(6000));
    expect(screen.getByTestId('dashboard-sync-summary')).toBeTruthy();
  } finally {
    jest.useRealTimers();
  }
});

it('keeps sync failures in the heading and never auto-dismisses them', () => {
  jest.useFakeTimers();
  try {
    setSummary(false, 0, null, plansFor(GOAL_CATEGORIES), 7, true, true);
    const screen = render(<DashboardSyncSummary />);
    const initialActions = actionTitles(screen);
    setSummary(true, 0, 'offline', plansFor(GOAL_CATEGORIES), 7, true, true);
    screen.rerender(<DashboardSyncSummary />);
    expect(screen.getByText('Synkningen kunde inte slutföras')).toBeTruthy();
    expect(screen.getByText('Vi visar framsteg från sparad data. Dra nedåt för att försöka synka igen.')).toBeTruthy();
    expect(actionTitles(screen)).toEqual(initialActions);
    expect(screen.queryByText('5')).toBeNull();
    act(() => jest.advanceTimersByTime(6000));
    expect(screen.getByTestId('dashboard-sync-summary')).toBeTruthy();
  } finally {
    jest.useRealTimers();
  }
});

it('closes the whole summary with the close button', () => {
  setSummary(false, 0);
  const screen = render(<DashboardSyncSummary />);
  fireEvent.press(screen.getByRole('button', { name: 'Stäng' }));
  expect(screen.queryByTestId('dashboard-sync-summary')).toBeNull();
  expect(mockPush).not.toHaveBeenCalled();
});

it('keeps progress visible without suggestion buttons or automatic dismissal even when only the manual fallback was eligible', () => {
  jest.useFakeTimers();
  try {
    setSummary(true, 0, null, plansFor(GOAL_CATEGORIES), 7, true, true);
    const screen = render(<DashboardSyncSummary />);
    expect(screen.getByText('5')).toBeTruthy();
    act(() => jest.advanceTimersByTime(3000));
    setSummary(true, 2, null, plansFor(GOAL_CATEGORIES), 7, true, true);
    screen.rerender(<DashboardSyncSummary />);
    expect(actionTitles(screen)).toEqual([]);
    expect(screen.queryByText('5')).toBeNull();
    act(() => jest.advanceTimersByTime(6000));
    expect(screen.getByText('Nya framsteg!')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Stäng' }));
    expect(screen.queryByTestId('dashboard-sync-summary')).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});

it('prioritizes actual progress over the onboarding welcome and keeps a normal status noninteractive', () => {
  mockNutritionEntries = [];
  setSummary(true, 1, null, EMPTY_PLANS, 5);
  const screen = render(<DashboardSyncSummary />);
  expect(screen.getByRole('button', { name: /Nya framsteg!/ })).toBeTruthy();
  expect(actionTitles(screen)).toEqual([]);
  screen.unmount();
  setSummary(false, 0);
  const loading = render(<DashboardSyncSummary />);
  expect(loading.queryByRole('button', { name: /Synkar dina framsteg/ })).toBeNull();
});
