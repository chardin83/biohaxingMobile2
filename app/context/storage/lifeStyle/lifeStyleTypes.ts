import type { LifeStyleId } from '@/constants/lifeStyle';

export type LifeStyleEntry = { value: boolean; recordedAt: string; source?: 'journal' };
export type LifeStyleDay = Partial<Record<LifeStyleId, LifeStyleEntry>>;
export type LifeStyleLog = Record<string, LifeStyleDay>;
