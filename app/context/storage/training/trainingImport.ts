import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WorkoutSession } from '@/wearables/types';

import type { DailyTrainingTracking, TrainingLogEntry } from './trainingTypes';

const DELETED_PREFIX = 'deletedSyncedTraining:';
const deleted = new Set<string>();

export const isImportedTraining = (entry: TrainingLogEntry) => entry.origin === 'healthkit' || entry.origin === 'healthconnect';

export async function loadDeletedTrainingKeys() {
  const keys = await AsyncStorage.getAllKeys();
  keys.filter(key => key.startsWith(DELETED_PREFIX)).forEach(key => deleted.add(key.slice(DELETED_PREFIX.length)));
}

export function rememberDeletedTraining(entry: TrainingLogEntry) {
  if (!isImportedTraining(entry)) return Promise.resolve();
  deleted.add(entry.id);
  return AsyncStorage.setItem(`${DELETED_PREFIX}${entry.id}`, '1');
}

export function workoutToTrainingEntry(workout: WorkoutSession): TrainingLogEntry | undefined {
  const start = Date.parse(workout.startTime);
  const end = Date.parse(workout.endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined;
  const local = new Date(end);
  const date = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
  const identity = workout.sourceRecordId
    ? [workout.source, 'record', workout.sourceRecordId]
    : [workout.source, workout.sourceId ?? workout.sourceName ?? 'unknown', start, end, workout.activityType];
  const { source, ...details } = workout;
  return {
    ...details,
    id: `wearable:${JSON.stringify(identity)}`,
    origin: source,
    date,
    durationMinutes: (end - start) / 60000,
    // The source did not provide the user's low/medium/high intensity rating.
    createdAt: workout.startTime,
  };
}

/** Replace the selected provider's sessions on returned days; preserve manual logs and deleted IDs. */
export function mergeImportedTraining(previous: DailyTrainingTracking, entries: TrainingLogEntry[]): DailyTrainingTracking {
  const updated = { ...previous };
  const incomingIds = new Set(entries.map(entry => entry.id));
  const daysByOrigin = new Set(entries.map(entry => `${entry.origin}|${entry.date}`));
  for (const [date, day] of Object.entries(previous)) {
    updated[date] = day.filter(entry => !isImportedTraining(entry) || (!incomingIds.has(entry.id) && !daysByOrigin.has(`${entry.origin}|${date}`)));
  }
  const seen = new Set<string>();
  for (const entry of entries) {
    updated[entry.date] ??= [];
    const signature = JSON.stringify([entry.origin, entry.sourceId ?? entry.sourceName, entry.startTime, entry.endTime, entry.activityType]);
    if (deleted.has(entry.id) || seen.has(signature)) continue;
    seen.add(signature);
    updated[entry.date] = [...(updated[entry.date] ?? []), entry];
  }
  for (const [date, day] of Object.entries(updated)) {
    if (previous[date] && JSON.stringify(previous[date]) === JSON.stringify(day)) updated[date] = previous[date];
  }
  return Object.keys(updated).length === Object.keys(previous).length && Object.keys(updated).every(date => updated[date] === previous[date]) ? previous : updated;
}
