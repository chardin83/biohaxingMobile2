import { SleepSummary,TimeRange, WearableAdapter } from './types';

let AppleHealthKit: any = null;

function getInitOptions() {
  const permissions = AppleHealthKit?.Constants?.Permissions;

  return {
    permissions: {
      read: [permissions?.SleepAnalysis ?? 'SleepAnalysis'],
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
};

function addStageMinutes(day: SleepDayAggregate, key: 'deepMinutes' | 'remMinutes' | 'lightMinutes' | 'awakeMinutes', minutes: number) {
  day.stages[key] = (day.stages[key] ?? 0) + minutes;
}

function mapSampleToStages(day: SleepDayAggregate, sample: any, minutes: number) {
  const rawValue = sample.value;
  const value = rawValue || rawValue === 0 ? String(rawValue).toLowerCase() : '';
  const metadataStr = sample.metadata ? JSON.stringify(sample.metadata).toLowerCase() : '';

  if (value.includes('deep') || metadataStr.includes('deep')) {
    addStageMinutes(day, 'deepMinutes', minutes);
    return;
  }

  if (value.includes('rem') || metadataStr.includes('rem')) {
    addStageMinutes(day, 'remMinutes', minutes);
    return;
  }

  if (value.includes('awake') || value.includes('wake') || metadataStr.includes('awake') || metadataStr.includes('wake')) {
    addStageMinutes(day, 'awakeMinutes', minutes);
    return;
  }

  if (typeof rawValue === 'number' && rawValue === 2) {
    addStageMinutes(day, 'awakeMinutes', minutes);
    return;
  }

  addStageMinutes(day, 'lightMinutes', minutes);
}

function mergeSleepSample(byDate: Record<string, SleepDayAggregate>, sample: any) {
  const start = new Date(sample.startDate);
  const end = new Date(sample.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return;
  }

  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const dateKey = toLocalDateISO(sample.startDate);
  const day = byDate[dateKey] ?? { durationMinutes: 0, stages: {}, startTime: sample.startDate };

  day.durationMinutes += minutes;

  if (!day.startTime || new Date(sample.startDate).getTime() < new Date(day.startTime).getTime()) {
    day.startTime = sample.startDate;
  }

  mapSampleToStages(day, sample, minutes);
  byDate[dateKey] = day;
}

export class HealthKitAdapter implements WearableAdapter {
  source = 'healthkit' as const;
  private initialized = false;
  private initErrorMessage: string | null = null;

  private async ensureInit() {
    if (this.initialized) return;
    if (this.initErrorMessage) {
      throw new Error(this.initErrorMessage);
    }
    try {
      const mod = require('react-native-health');

      // Try multiple shapes: the package may export default, AppleHealthKit,
      // or native module may be accessible via React Native's NativeModules
      const RN = require('react-native');
      const NativeModules = (RN && RN.NativeModules) || {};

      const candidates: any[] = [
        mod && (mod.default || mod.AppleHealthKit || mod.RNAppleHealthKit),
        mod,
        NativeModules.RNAppleHealthKit,
        NativeModules.AppleHealthKit,
        NativeModules.RCTAppleHealthKit,
      ];

      let found: any = null;
      for (const c of candidates) {
        if (!c) continue;
        if (typeof c.initHealthKit === 'function') {
          found = c;
          break;
        }
        // Some TurboModule shapes expose functions directly but may be proxies;
        // test for a getSleepSamples function which we need later.
        if (typeof c.getSleepSamples === 'function') {
          found = c;
          break;
        }
      }

      AppleHealthKit = found || (mod && (mod.default || mod.AppleHealthKit || mod));

      // If we still don't have callable methods, surface brief diagnostics.
      if (!AppleHealthKit || typeof AppleHealthKit.initHealthKit !== 'function') {
        const modKeys = Object.keys(mod || {}).join(', ');
        const nativeKeys = Object.keys(NativeModules || {}).slice(0, 80).join(', ');
        // Log small hints for runtime inspection (keeps output concise)
         
        console.warn(`[HealthKitAdapter] react-native-health keys: ${modKeys}`);
         
        console.warn(`[HealthKitAdapter] NativeModules keys (excerpt): ${nativeKeys}`);

        throw new TypeError(`react-native-health initHealthKit is not a function. module keys: ${modKeys}`);
      }

      const initOptions = getInitOptions();

      await new Promise<void>((resolve, reject) => {
        AppleHealthKit.initHealthKit(initOptions, (err: any) => {
          if (err) return reject(err);
          resolve();
        });
      });

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
      const samples: any[] = await new Promise((resolve, reject) => {
        AppleHealthKit.getSleepSamples(
          { startDate: range.start, endDate: range.end },
          (err: any, results: any) => {
            if (err) return reject(err);
            resolve(results || []);
          }
        );
      });

      const byDate: Record<string, SleepDayAggregate> = {};

      samples.forEach(sample => {
        mergeSleepSample(byDate, sample);
      });

      const out: SleepSummary[] = Object.keys(byDate).map(date => ({
        source: this.source,
        date,
        durationMinutes: byDate[date].durationMinutes,
        startTime: byDate[date].startTime,
        stages: {
          deepMinutes: byDate[date].stages.deepMinutes ?? 0,
          remMinutes: byDate[date].stages.remMinutes ?? 0,
          lightMinutes: byDate[date].stages.lightMinutes ?? 0,
          awakeMinutes: byDate[date].stages.awakeMinutes ?? 0,
        },
      }));

      return out;
    } catch (error) {
      if (error instanceof Error) {
        this.initErrorMessage = error.message;
      }
      return [];
    }
  }

  // Minimal implementations for other methods
  async getHRV(): Promise<any[]> { return []; }
  async getDailyActivity(): Promise<any[]> { return []; }
  async getEnergySignal(): Promise<any[]> { return []; }
}

export default HealthKitAdapter;
