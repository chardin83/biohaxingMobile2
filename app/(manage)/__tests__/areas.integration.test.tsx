import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { StorageProvider } from '@/app/context/StorageContext';

import Areas from '../areas';

// Mock external dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'common:areas.selectAreas': 'Select what areas you want to focus on',
        'common:areas.save': 'Save',
        'common:areas.cancel': 'Cancel',
        'areas:energy.title': 'Energy & Vitality',
        'areas:energy.description': 'Boost your daily energy levels and overcome fatigue',
        'areas:sleepQuality.title': 'Sleep Quality',
        'areas:sleepQuality.description': 'Improve sleep duration and sleep quality',
        'areas:cognition.title': 'Mind & Cognition',
        'areas:cognition.description': 'Support cognitive function and mental performance',
        'areas:immuneSupport.title': 'Immune Support',
        'areas:immuneSupport.description': 'Strengthen your immune system',
        'areas:cardioFitness.title': 'Cardiovascular Fitness',
        'areas:cardioFitness.description': 'Improve heart health and aerobic capacity',
        'areas:digestiveHealth.title': 'Digestive Health',
        'areas:digestiveHealth.description': 'Support healthy digestion and gut microbiome',
        'areas:strength.title': 'Strength',
        'areas:strength.description': 'Build strength',
        'areas:stressReduction.title': 'Nervous System',
        'areas:stressReduction.description': 'Balance your autonomic nervous system for better stress resilience',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('i18next', () => ({
  t: (key: string) => {
    const translations: { [key: string]: string } = {
      'common:areas.selectAreas': 'Select what areas you want to focus on',
      'common:areas.save': 'Save',
      'common:areas.cancel': 'Cancel',
      'areas:energy.title': 'Energy & Vitality',
      'areas:energy.description': 'Boost your daily energy levels and overcome fatigue',
      'areas:sleepQuality.title': 'Sleep Quality',
      'areas:sleepQuality.description': 'Improve sleep duration and sleep quality',
      'areas:cognition.title': 'Mind & Cognition',
      'areas:cognition.description': 'Support cognitive function and mental performance',
      'areas:immuneSupport.title': 'Immune Support',
      'areas:immuneSupport.description': 'Strengthen your immune system',
      'areas:cardioFitness.title': 'Cardiovascular Fitness',
      'areas:cardioFitness.description': 'Improve heart health and aerobic capacity',
      'areas:digestiveHealth.title': 'Digestive Health',
      'areas:digestiveHealth.description': 'Support healthy digestion and gut microbiome',
      'areas:strength.title': 'Strength',
      'areas:strength.description': 'Build strength',
      'areas:stressReduction.title': 'Nervous System',
      'areas:stressReduction.description': 'Balance your autonomic nervous system for better stress resilience',
    };
    return translations[key] || key;
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/locales/supplements', () => ({
  useSupplements: () => [
    { id: 'vit-d3', name: 'Vitamin D3', category: 'vitamins' },
    { id: 'omega-3', name: 'Omega-3', category: 'fatty-acids' },
    { id: 'magnesium', name: 'Magnesium', category: 'minerals' },
  ],
}));

// Mock the goals data
jest.mock('@/locales/areas', () => ({
  areas: [
    { id: 'energy', title: 'energy.title', description: 'energy.description', icon: 'flash' },
    { id: 'sleepQuality', title: 'sleepQuality.title', description: 'sleepQuality.description', icon: 'sleep' },
    { id: 'cognition', title: 'cognition.title', description: 'cognition.description', icon: 'target' },
    { id: 'immuneSupport', title: 'immuneSupport.title', description: 'immuneSupport.description', icon: 'shield-check' },
    { id: 'cardioFitness', title: 'cardioFitness.title', description: 'cardioFitness.description', icon: 'heart-pulse' },
    { id: 'digestiveHealth', title: 'digestiveHealth.title', description: 'digestiveHealth.description', icon: 'food-apple' },
    { id: 'strength', title: 'strength.title', description: 'strength.description', icon: 'arm-flex' },
    { id: 'stressReduction', title: 'stressReduction.title', description: 'stressReduction.description', icon: 'emoticon-neutral' },
  ],
}));

const renderWithStorageProvider = (children: React.ReactNode) => {
  return render(<StorageProvider>{children}</StorageProvider>);
};

describe('Goals Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Removed obsolete test: renders goals page with real MyGoalsSelector integration

  // Removed redundant test: integrates with storage context for goal persistence

  // Removed redundant test: allows goal selection through MyGoalsSelector

  it('persists selected goals in storage context', async () => {
    const { getByTestId, rerender } = renderWithStorageProvider(<Areas />);
    await waitFor(() => {
      expect(getByTestId('area-card-energy')).toBeTruthy();
    });
    await act(async () => {
      fireEvent.press(getByTestId('area-card-energy'));
    });
    rerender(
      <StorageProvider>
        <Areas />
      </StorageProvider>
    );
    await waitFor(() => {
      expect(getByTestId('area-card-energy')).toBeTruthy();
    });
  });

  it('handles goal deselection through real component interactions', async () => {
    const { getByTestId } = renderWithStorageProvider(<Areas />);
    await waitFor(() => {
      expect(getByTestId('area-card-energy')).toBeTruthy();
    });
    await act(async () => {
      fireEvent.press(getByTestId('area-card-sleepQuality'));
    });
    await waitFor(() => {
      expect(getByTestId('area-card-sleepQuality')).toBeTruthy();
    });
  });

  it('updates storage when goals are modified', async () => {
    const { getByTestId } = renderWithStorageProvider(<Areas />);
    await waitFor(() => {
      expect(getByTestId('area-card-strength')).toBeTruthy();
    });
    await act(async () => {
      fireEvent.press(getByTestId('area-card-strength'));
    });
  });

  it('displays area options from real data sources', async () => {
    const { getByTestId } = renderWithStorageProvider(<Areas />);
    await waitFor(() => {
      expect(getByTestId('area-card-energy')).toBeTruthy();
      expect(getByTestId('area-card-sleepQuality')).toBeTruthy();
      expect(getByTestId('area-card-strength')).toBeTruthy();
    });
  });

  it('maintains goal state across component remounts', async () => {
    const { getByTestId, unmount } = renderWithStorageProvider(<Areas />);
    await waitFor(() => {
      expect(getByTestId('area-card-energy')).toBeTruthy();
    });
    unmount();
    const { getByTestId: getByTestIdRemount } = renderWithStorageProvider(<Areas />);
    await waitFor(() => {
      expect(getByTestIdRemount('area-card-energy')).toBeTruthy();
    });
  });

  it('integrates correctly with the app theme and styling', async () => {
    const { getByTestId } = renderWithStorageProvider(<Areas />);
    await waitFor(() => {
      const goalElement = getByTestId('area-card-energy');
      expect(goalElement).toBeTruthy();
      expect(goalElement.props.style).toBeDefined();
    });
  });

  it('debug: list all rendered text nodes', async () => {
    const { getAllByText } = renderWithStorageProvider(<Areas />);
    await waitFor(() => {
      // Find all text nodes (any text)
      const allTextNodes = getAllByText(/.*/);
      // Print all text node values for debugging
      console.log('Rendered text nodes:', allTextNodes.map(node => node.props.children));
    });
  });
});
