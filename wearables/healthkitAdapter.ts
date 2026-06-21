import { DailyActivity, HRVSummary, SleepSummary, TimeRange, WearableAdapter } from './types';

type HealthKitModule = {
  initHealthKit?: (...args: any[]) => any;
  getSleepSamples?: (...args: any[]) => any;
  getDailyStepCountSamples?: (...args: any[]) => any;
  Constants?: { Permissions?: Record<string, string> };
  default?: any;
  AppleHealthKit?: any;
  RNAppleHealthKit?: any;
};

let AppleHealthKit: HealthKitModule | null = null;

function getInitOptions() {
  const permissions = AppleHealthKit?.Constants?.Permissions;

  return {
    permissions: {
      // Request Sleep plus common heart-rate related reads so we can fetch resting HR / HRV
      read: [
        permissions?.SleepAnalysis ?? 'SleepAnalysis',
        permissions?.RestingHeartRate ?? 'RestingHeartRate',
        permissions?.HeartRate ?? 'HeartRate',
        permissions?.HeartRateVariability ?? 'HeartRateVariability',
        permissions?.StepCount ?? 'StepCount',
      ],
      write: [],
    },
  };
}

function toLocalDateISO(dt: string) {
  const d = new Date(dt);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type SleepDayAggregate = {
  durationMinutes: number;
  stages: {
    deepMinutes?: number;
    remMinutes?: number;
    lightMinutes?: number;
    awakeMinutes?: number;
  };
  startTime?: string;
  endTime?: string;
};

type Interval = { start: number; end: number };

type SleepDayIntervals = {
  all: Interval[];
  deep: Interval[];
  rem: Interval[];
  light: Interval[];
  awake: Interval[];
};

// Minimal shape for HealthKit sleep samples we consume
type RawSleepSample = {
  value?: string | number | null;
  metadata?: Record<string, unknown> | string | null;
  startDate?: string;
  endDate?: string;
  sourceId?: string;
  sourceName?: string;
};

function detectVendorFromSamples(samples: any[]): string | null {
  if (!samples?.length) {
    return null;
  }

  const vendors = [
    { name: 'Garmin', keywords: ['garmin'] },
    { name: 'Fitbit', keywords: ['fitbit'] },
    { name: 'Apple', keywords: ['apple', 'health'] },
    { name: 'Samsung', keywords: ['samsung'] },
  ];

  for (const sample of samples) {
    const source = [
      sample?.sourceId,
      sample?.source,
      sample?.sourceName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const vendor = vendors.find(({ keywords }) =>
      keywords.some(keyword => source.includes(keyword)),
    );

    if (vendor) {
      return vendor.name;
    }
  }

  return null;
}

function getStageKeyForSample(sample: RawSleepSample): 'deep' | 'rem' | 'light' | 'awake' {
  const rawValue = sample.value;
  const value = rawValue || rawValue === 0 ? String(rawValue).toLowerCase() : '';
  const metadataStr = sample.metadata ? JSON.stringify(sample.metadata).toLowerCase() : '';

  if (value.includes('deep') || metadataStr.includes('deep')) return 'deep';
  // Some vendors (e.g. Garmin) label segments as 'CORE'. Map to light by default.
  if (value.includes('core') || metadataStr.includes('core')) return 'light';
  if (value.includes('rem') || metadataStr.includes('rem')) return 'rem';
  if (value.includes('awake') || value.includes('wake') || metadataStr.includes('awake') || metadataStr.includes('wake')) return 'awake';
  if (typeof rawValue === 'number' && rawValue === 2) return 'awake';
  return 'light';
}

function mergeIntervalsTotalMinutes(intervals: Interval[]) {
  if (!intervals || intervals.length === 0) return 0;
  const sorted = intervals.slice().sort((a, b) => a.start - b.start);
  let total = 0;
  let cur = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const it = sorted[i];
    if (it.start <= cur.end) {
      // overlap or contiguous
      cur.end = Math.max(cur.end, it.end);
    } else {
      total += Math.round((cur.end - cur.start) / 60000);
      cur = { ...it };
    }
  }
  total += Math.round((cur.end - cur.start) / 60000);
  return total;
}

// Try to locate a usable react-native-health module shape from exports/native modules
function findHealthKitModule(mod: unknown, NativeModules: Record<string, unknown>): HealthKitModule | null {
  const candidates: any[] = [
    (mod as any) && ((mod as any).default || (mod as any).AppleHealthKit || (mod as any).RNAppleHealthKit),
    mod,
    (NativeModules as any).RNAppleHealthKit,
    (NativeModules as any).AppleHealthKit,
    (NativeModules as any).RCTAppleHealthKit,
  ];

  for (const c of candidates) {
    if (!c) continue;
    if (typeof c.initHealthKit === 'function') return c;
    if (typeof c.getSleepSamples === 'function') return c;
  }
  return null;
}

async function callInitHealthKit(mod: HealthKitModule) {
  const initOptions = getInitOptions();
  await new Promise<void>((resolve, reject) => {
    const fn = (mod.initHealthKit as any);
    fn(initOptions, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Merge a sample into the given dateKey (used for session-based grouping)
function mergeSleepSampleWithKey(byDate: Record<string, SleepDayAggregate>, sample: RawSleepSample, dateKey: string) {
  const start = new Date(sample.startDate ?? 0);
  const end = new Date(sample.endDate ?? 0);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return;
  }
  // Skip overall INBED summary samples which would double-count duration
  const rawValue = sample.value;
  const valueStr = rawValue || rawValue === 0 ? String(rawValue).toLowerCase() : '';
  if (valueStr.includes('inbed') || valueStr.includes('in_bed')) {
    return;
  }

  // Ensure aggregate object exists and has interval buckets
  if (!byDate[dateKey]) {
    byDate[dateKey] = { durationMinutes: 0, stages: {}, startTime: sample.startDate, endTime: sample.endDate };
    const intervals: SleepDayIntervals = {
      all: [],
      deep: [],
      rem: [],
      light: [],
      awake: [],
    };
    (byDate as any)[dateKey]._intervals = intervals;
  }

  const day = byDate[dateKey];
  const ints = (byDate as any)[dateKey]._intervals as SleepDayIntervals;

  const interval: Interval = { start: start.getTime(), end: end.getTime() };
  ints.all.push(interval);
  const stageKey = getStageKeyForSample(sample);
  (ints as any)[stageKey].push(interval);

  // keep earliest start and latest end for the day
  if (!day.startTime || start.getTime() < new Date(day.startTime).getTime()) {
    day.startTime = sample.startDate;
  }
  if (!day.endTime || end.getTime() > new Date(day.endTime).getTime()) {
    day.endTime = sample.endDate;
  }

  byDate[dateKey] = day;
}

// After collecting intervals via mergeSleepSample, compute merged totals per day
function finalizeAggregates(byDate: Record<string, SleepDayAggregate>) {
  Object.keys(byDate).forEach(dateKey => {
    const day = byDate[dateKey];
    const ints = (byDate as any)[dateKey]._intervals as SleepDayIntervals | undefined;
    if (!ints) {
      // Fallback: leave existing duration/stages
      return;
    }

    day.durationMinutes = mergeIntervalsTotalMinutes(ints.all);

    day.stages.deepMinutes = mergeIntervalsTotalMinutes(ints.deep);
    day.stages.remMinutes = mergeIntervalsTotalMinutes(ints.rem);
    day.stages.lightMinutes = mergeIntervalsTotalMinutes(ints.light);
    day.stages.awakeMinutes = mergeIntervalsTotalMinutes(ints.awake);
  });
}

// Preferred HealthKit sample method order for resting HR / HRV
const HRV_SAMPLE_METHODS = [
  'getRestingHeartRateSamples',
  'getHeartRateSamples',
  'getHeartRateVariabilitySamples',
] as const;

export class HealthKitAdapter implements WearableAdapter {
  source = 'healthkit' as const;
  private initialized = false;
  private initErrorMessage: string | null = null;

  private async ensureInit() {
    if (this.initialized) return;
    if (this.initErrorMessage) throw new Error(this.initErrorMessage);

    try {
      const mod = require('react-native-health');
      const RN = require('react-native');
      const NativeModules = RN?.NativeModules ?? {};

      const found = findHealthKitModule(mod, NativeModules);
      AppleHealthKit = found || (mod && (mod.default || mod.AppleHealthKit || mod));

      if (!AppleHealthKit || typeof AppleHealthKit.initHealthKit !== 'function') {
        const modKeys = Object.keys(mod || {}).join(', ');
        throw new TypeError(`react-native-health initHealthKit is not a function. module keys: ${modKeys}`);
      }

      await callInitHealthKit(AppleHealthKit);
      this.initialized = true;
    } catch (err) {
      this.initErrorMessage = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }

  async getStatus() {
    try {
      await this.ensureInit();
      return { state: 'connected', source: this.source } as any;
    } catch (err: any) {
      return { state: 'error', message: err?.message ?? String(err), source: this.source } as any;
    }
  }

  async getSleep(range: TimeRange): Promise<SleepSummary[]> {
    try {
      await this.ensureInit();
      const health = AppleHealthKit;
      if (!health || typeof (health.getSleepSamples as any) !== 'function') {
        throw new Error('AppleHealthKit.getSleepSamples is not available');
      }

      const samples: RawSleepSample[] = await new Promise((resolve, reject) => {
        (health.getSleepSamples as any)(
          { startDate: range.start, endDate: range.end },
          (err: any, results: any) => {
            if (err) return reject(err);
            resolve(results || []);
          }
        );
      });

      // Detect vendor from raw samples (e.g. Garmin/Fitbit) and store on adapter instance
      try {
        const vendor = detectVendorFromSamples(samples as any[]);
        if (vendor) {
          (this as any).vendor = vendor;
        }
      } catch {
        /* ignore */
      }

      // Log full raw samples (for debugging external analysis)
      //console.debug('[HealthKitAdapter] raw sleep samples', samples);

      // No targeted logging — only full raw samples are logged above

      const byDate: Record<string, SleepDayAggregate> = {};

      // Group samples into contiguous sleep sessions (so chained samples belong to same night)
      const sorted = samples.slice().sort((a, b) => new Date(a.startDate ?? a.endDate ?? 0).getTime() - new Date(b.startDate ?? b.endDate ?? 0).getTime());
      const sessions: any[][] = [];
      const GRACE_MS = 1000; // consider contiguous if next.start <= prev.end + GRACE_MS
      let curSession: any[] = [];
      let curEnd = 0;
      for (const s of sorted) {
        const sStart = new Date(s.startDate ?? s.endDate ?? 0).getTime();
        const sEnd = new Date(s.endDate ?? s.startDate ?? 0).getTime();
        if (!curSession.length) {
          curSession.push(s);
          curEnd = sEnd;
          continue;
        }
        if (sStart <= curEnd + GRACE_MS) {
          curSession.push(s);
          curEnd = Math.max(curEnd, sEnd);
        } else {
          sessions.push(curSession);
          curSession = [s];
          curEnd = sEnd;
        }
      }
      if (curSession.length) sessions.push(curSession);

      // Merge samples into byDate using session's last endDate as the date key
      for (const session of sessions) {
        const sessionEnd = session.reduce((acc: number, it: any) => Math.max(acc, new Date(it.endDate ?? it.startDate ?? 0).getTime()), 0);
        const dateKey = toLocalDateISO(new Date(sessionEnd).toISOString());
        for (const sample of session) {
          mergeSleepSampleWithKey(byDate, sample, dateKey);
        }
      }

      // Merge overlapping intervals and compute final per-day totals
      finalizeAggregates(byDate);

      // No per-day debug logging

      const out: SleepSummary[] = Object.keys(byDate).map(date => ({
        source: this.source,
        date,
        durationMinutes: byDate[date].durationMinutes,
        startTime: byDate[date].startTime,
        endTime: byDate[date].endTime,
        stages: {
          deepMinutes: byDate[date].stages.deepMinutes ?? 0,
          remMinutes: byDate[date].stages.remMinutes ?? 0,
          lightMinutes: byDate[date].stages.lightMinutes ?? 0,
          awakeMinutes: byDate[date].stages.awakeMinutes ?? 0,
        },
      }));

      // No aggregated previews logged

      return out;
    } catch (error) {
      if (error instanceof Error) {
        this.initErrorMessage = error.message;
      }
      return [];
    }
  }



  async getHRV(range: TimeRange): Promise<HRVSummary[]> {
    try {
      await this.ensureInit();

      if (!AppleHealthKit) {
        return [];
      }

      const samples = await this.fetchFirstAvailableHRVSamples(AppleHealthKit, range);

      if (!samples.length) {
        console.debug('[HealthKitAdapter] getHRV no samples found');
        return [];
      }

      return this.toHRVSummaries(samples);
    } catch {
      return [];
    }
  }

  private async fetchFirstAvailableHRVSamples(
    health: typeof AppleHealthKit,
    range: TimeRange,
  ): Promise<any[]> {
    for (const methodName of HRV_SAMPLE_METHODS) {
      const samples = await this.tryFetchHRVSamples(health, methodName, range);

      if (samples.length) {
        return samples;
      }
    }

    // No method returned samples — log available keys to help debugging
    try {
      console.debug('[HealthKitAdapter] getHRV availableKeys', Object.keys(health || {}).sort());
    } catch {
      /* ignore */
    }

    return [];
  }

  private async tryFetchHRVSamples(
    health: typeof AppleHealthKit,
    methodName: typeof HRV_SAMPLE_METHODS[number],
    range: TimeRange,
  ): Promise<any[]> {
    const fn = (health as any)[methodName];

    if (typeof fn !== 'function') {
      console.debug('[HealthKitAdapter] getHRV missing', methodName);
      return [];
    }

    console.debug('[HealthKitAdapter] getHRV trying', methodName);

    const samples = await new Promise<any[]>((resolve, reject) => {
      fn.call(
        health,
        { startDate: range.start, endDate: range.end },
        (err: any, results: any) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(results ?? []);
        },
      );
    });

    console.debug(
      '[HealthKitAdapter] getHRV fetched',
      methodName,
      'count',
      samples.length,
    );

    if (samples.length) {
      try { console.debug('[HealthKitAdapter] getHRV sample0', samples[0]); } catch { }
    }

    return samples;
  }

  private toHRVSummaries(samples: any[]): HRVSummary[] {
    const byDate = this.groupHRVSamplesByDate(samples);

    return Object.entries(byDate).map(([date, values]) => {
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = values.length ? sum / values.length : 0;
      return {
        source: this.source,
        date,
        avgRestingHrBpm: Math.round(avg),
      } satisfies HRVSummary;
    });
  }

  private groupHRVSamplesByDate(samples: any[]): Record<string, number[]> {
    return samples.reduce<Record<string, number[]>>((acc, sample) => {
      const value = Number(sample.value);

      if (!Number.isFinite(value)) {
        return acc;
      }

      const date = new Date(sample.endDate ?? sample.startDate ?? 0).toISOString();
      const dateKey = toLocalDateISO(date);

      acc[dateKey] ??= [];
      acc[dateKey].push(value);

      return acc;
    }, {});
  }
  async getDailyActivity(range: TimeRange): Promise<DailyActivity[]> {
    try {
      await this.ensureInit();

      const health = AppleHealthKit;
      if (!health || typeof (health.getDailyStepCountSamples as any) !== 'function') {
        throw new Error('AppleHealthKit.getDailyStepCountSamples is not available');
      }

      const samples: RawSleepSample[] = await new Promise((resolve, reject) => {
        (health.getDailyStepCountSamples as any)(
          { startDate: range.start, endDate: range.end },
          (err: any, results: any) => {
            if (err) return reject(err);
            resolve(results || []);
          }
        );
      });

      /*console.log(
        '[HealthKitAdapter] step samples',
        JSON.stringify(samples, null, 2)
      );*/

      const stepsByDay = new Map<string, number>();

      for (const sample of samples) {
        const date = toLocalDateISO(sample.startDate ?? sample.endDate ?? range.end);
        const steps = Number(sample.value ?? 0);

        if (Number.isFinite(steps)) {
          stepsByDay.set(date, (stepsByDay.get(date) ?? 0) + steps);
        }
      }

      return [...stepsByDay.entries()].map(([date, steps]) => ({
        source: this.source,
        date,
        steps: Math.round(steps),
      }));
    } catch (err) {
      console.warn('[HealthKitAdapter] getDailyActivity failed', err);
      return [];
    }
  }

    async getEnergySignal(): Promise<any[]> { return []; }
    
}



export default HealthKitAdapter;
