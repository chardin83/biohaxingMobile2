import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WorkoutSession } from '@/wearables/types';

import { isImportedTraining, loadDeletedTrainingKeys, mergeImportedTraining, rememberDeletedTraining, workoutToTrainingEntry } from '../trainingImport';
import type { TrainingLogEntry } from '../trainingTypes';

const workout: WorkoutSession = {
  source: 'healthkit', sourceId: 'com.garmin.connect', sourceRecordId: 'run-1', sourceName: 'Garmin',
  startTime: '2026-10-20T10:00:00Z', endTime: '2026-10-20T11:00:00Z', activityType: 'running',
};
const manual: TrainingLogEntry = { id: 'manual', date: '2026-10-20', activityType: 'walking', durationMinutes: 20, intensity: 'low', createdAt: workout.startTime };

it('imports sessions with stable original identity and unknown intensity', () => {
  const entry = workoutToTrainingEntry(workout)!;
  expect(entry).toMatchObject({ origin: 'healthkit', sourceName: 'Garmin', sourceRecordId: 'run-1', date: '2026-10-20', durationMinutes: 60 });
  expect(entry.intensity).toBeUndefined();
  expect(isImportedTraining(entry)).toBe(true);
  expect(workoutToTrainingEntry({ ...workout, endTime: '2026-10-21T11:00:00Z' })!.id).toBe(entry.id);
  expect(workoutToTrainingEntry({ ...workout, endTime: 'invalid' })).toBeUndefined();
  expect(workoutToTrainingEntry({ ...workout, endTime: workout.startTime })).toBeUndefined();
});

it('resyncs without duplicates, replaces changed preferred sources and preserves manual logs', () => {
  const entry = workoutToTrainingEntry(workout)!;
  const first = mergeImportedTraining({ [manual.date]: [manual] }, [entry]);
  expect(mergeImportedTraining(first, [entry])[manual.date]).toEqual([manual, entry]);
  const replacement = workoutToTrainingEntry({ ...workout, sourceRecordId: 'apple-run', sourceId: 'com.apple.health' })!;
  expect(mergeImportedTraining(first, [replacement])[manual.date]).toEqual([manual, replacement]);
});

it('does not duplicate identical sessions with different source record IDs', () => {
  const a = workoutToTrainingEntry(workout)!;
  const b = workoutToTrainingEntry({ ...workout, sourceRecordId: 'copy' })!;
  expect(mergeImportedTraining({}, [a, b])[a.date]).toHaveLength(1);
});

it('persists deletion and rejects the same record even if its date changes', async () => {
  const entry = workoutToTrainingEntry({ ...workout, sourceRecordId: 'deleted-run' })!;
  await rememberDeletedTraining(entry);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(`deletedSyncedTraining:${entry.id}`, '1');
  await loadDeletedTrainingKeys();
  const changed = workoutToTrainingEntry({ ...workout, sourceRecordId: 'deleted-run', endTime: '2026-10-21T11:00:00Z' })!;
  expect(mergeImportedTraining({}, [changed])[changed.date]).toEqual([]);
});

it('moves updated records between days without leaving the old copy', () => {
  const entry = workoutToTrainingEntry(workout)!;
  const moved = workoutToTrainingEntry({ ...workout, startTime: '2026-10-21T10:00:00Z', endTime: '2026-10-21T11:00:00Z' })!;
  const merged = mergeImportedTraining({ [entry.date]: [entry] }, [moved]);
  expect(merged[entry.date]).toEqual([]);
  expect(merged[moved.date]).toEqual([moved]);
});

it('locks imported records at the storage layer while leaving manual entries editable', () => {
  const { updateTrainingEntryInTracking } = require('../trainingStorage');
  const entry = workoutToTrainingEntry(workout)!;
  const tracking = { [entry.date]: [entry, manual] };
  expect(updateTrainingEntryInTracking(tracking, entry.date, entry.id, { durationMinutes: 5 })).toBe(tracking);
  expect(updateTrainingEntryInTracking(tracking, entry.date, manual.id, { durationMinutes: 25 })[entry.date][1].durationMinutes).toBe(25);
});
