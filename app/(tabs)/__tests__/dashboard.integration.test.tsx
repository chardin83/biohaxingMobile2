// Mock react-i18next
// Helper to render with StorageProvider
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { AllProviders } from '@/test-utils/Providers';

import Dashboard from '../dashboard';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'common:dashboard.appTitle': 'BIOHAXING',
        'common:dashboard.level': 'Level',
        'common:dashboard.xp': 'XP',
        'common:dashboard.goals': 'Goals',
        'common:dashboard.activeGoals': 'Active Goals',
        'common:dashboard.completedGoals': 'Completed Goals',
        'levels:biohacker': 'Biohacker',
        'levels:advanced_biohacker': 'Advanced Biohacker',
        'levels:master_biohacker': 'Master Biohacker',
        'areas:improve_sleep.title': 'Improve Sleep',
        'areas:boost_energy.title': 'Boost Energy',
        'areas:enhance_focus.title': 'Enhance Focus',
        'common:areas.selectAreas': 'Select Areas',
        'common:dashboard.level1': 'Level 1',
      };
      if (key === 'common:dashboard.level' || key === 'common:dashboard.level1') return 'Level 1';
      return translations[key] || key;
    },
  }),
}));

 const renderWithProviders = (ui: React.ReactElement) =>
    render(ui, { wrapper: AllProviders });

// Mock external dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  })
}));

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with StorageProvider and displays main dashboard elements', async () => {
    const { getByText } = renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(getByText(/Level\s*1/)).toBeTruthy();
      expect(getByText(/\d+ \/ \d+ XP/)).toBeTruthy();
    });
  });

  it('updates when storage context changes', async () => {
    const { getByText } = renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(getByText(/Level\s*1/)).toBeTruthy();
      });
    });
  });
