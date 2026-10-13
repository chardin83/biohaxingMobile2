import { render } from '@testing-library/react-native';
import React from 'react';

import type { Supplement } from '@/app/domain/Supplement';
import { getSupplementWarningKeys } from '@/locales/supplementWarnings';

import { SupplementWarnings } from '../SupplementWarnings';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ui/Notice', () => ({
  __esModule: true,
  default: ({ title, message, variant }: any) => {
    const mockReact = require('react');
    return mockReact.createElement(require('react-native').Text, null, `${variant}: ${title}: ${message}`);
  },
}));

const supplement = (id: string, components?: Supplement[]): Supplement => ({ id, name: id, quantity: '15', unit: 'mg', components });

it.each(['zinc', 'zincPicolinate', 'zincBisglycinate', 'zincCitrate'])('shows the warning for %s', id => {
  const { getByText } = render(<SupplementWarnings supplement={supplement(id)} />);
  expect(getByText('warning: warnings.zinc.title: warnings.zinc.message')).toBeTruthy();
});

it('hides warnings for no selection and unrelated supplements', () => {
  expect(getSupplementWarningKeys(null)).toEqual([]);
  const { queryByText, rerender } = render(<SupplementWarnings supplement={null} />);
  expect(queryByText(/warnings.zinc/)).toBeNull();
  rerender(<SupplementWarnings supplement={supplement('vitaminD')} />);
  expect(queryByText(/warnings.zinc/)).toBeNull();
});

it('finds zinc inside combined supplements without duplicate warnings', () => {
  const combined = supplement('custom', [supplement('zinc'), supplement('nested', [supplement('zincCitrate')])]);
  expect(getSupplementWarningKeys(combined)).toEqual(['zinc']);
});
