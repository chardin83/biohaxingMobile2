import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { MetricTrendChart, type MetricTrendOption } from '../metrics/MetricTrendChart';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/AppButton', () => () => null);
jest.mock('react-native-paper', () => {
  const mockReact = require('react');
  const { View, Pressable, Text } = require('react-native');
  const Menu = ({ visible, anchor, children }: any) => mockReact.createElement(View, null, anchor, visible && children);
  Menu.Item = ({ title, onPress, trailingIcon: _trailingIcon, ...props }: any) =>
    mockReact.createElement(Pressable, { onPress, ...props }, mockReact.createElement(Text, null, title));
  return { Menu };
});

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const options: MetricTrendOption[] = [
  {
    value: 'rmssd',
    label: 'RMSSD',
    metricName: 'HRV RMSSD',
    data: [
      { date: yesterday, value: 40 },
      { date: today, value: 45 },
    ],
  },
  {
    value: 'sdnn',
    label: 'SDNN',
    metricName: 'HRV SDNN',
    data: [
      { date: yesterday, value: 70 },
      { date: today, value: 80 },
    ],
  },
  { value: 'other', label: 'Other measurement', metricName: 'Another metric', data: [] },
];

function SelectableChart() {
  const [value, onChange] = React.useState('rmssd');
  return <MetricTrendChart data={[]} metricName="HRV" unit="ms" seriesSelector={{ options, value, onChange }} />;
}

describe('MetricTrendChart series selector', () => {
  it('switches the displayed values from RMSSD to SDNN', () => {
    const { getByLabelText, getByText, queryByText, getAllByText } = render(<SelectableChart />);
    expect(getAllByText('45 ms').length).toBeGreaterThan(0);
    fireEvent.press(getByLabelText('trendChart.selectSeries'));
    fireEvent.press(getByText('SDNN'));
    expect(getAllByText('80 ms').length).toBeGreaterThan(0);
    expect(queryByText('45 ms')).toBeNull();
    expect(getByLabelText('trendChart.selectSeries').props.accessibilityValue.text).toBe('SDNN');
  });

  it('supports other metric options and keeps the dropdown available for an empty series', () => {
    const { getByLabelText, getByText } = render(<SelectableChart />);
    fireEvent.press(getByLabelText('trendChart.selectSeries'));
    fireEvent.press(getByText('Other measurement'));
    expect(getByText('metrics:trendChart.emptyTitle')).toBeTruthy();
    fireEvent.press(getByLabelText('trendChart.selectSeries'));
    fireEvent.press(getByText('SDNN'));
    expect(getByLabelText('trendChart.selectSeries').props.accessibilityValue.text).toBe('SDNN');
  });

  it('omits the dropdown when no options are supplied', () => {
    const { queryByLabelText } = render(<MetricTrendChart data={[]} metricName="Sleep" />);
    expect(queryByLabelText('trendChart.selectSeries')).toBeNull();
  });
});
