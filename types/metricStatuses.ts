export type MetricStatus = 'unknown' | 'low' | 'moderate' | 'good' | 'optimal' | 'elevated' | 'high' | 'closeToBedtime' | 'tooCloseToBedtime';

type MetricStatusSubset<T extends MetricStatus> = T;

export type BloodPressureStatus = MetricStatusSubset<'unknown' | 'optimal' | 'low' | 'elevated' | 'high'>;

export type ExerciseBeforeSleepStatus = MetricStatusSubset<'unknown' | 'optimal' | 'closeToBedtime' | 'tooCloseToBedtime'>;

export type SleepConsistencyStatus = MetricStatusSubset<'low' | 'moderate' | 'good' | 'optimal'>;

export type CaffeineBeforeSleepStatus = MetricStatusSubset<'unknown' | 'optimal' | 'closeToBedtime' | 'tooCloseToBedtime'>;
