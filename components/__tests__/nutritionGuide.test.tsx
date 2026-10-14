import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import NutritionPage from '@/app/(stack)/settings/nutrition';
import NutritionDistributionStep from '@/components/NutritionDistributionStep';
import NutritionEnergySummary from '@/components/NutritionEnergySummary';
import { calculateEnergyNeeds } from '@/utils/energyNeeds';
import { goalsForDistribution } from '@/utils/nutritionGoals';

const mockUpdateProfile = jest.fn();
const mockDismissTo = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockProfile = {};

jest.mock('@/app/context/StorageContext', () => ({
  useStorage: () => ({ userProfile: mockProfile, updateUserProfile: mockUpdateProfile }),
}));
jest.mock('expo-router', () => ({ router: { dismissTo: (...args: unknown[]) => mockDismissTo(...args), push: (...args: unknown[]) => mockPush(...args), replace: (...args: unknown[]) => mockReplace(...args) } }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'sv' } }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }), useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]) }));
jest.mock('@/components/NutritionPersonalDetails', () => () => {
  const { Text } = require('react-native');
  return <Text>guide</Text>;
});
jest.mock('@/components/PersonalDetailsSettings', () => ({ errors }: { errors?: Record<string, string | undefined> }) => {
  const { View, Text } = require('react-native');
  return <View>{Object.entries(errors ?? {}).map(([key, error]) => error ? <Text key={key}>{`${key}: ${error}`}</Text> : null)}</View>;
});
jest.mock('@/components/NutritionSettings', () => () => {
  const { Text } = require('react-native');
  return <Text>goals</Text>;
});
jest.mock('@/components/ui/Container', () => ({ children, footer, onBackPress }: { children: React.ReactNode; footer: React.ReactNode; onBackPress?: () => void }) => {
  const { View, Pressable, Text } = require('react-native');
  return (
    <View>
      {onBackPress && <Pressable onPress={onBackPress}><Text>back</Text></Pressable>}
      {children}
      {footer}
    </View>
  );
});
jest.mock('@/components/ui/AppButton', () => ({ title, onPress, disabled }: { title: string; onPress: () => void; disabled: boolean }) => {
  const { Pressable, Text } = require('react-native');
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Text>{title}</Text>
    </Pressable>
  );
});
jest.mock('@/components/ui/Notice', () => () => null);
jest.mock('@/components/HenryInfoNotice', () => () => null);
jest.mock('@/components/ui/IconSymbol', () => ({ IconSymbol: () => null }));

describe('nutrition guide completion', () => {
  beforeEach(() => {
    mockProfile = { birthDate: '1990-01-01', weightKg: 70, heightCm: 170, biologicalSex: 'female', activityPal: 1.6 };
    jest.clearAllMocks();
    mockUpdateProfile.mockReset().mockResolvedValue({});
  });

  it('shows the guide on the first visit and goals after completion', () => {
    const { getByText, rerender } = render(<NutritionPage />);
    expect(getByText('guide')).toBeTruthy();
    mockProfile = { nutritionGuideCompleted: true };
    rerender(<NutritionPage />);
    expect(getByText('goals')).toBeTruthy();
    mockProfile = { nutritionGuideSkipped: true };
    rerender(<NutritionPage />);
    expect(getByText('goals')).toBeTruthy();
  });

  it('saves completion before leaving the fourth step', async () => {
    mockUpdateProfile.mockResolvedValueOnce({ nutritionGuideCompleted: true });
    const { getByText } = render(<NutritionDistributionStep />);
    fireEvent.press(getByText('onboarding.finish'));
    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledWith('/settings/nutrition'));
    expect(mockUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ nutritionGuideCompleted: true, nutritionDistribution: 'balanced', nutritionGoals: expect.any(Object) })
    );
  });

  it('recalculates and saves balanced macros after the age changes while the guide is mounted', async () => {
    const profile = { weightKg: 70, heightCm: 170, biologicalSex: 'female' as const, activityPal: 1.6, nutritionDistribution: 'balanced' as const, nutritionGoals: { protein: 75, carbohydrates: 275, fat: 67 } };
    mockProfile = { ...profile, birthDate: '1990-01-01' };
    const screen = render(<NutritionDistributionStep />);
    const seniorProfile = { ...profile, birthDate: '1950-01-01' };
    mockProfile = seniorProfile;
    screen.rerender(<NutritionDistributionStep />);
    const expected = goalsForDistribution('balanced', calculateEnergyNeeds(seniorProfile)!.total, seniorProfile.weightKg, seniorProfile.birthDate);
    expect(screen.getByText(String(expected.protein))).toBeTruthy();
    fireEvent.press(screen.getByText('onboarding.finish'));
    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledWith({ nutritionGoals: expected, nutritionDistribution: 'balanced', nutritionEnergySource: 'henry', nutritionGuideCompleted: true }));
  });

  it('stays in the guide and shows an error if saving fails', async () => {
    mockUpdateProfile.mockRejectedValueOnce(new Error('save failed'));
    const { getByText } = render(<NutritionDistributionStep />);
    fireEvent.press(getByText('onboarding.finish'));
    await waitFor(() => expect(getByText('nutritionGoals.summary.saveError')).toBeTruthy());
    expect(mockDismissTo).not.toHaveBeenCalled();
  });
  it('continues from the summary to distribution without completing the guide', () => {
    const { getByText } = render(<NutritionEnergySummary />);
    fireEvent.press(getByText('onboarding.continue'));
    expect(mockPush).toHaveBeenCalledWith('/settings/nutrition-distribution');
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('cannot finish the guide without the required personal details', () => {
    mockProfile = {};
    const { getByText } = render(<NutritionDistributionStep />);
    fireEvent.press(getByText('onboarding.finish'));
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('marks all four missing fields required and allows continuing once they are filled', () => {
    const PersonalStep = jest.requireActual('@/components/NutritionPersonalDetails').default;
    mockProfile = {};
    const screen = render(<PersonalStep />);
    expect(screen.queryByText('age: labeledInput.requiredError')).toBeNull();
    fireEvent.press(screen.getByText('onboarding.continue'));
    for (const field of ['age', 'weight', 'height', 'sex']) expect(screen.getByText(`${field}: labeledInput.requiredError`)).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    mockProfile = { birthDate: '1990-01-01', weightKg: 70, heightCm: 170, biologicalSex: 'female' };
    screen.rerender(<PersonalStep />);
    expect(screen.queryByText('weight: labeledInput.requiredError')).toBeNull();
    fireEvent.press(screen.getByText('onboarding.continue'));
    expect(mockPush).toHaveBeenCalledWith('/settings/nutrition-activity');
  });

  it('opens manual goals without requiring personal details or saving default goals', () => {
    const PersonalStep = jest.requireActual('@/components/NutritionPersonalDetails').default;
    mockProfile = {};
    const screen = render(<PersonalStep />);
    fireEvent.press(screen.getByText('nutritionGoals.manualTitle'));
    expect(mockPush).toHaveBeenCalledWith('/settings/nutrition-manual');
    expect(mockUpdateProfile).not.toHaveBeenCalled();
    expect(screen.queryByText('age: labeledInput.requiredError')).toBeNull();
  });

  it('allows continuing from personal details when intersex is selected', () => {
    const PersonalStep = jest.requireActual('@/components/NutritionPersonalDetails').default;
    mockProfile = { birthDate: '1990-01-01', weightKg: 70, heightCm: 170, biologicalSex: 'intersex' };
    const screen = render(<PersonalStep />);
    fireEvent.press(screen.getByText('onboarding.continue'));
    expect(mockPush).toHaveBeenCalledWith('/settings/nutrition-activity');
    expect(screen.queryByText('sex: labeledInput.requiredError')).toBeNull();
  });

  it('allows continuing from the summary to manual targets for intersex', () => {
    mockProfile = { birthDate: '1990-01-01', weightKg: 70, heightCm: 170, biologicalSex: 'intersex', activityPal: 1.6 };
    const screen = render(<NutritionEnergySummary />);
    expect(screen.queryByText('onboarding.continue')).toBeNull();
    fireEvent.press(screen.getByText('nutritionGoals.endGuide'));
    expect(mockPush).toHaveBeenCalledWith('/settings/nutrition-manual');
  });

  it('saves manual calories and macros without personal details and skips the guide after saving', async () => {
    const ManualSettings = jest.requireActual('@/components/NutritionSettings').default;
    mockProfile = {};
    mockUpdateProfile.mockResolvedValueOnce({});
    const screen = render(<ManualSettings manual />);
    fireEvent.changeText(screen.getByLabelText('nutritionGoals.totalEnergy'), '2400');
    fireEvent.press(screen.getByText('general.save'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/settings/nutrition'));
    const saved = mockUpdateProfile.mock.calls.find(([updates]) => updates.nutritionGoals)?.[0];
    expect(saved.nutritionGuideCompleted).toBe(true);
    expect(saved.nutritionDistribution).toBe('balanced');
    const { protein, carbohydrates, fat } = saved.nutritionGoals;
    expect(Math.abs(protein * 4 + carbohydrates * 4 + fat * 9 - 2400)).toBeLessThanOrEqual(10);
  });

  it('shows dashes and empty inputs when no macro goals are saved', () => {
    const ManualSettings = jest.requireActual('@/components/NutritionSettings').default;
    mockProfile = {};
    const screen = render(<ManualSettings manual />);
    expect(screen.getAllByText('–').length).toBeGreaterThanOrEqual(4);
    expect(screen.queryByText('2003 kcal')).toBeNull();
    expect(screen.getByText('nutritionGoals.distributions.balanced')).toBeTruthy();
    expect(screen.getAllByText('nutritionGoals.energyShare')).toHaveLength(3);
    expect(screen.getByLabelText('nutritionGoals.totalEnergy').props.value).toBe('');
    for (const key of ['protein', 'carbohydrates', 'fat']) expect(screen.queryByLabelText(`nutritionGoals.${key}`)).toBeNull();
    fireEvent.press(screen.getByText('general.save'));
    expect(mockUpdateProfile).toHaveBeenCalledWith({ nutritionGuideSkipped: true });
    expect(mockUpdateProfile.mock.calls.some(([updates]) => updates.nutritionGoals)).toBe(false);
  });

  it('returns from manual goals to the person card instead of the guide', () => {
    const ManualSettings = jest.requireActual('@/components/NutritionSettings').default;
    mockProfile = {};
    const screen = render(<ManualSettings manual />);
    fireEvent.press(screen.getByText('back'));
    expect(mockDismissTo).toHaveBeenCalledWith('/settings/person');
    expect(mockUpdateProfile).toHaveBeenCalledWith({ nutritionGuideSkipped: true });
    expect(mockUpdateProfile.mock.calls.some(([updates]) => updates.nutritionGoals)).toBe(false);
  });

  it('expands the energy card and saves a new energy target while retaining balanced distribution', async () => {
    const Settings = jest.requireActual('@/components/NutritionSettings').default;
    mockProfile = { nutritionGuideCompleted: true, nutritionDistribution: 'balanced', nutritionEnergySource: 'henry', nutritionGoals: { protein: 75, carbohydrates: 275, fat: 67 } };
    const screen = render(<Settings />);
    expect(screen.getByText('nutritionGoals.energySource.henry')).toBeTruthy();
    expect(screen.queryByLabelText('nutritionGoals.totalEnergy')).toBeNull();
    fireEvent.press(screen.getByText('nutritionGoals.totalEnergy'));
    fireEvent.changeText(screen.getByLabelText('nutritionGoals.totalEnergy'), '2600');
    expect(screen.getByText('nutritionGoals.energySource.custom')).toBeTruthy();
    fireEvent.press(screen.getByText('general.save'));
    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ nutritionDistribution: 'balanced', nutritionGoals: expect.any(Object) })));
    expect(mockUpdateProfile.mock.calls[0][0].nutritionGoals.protein).toBeGreaterThan(75);
    expect(mockUpdateProfile.mock.calls[0][0].nutritionEnergySource).toBe('custom');
  });

  it('uses the save action for distribution changes instead of saving immediately', async () => {
    const Settings = jest.requireActual('@/components/NutritionSettings').default;
    mockProfile = { nutritionGuideCompleted: true, nutritionDistribution: 'balanced', nutritionGoals: { protein: 75, carbohydrates: 275, fat: 67 } };
    const screen = render(<Settings />);
    fireEvent.press(screen.getByText('nutritionGoals.distribution'));
    fireEvent.press(screen.getByText('nutritionGoals.distributions.lowCarb'));
    for (const key of ['protein', 'carbohydrates', 'fat']) expect(screen.queryByLabelText(`nutritionGoals.${key}`)).toBeNull();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('general.save'));
    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ nutritionDistribution: 'lowCarb' })));
  });

  it('allows editing macros only after selecting custom distribution', () => {
    const Settings = jest.requireActual('@/components/NutritionSettings').default;
    mockProfile = { nutritionGuideSkipped: true };
    const screen = render(<Settings manual />);
    expect(screen.queryByLabelText('nutritionGoals.protein')).toBeNull();
    fireEvent.press(screen.getByText('nutritionGoals.distribution'));
    fireEvent.press(screen.getByText('nutritionGoals.distributions.custom'));
    for (const key of ['protein', 'carbohydrates', 'fat']) expect(screen.getByLabelText(`nutritionGoals.${key}`)).toBeTruthy();
  });

  it('keeps unsaved edits when continuing and discards them only when explicitly requested', () => {
    const ManualSettings = jest.requireActual('@/components/NutritionSettings').default;
    mockProfile = { nutritionGuideSkipped: true };
    const screen = render(<ManualSettings manual />);
    fireEvent.changeText(screen.getByLabelText('nutritionGoals.totalEnergy'), '2400');
    fireEvent.press(screen.getByText('back'));
    expect(screen.getByText('nutritionGoals.unsaved.title')).toBeTruthy();
    expect(mockDismissTo).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('nutritionGoals.unsaved.continueEditing'));
    expect(screen.queryByText('nutritionGoals.unsaved.title')).toBeNull();
    expect(screen.getByLabelText('nutritionGoals.totalEnergy').props.value).not.toBe('');
    fireEvent.press(screen.getByText('back'));
    fireEvent.press(screen.getByText('nutritionGoals.unsaved.discard'));
    expect(mockDismissTo).toHaveBeenCalledWith('/settings/person');
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('saves before returning from the unsaved changes modal', async () => {
    const ManualSettings = jest.requireActual('@/components/NutritionSettings').default;
    mockProfile = { nutritionGuideSkipped: true };
    const screen = render(<ManualSettings manual />);
    fireEvent.changeText(screen.getByLabelText('nutritionGoals.totalEnergy'), '2400');
    fireEvent.press(screen.getByText('back'));
    fireEvent.press(screen.getByText('nutritionGoals.unsaved.saveAndBack'));
    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledWith('/settings/person'));
    expect(mockUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ nutritionGoals: expect.any(Object) }));
  });

  it('keeps the modal and edits open if saving fails', async () => {
    const ManualSettings = jest.requireActual('@/components/NutritionSettings').default;
    mockProfile = { nutritionGuideSkipped: true };
    mockUpdateProfile.mockRejectedValueOnce(new Error('save failed'));
    const screen = render(<ManualSettings manual />);
    fireEvent.changeText(screen.getByLabelText('nutritionGoals.totalEnergy'), '2400');
    fireEvent.press(screen.getByText('back'));
    fireEvent.press(screen.getByText('nutritionGoals.unsaved.saveAndBack'));
    await waitFor(() => expect(screen.getAllByText('nutritionGoals.saveError').length).toBeGreaterThan(0));
    expect(screen.getByText('nutritionGoals.unsaved.title')).toBeTruthy();
    expect(mockDismissTo).not.toHaveBeenCalled();
  });
});
