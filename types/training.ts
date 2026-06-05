export type TrainingActivityType = 'running' | 'gym' | 'cycling' | 'walking';
export type TrainingIntensity = 'low' | 'medium' | 'high';

export type TrainingActivityFilter = TrainingActivityType | 'any';
export type TrainingIntensityFilter = TrainingIntensity | 'any';

export type TrainingBadgeIcon = 'calendar' | 'clock' | 'trainingRunning' | 'flame';

export type TrainingBadgeItem = {
	key: string;
	label: string;
	icon: TrainingBadgeIcon;
};
