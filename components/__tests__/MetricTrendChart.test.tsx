import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { MetricTrendChart, type MetricTrendOption } from '../metrics/MetricTrendChart';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/AppButton', () => () => null);
jest.mock('@/app/context/StorageContext', () => ({
  useStorage: () => ({ lifeStyleLog: {
    [new Date().toISOString().slice(0, 10)]: {
      dimmedLights: { value: true }, calmActivity: { value: false }, reducedScreens: { value: true },
    },
    [new Date(Date.now() - 86400000).toISOString().slice(0, 10)]: { dimmedLights: { value: false } },
    '2000-01-01': { dimmedLights: { value: true } },
  } }),
}));
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
  it('shows a loading shell before rendering the chart', async () => {
    const { getByText, queryByText, UNSAFE_getByType, UNSAFE_queryByType } = render(<MetricTrendChart data={[]} metricName="HRV" />);
    const { ActivityIndicator } = require('react-native');
    expect(getByText('trendChart.title')).toBeTruthy();
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(queryByText('metrics:trendChart.emptyTitle')).toBeNull();
    await waitFor(() => expect(getByText('metrics:trendChart.emptyTitle')).toBeTruthy());
    expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
  });

  it('switches the displayed values from RMSSD to SDNN', async () => {
    const { getByLabelText, getByText, queryByText, getAllByText } = render(<SelectableChart />);
    await waitFor(() => expect(getAllByText('45 ms').length).toBeGreaterThan(0));
    await waitFor(() => expect(getByLabelText('trendChart.selectSeries')).toBeTruthy());
    fireEvent.press(getByLabelText('trendChart.selectSeries'));
    fireEvent.press(getByText('SDNN'));
    expect(getAllByText('80 ms').length).toBeGreaterThan(0);
    expect(queryByText('45 ms')).toBeNull();
    expect(getByLabelText('trendChart.selectSeries').props.accessibilityValue.text).toBe('SDNN');
  });

  it('supports other metric options and keeps the dropdown available for an empty series', async () => {
    const { getByLabelText, getByText } = render(<SelectableChart />);
    await waitFor(() => expect(getByLabelText('trendChart.selectSeries')).toBeTruthy());
    fireEvent.press(getByLabelText('trendChart.selectSeries'));
    fireEvent.press(getByText('Other measurement'));
    expect(getByText('metrics:trendChart.emptyTitle')).toBeTruthy();
    fireEvent.press(getByLabelText('trendChart.selectSeries'));
    fireEvent.press(getByText('SDNN'));
    expect(getByLabelText('trendChart.selectSeries').props.accessibilityValue.text).toBe('SDNN');
  });

  it('omits the dropdown when no options are supplied', async () => {
    const { queryByLabelText, getByText } = render(<MetricTrendChart data={[]} metricName="Sleep" />);
    await waitFor(() => expect(getByText('metrics:trendChart.emptyTitle')).toBeTruthy());
    expect(queryByLabelText('trendChart.selectSeries')).toBeNull();
  });
});

it('draws comparison data on the shared time axis with a separate right scale', async () => {
  const screen = render(<MetricTrendChart data={options[0].data} metricName="Recovery" unit="/100" comparison={{
    data: [{ date: yesterday, value: 1000 }, { date: today, value: 2000 }], metricName: 'Steps', unit: 'count', color: 'orange',
  }} />);
  const { View } = require('react-native');
  await waitFor(() => expect(screen.UNSAFE_getAllByType(View).some(node => node.props.onLayout)).toBe(true));
  const frame = screen.UNSAFE_getAllByType(View).find(node => node.props.onLayout)!;
  fireEvent(frame, 'layout', { nativeEvent: { layout: { width: 260, height: 180, x: 0, y: 0 } } });
  expect(screen.getByTestId('comparison-line').props.d).toMatch(/^M .* L /);
  const rightAxis = screen.getByTestId('comparison-y-axis');
  expect(rightAxis).toBeTruthy();
  expect(screen.getAllByText('2000').length).toBeGreaterThan(0);
  expect(screen.queryByText('2650')).toBeNull();
  expect(screen.getByText('Steps (count)')).toBeTruthy();
  expect(screen.getByTestId(`lifestyle-dot-${today}`).props.opacity).toBe(1);
  expect(screen.getByTestId(`lifestyle-dot-${yesterday}`).props.opacity).toBe(0.5);
  expect(screen.queryByTestId('lifestyle-dot-2000-01-01')).toBeNull();
});

it('shows both series for the touched day in one tooltip and updates while dragging', async () => {
  const { within } = require('@testing-library/react-native');
  const screen = render(<MetricTrendChart data={options[0].data} metricName="HRV" unit="ms" comparison={{
    data: [{ date: yesterday, value: 480 }], metricName: 'Sleep', color: 'blue', valueFormatter: value => `${value / 60}h`,
  }} />);
  const { View } = require('react-native');
  await waitFor(() => expect(screen.UNSAFE_getAllByType(View).some(node => node.props.onLayout)).toBe(true));
  fireEvent(screen.UNSAFE_getAllByType(View).find(node => node.props.onLayout)!, 'layout', { nativeEvent: { layout: { width: 256 } } });
  const touchArea = screen.getByTestId('metric-chart-touch-area');
  fireEvent(touchArea, 'responderGrant', { nativeEvent: { locationX: 208 } });
  const tooltip = within(screen.getByTestId('metric-chart-tooltip'));
  expect(tooltip.getByText('HRV: 40 ms')).toBeTruthy();
  expect(tooltip.getByText('Sleep: 8h')).toBeTruthy();
  const lifeStyleDetails = within(screen.getByTestId('metric-chart-lifestyle-details'));
  expect(lifeStyleDetails.getByText('common:lifeStyle.items.dimmedLights')).toBeTruthy();
  expect(lifeStyleDetails.getByText('common:filter.no')).toBeTruthy();
  expect(lifeStyleDetails.queryByText('common:lifeStyle.items.calmActivity')).toBeNull();
  fireEvent(touchArea, 'responderMove', { nativeEvent: { locationX: 248 } });
  expect(tooltip.getByText('HRV: 45 ms')).toBeTruthy();
  expect(tooltip.getByText('Sleep: —')).toBeTruthy();
  fireEvent(touchArea, 'responderMove', { nativeEvent: { locationX: -10 } });
  expect(tooltip.getByText('HRV: —')).toBeTruthy();
  expect(lifeStyleDetails.getByText('trendChart.noLifeStyleEntries')).toBeTruthy();
  fireEvent.press(screen.getByTestId(`lifestyle-dot-${today}`));
  expect(lifeStyleDetails.getByText('common:lifeStyle.items.calmActivity')).toBeTruthy();
});

it('allows inspecting a single registered value without a comparison', async () => {
  const screen = render(<MetricTrendChart data={[{ date: today, value: 0 }]} metricName="Score" />);
  const { View } = require('react-native');
  await waitFor(() => expect(screen.UNSAFE_getAllByType(View).some(node => node.props.onLayout)).toBe(true));
  fireEvent(screen.UNSAFE_getAllByType(View).find(node => node.props.onLayout)!, 'layout', { nativeEvent: { layout: { width: 256 } } });
  fireEvent(screen.getByTestId('metric-chart-touch-area'), 'responderGrant', { nativeEvent: { locationX: 248 } });
  expect(screen.getByText('Score: 0')).toBeTruthy();
});
