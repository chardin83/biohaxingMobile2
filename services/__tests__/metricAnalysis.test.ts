import { analyzeMetric, buildMetricAnalysisContext } from '../metricAnalysis';
import { askGPT } from '../gptServices';

jest.mock('../gptServices', () => ({ askGPT: jest.fn() }));
jest.mock('@/constants/Premium', () => ({ PREMIUM: false }));

const config = {
  metricName: 'HRV',
  unit: 'ms',
  accentColor: '#000',
  data: [
    { date: '2026-10-19', value: 10 },
    { date: '2026-10-20', value: 20 },
    { date: '2026-10-26', value: 30 },
    { date: '2026-10-27', value: 40 },
    { date: '2026-10-25', value: NaN },
  ],
};

afterEach(() => {
  jest.clearAllMocks();
  jest.requireMock('@/constants/Premium').PREMIUM = false;
});

it('includes only finite measurements in the displayed date range', () => {
  const context = buildMetricAnalysisContext(config, 7, new Date('2026-10-26T12:00:00Z'));
  expect(context.values).toEqual([
    { date: '2026-10-20', value: 20 },
    { date: '2026-10-26', value: 30 },
  ]);
  expect(context.period).toEqual({ from: '2026-10-20', to: '2026-10-26', days: 7 });
});

it('blocks requests without Premium', async () => {
  await expect(analyzeMetric('{}', 'sv')).rejects.toThrow('Premium required');
  expect(askGPT).not.toHaveBeenCalled();
});

it('sends only the supplied context and rejects non-text responses', async () => {
  jest.requireMock('@/constants/Premium').PREMIUM = true;
  jest.mocked(askGPT).mockResolvedValue({ type: 'text', content: 'Analysis' });
  await expect(analyzeMetric('{"metric":"HRV"}', 'sv')).resolves.toBe('Analysis');
  expect(jest.mocked(askGPT).mock.calls[0][0][1]).toEqual({ role: 'user', content: '{"metric":"HRV"}' });
  jest.mocked(askGPT).mockResolvedValue({ type: 'function_call' });
  await expect(analyzeMetric('{}', 'sv')).rejects.toThrow('Empty analysis');
});
