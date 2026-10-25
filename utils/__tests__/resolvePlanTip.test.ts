import { resolvePlanTip } from '../resolvePlanTip';

const catalog = [
  { id: 'sleep_timing', title: 'sleep_timing.title' },
  { id: 'daily_walk', title: 'daily_walk.title' },
];
const title = (tip: (typeof catalog)[number]) => (tip.id === 'sleep_timing' ? 'Regelbunden sömn' : 'Daglig promenad');

it('resolves catalog IDs rather than AI row numbers', () => {
  expect(resolvePlanTip({ id: 1, tipId: 'sleep_timing' }, catalog, title)?.id).toBe('sleep_timing');
  expect(resolvePlanTip({ tipId: '1', id: 'daily_walk' }, catalog, title)?.id).toBe('daily_walk');
});
it('recovers an AI row number using its translated title', () => {
  expect(resolvePlanTip({ id: 1, title: 'Daglig promenad' }, catalog, title)?.id).toBe('daily_walk');
  expect(resolvePlanTip({ tipId: '1', title: 'sleep_timing.title' }, catalog, title)?.id).toBe('sleep_timing');
});
it('does not invent a tip for an unknown numeric ID', () => {
  expect(resolvePlanTip({ id: 1 }, catalog, title)).toBeUndefined();
  expect(resolvePlanTip('2', catalog, title)).toBeUndefined();
});
it('resolves existing canonical IDs and legacy title references', () => {
  expect(resolvePlanTip('sleep_timing', catalog, title)?.id).toBe('sleep_timing');
  expect(resolvePlanTip('daily_walk.title', catalog, title)?.id).toBe('daily_walk');
});
