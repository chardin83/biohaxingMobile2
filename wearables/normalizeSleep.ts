import type { SampleProvenance } from '@/app/context/storage/metrics/metricTypes';

import { metricSourceKey, metricSourceRank } from './metricSourcePriority';
import { aggregateProvenance } from './sampleProvenance';
import type { SleepSummary, SourceId } from './types';

export type SleepState = 'asleep' | 'deep' | 'rem' | 'light' | 'awake' | 'inBed' | 'unknown';
export type SleepInterval = SampleProvenance & { startTime: string; endTime: string; state: SleepState };
type TimedInterval = SleepInterval & { start: number; end: number };
const MINUTE = 60000;
const SESSION_GAP = 90 * MINUTE;

const sourceKey = metricSourceKey;
const localDay = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

function validIntervals(intervals: readonly SleepInterval[]): TimedInterval[] {
  return intervals
    .map(item => ({ ...item, start: Date.parse(item.startTime), end: Date.parse(item.endTime) }))
    .filter(item => Number.isFinite(item.start) && Number.isFinite(item.end) && item.end > item.start && item.state !== 'inBed' && item.state !== 'unknown')
    .sort((a, b) => a.start - b.start || a.end - b.end || sourceKey(a).localeCompare(sourceKey(b)));
}

export function getSleepEpisodes(intervals: readonly SleepInterval[]): TimedInterval[][] {
  const episodes: TimedInterval[][] = [];
  let end = -Infinity;
  for (const item of validIntervals(intervals)) {
    if (!episodes.length || item.start > end + SESSION_GAP) {
      episodes.push([]);
      end = item.end;
    }
    episodes[episodes.length - 1].push(item);
    end = Math.max(end, item.end);
  }
  return episodes;
}

function resolveTimeline(items: TimedInterval[]) {
  const boundaries = [...new Set(items.flatMap(item => [item.start, item.end]))].sort((a, b) => a - b);
  const totals: Record<SleepState, number> = { asleep: 0, deep: 0, rem: 0, light: 0, awake: 0, inBed: 0, unknown: 0 };
  const used = new Set<TimedInterval>();
  const priority = (item: TimedInterval) => (item.state === 'awake' ? 0 : item.state === 'asleep' ? 2 : 1);
  for (let index = 0; index < boundaries.length - 1; index++) {
    const start = boundaries[index];
    const end = boundaries[index + 1];
    const winner = items
      .filter(item => item.start <= start && item.end >= end)
      .sort(
        (a, b) =>
          priority(a) - priority(b) ||
          a.end - a.start - (b.end - b.start) ||
          a.state.localeCompare(b.state) ||
          (a.sourceRecordId ?? '').localeCompare(b.sourceRecordId ?? '')
      )[0];
    if (winner) {
      totals[winner.state] += end - start;
      used.add(winner);
    }
  }
  return { totals, used: [...used] };
}

/** Resolve one source per overlapping episode; add genuinely separate sleeps per wake date. */
export function normalizeSleep(
  intervals: readonly SleepInterval[],
  source: SourceId,
  preferredSources: ReadonlyMap<string, readonly string[]> = new Map()
): SleepSummary[] {
  const days = new Map<string, { intervals: TimedInterval[]; totals: Record<SleepState, number>; start: number; end: number; detailed: boolean }>();
  for (const episode of getSleepEpisodes(intervals)) {
    const groups = new Map<string, TimedInterval[]>();
    for (const item of episode) groups.set(sourceKey(item), [...(groups.get(sourceKey(item)) ?? []), item]);
    const candidates = [...groups.entries()]
      .map(([key, items]) => {
        const timeline = resolveTimeline(items);
        const { deep, rem, light, asleep } = timeline.totals;
        return { key, items, timeline, detailed: deep + rem + light, asleep: deep + rem + light + asleep };
      })
      .filter(candidate => candidate.asleep > 0);
    const episodeKey = String(episode[0].start);
    const preferred = preferredSources.get(episodeKey) ?? [];
    // dataOrigins is a contributor set, not a priority-ordered list.
    const rank = (key: string) => (preferred.length && !preferred.includes(key) ? 1 : 0);
    candidates.sort(
      (a, b) =>
        metricSourceRank('sleep_duration', a.items[0]) - metricSourceRank('sleep_duration', b.items[0]) ||
        rank(a.key) - rank(b.key) ||
        a.key.localeCompare(b.key)
    );
    const chosenEpisodes: typeof candidates = [];
    for (const candidate of candidates) {
      const start = Math.min(...candidate.items.map(item => item.start));
      const end = Math.max(...candidate.items.map(item => item.end));
      if (
        chosenEpisodes.every(chosen => end <= Math.min(...chosen.items.map(item => item.start)) || start >= Math.max(...chosen.items.map(item => item.end)))
      ) {
        chosenEpisodes.push(candidate);
      }
    }
    for (const chosen of chosenEpisodes) {
      const start = Math.min(...chosen.timeline.used.map(item => item.start));
      const end = Math.max(...chosen.timeline.used.map(item => item.end));
      const date = localDay(end);
      const day = days.get(date);
      if (!day) {
        days.set(date, { intervals: chosen.timeline.used, totals: chosen.timeline.totals, start, end, detailed: chosen.detailed > 0 });
      } else {
        day.intervals.push(...chosen.timeline.used);
        for (const state of Object.keys(day.totals) as SleepState[]) day.totals[state] += chosen.timeline.totals[state];
        day.start = Math.min(day.start, start);
        day.end = Math.max(day.end, end);
        day.detailed ||= chosen.detailed > 0;
      }
    }
  }
  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, day]) => ({
      source,
      date,
      ...aggregateProvenance(day.intervals),
      normalizationVersion: 'sleep-v1',
      startTime: new Date(day.start).toISOString(),
      endTime: new Date(day.end).toISOString(),
      durationMinutes: (day.totals.asleep + day.totals.deep + day.totals.rem + day.totals.light) / MINUTE,
      stages: day.detailed
        ? {
            deepMinutes: day.totals.deep / MINUTE,
            remMinutes: day.totals.rem / MINUTE,
            lightMinutes: day.totals.light / MINUTE,
            awakeMinutes: day.totals.awake / MINUTE,
          }
        : undefined,
    }));
}
