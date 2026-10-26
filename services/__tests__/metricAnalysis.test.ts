import { askGPT } from '../gptServices';
import { analyzeMetric, buildMetricAnalysisContext, parseMetricAnalysis } from '../metricAnalysis';

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
  const response = { analysis: 'Analysis', followUpQuestions: ['Why this trend?', 'How much variation?', 'What can I track next?'] };
  jest.mocked(askGPT).mockResolvedValue({ type: 'text', content: JSON.stringify(response) });
  await expect(analyzeMetric('{"metric":"HRV"}', 'sv')).resolves.toEqual(response);
  expect(jest.mocked(askGPT).mock.calls[0][0][1]).toEqual({ role: 'user', content: '{"metric":"HRV"}' });
  jest.mocked(askGPT).mockResolvedValue({ type: 'function_call' });
  await expect(analyzeMetric('{}', 'sv')).rejects.toThrow('Empty analysis');
});

it.each([
  { analysis: 'Answer', followUpQuestions: ['One?', 'Two?'] },
  { analysis: 'Answer', followUpQuestions: ['One?', 'One?', 'Three?'] },
  { analysis: 'Answer', followUpQuestions: ['One?', '', 'Three?'] },
  { analysis: '', followUpQuestions: ['One?', 'Two?', 'Three?'] },
])('rejects malformed follow-up questions: %j', response => {
  expect(() => parseMetricAnalysis(JSON.stringify(response))).toThrow();
});

it('preserves page context and conversation when answering a follow-up', async () => {
  jest.requireMock('@/constants/Premium').PREMIUM = true;
  const response = { analysis: 'Answer', followUpQuestions: ['One?', 'Two?', 'Three?'] };
  jest.mocked(askGPT).mockResolvedValue({ type: 'text', content: JSON.stringify(response) });
  const history = [
    { role: 'assistant' as const, content: JSON.stringify(response) },
    { role: 'user' as const, content: 'Why this trend?' },
  ];
  await analyzeMetric('visible page data', 'sv', history);
  expect(jest.mocked(askGPT).mock.calls[0][0].slice(1)).toEqual([{ role: 'user', content: 'visible page data' }, ...history]);
});
