import { WeeklyTrackingItem } from '@/components/nutritionTargets.logic';
import { ALL_AMINO_ACID_KEYS, AminoAcidType } from '@/constants/aminoAcids';
import {
  FIBER_CATEGORY_SUBTYPES,
  FIBER_TYPE_KEYS,
  type FiberSubtype,
} from '@/constants/fiber';
import { MINERAL_TYPE_KEYS, MineralType } from '@/constants/minerals';
import { POLYPHENOL_TYPE_KEYS, PolyphenolType } from '@/constants/polyphenols';
import { VITAMIN_TYPE_KEYS, VitaminType } from '@/constants/vitamins';
import { MicrobiomeSupportEntry } from '@/types/microbiome';

import {
  handleNoMacroData,
  handleNoStructuredData,
} from '../components/nutritionAnalysisHelpers';

export type NutritionEvidence = {
  sources: string[];
  inferred: string[];
  confidence: 'high' | 'medium' | 'low' | 'unknown';
};

export type ConfidenceLevel = NutritionEvidence['confidence'];


export type WeeklyTrackingSignalValue = WeeklyTrackingItem[] | number;
export type WeeklyTrackingSignals = Record<string, WeeklyTrackingSignalValue>;

export type ParsedMacroAnalysis = {
  mealName: string;
  protein: number;
  calories: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  fiberByType: Record<string, number>;
  fiberSubtypeTotals: Record<string, number>;
  polyphenolByType: Record<string, number>;
  mineralsByType: Record<string, number>;
  mineralsConfidenceByType: Record<string, ConfidenceLevel>;
  vitaminsByType: Record<string, number>;
  aminoAcidsByType: Record<string, number>;
  microbiomeSupport: MicrobiomeSupportEntry[];
};

type TypedTotalsAccumulator = {
  fiberByType: Record<string, number>;
  fiberSubtypeTotals: Record<string, number>;
  polyphenolByType: Record<string, number>;
  mineralsByType: Record<string, number>;
  mineralsConfidenceByType: Record<string, ConfidenceLevel>;
  vitaminsByType: Record<string, number>;
  aminoAcidsByType: Record<string, number>;
};

type FiberSubtypeKey = FiberSubtype;

const ALL_FIBER_SUBTYPES: FiberSubtypeKey[] = [
  ...new Set(Object.values(FIBER_CATEGORY_SUBTYPES).flat()),
] as FiberSubtypeKey[];

const confidenceRank: Record<ConfidenceLevel, number> = {
  unknown: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const emptyFiberTotals = (): Record<string, number> =>
  FIBER_TYPE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<string, number>);

const emptyFiberSubtypeTotals = (): Record<string, number> =>
  ALL_FIBER_SUBTYPES.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<string, number>);

const emptyPolyphenolTotals = (): Record<string, number> =>
  POLYPHENOL_TYPE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<string, number>);

const emptyMineralTotals = (): Record<string, number> =>
  MINERAL_TYPE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<string, number>);

const emptyMineralConfidenceTotals = (): Record<string, ConfidenceLevel> =>
  MINERAL_TYPE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 'unknown' }), {} as Record<string, ConfidenceLevel>);

const emptyVitaminTotals = (): Record<string, number> =>
  VITAMIN_TYPE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<string, number>);

const emptyAminoAcidTotals = (): Record<string, number> =>
  ALL_AMINO_ACID_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<string, number>);

export const normalizeItemName = (item: string): string => {
  return item
    .trim()
    .toLowerCase()
    .replaceAll(/[\s_-]+/g, ' ')
    .replaceAll(/^\s+|\s+$/g, '');
};

export const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  return [];
};

const normalizeConfidence = (value: unknown): NutritionEvidence['confidence'] => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalizedScore = value > 1 && value <= 100 ? value / 100 : value;
    if (normalizedScore >= 0.8) return 'high';
    if (normalizedScore >= 0.5) return 'medium';
    if (normalizedScore > 0) return 'low';
    return 'unknown';
  }

  if (typeof value !== 'string') return 'unknown';

  const normalized = value.toLowerCase().trim();
  if (normalized.includes('high')) return 'high';
  if (normalized.includes('medium')) return 'medium';
  if (normalized.includes('low')) return 'low';
  return 'unknown';
};

const pickConfidence = (
  labelValue: unknown,
  scoreValue: unknown
): NutritionEvidence['confidence'] => {
  const label = normalizeConfidence(labelValue);
  if (label === 'unknown') {
    return normalizeConfidence(scoreValue);
  }
  return label;
};

export const parseNumberValue = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const normalized = value.replace(',', '.');
  const regex = /-?\d+(?:\.\d+)?/;
  const match = regex.exec(normalized);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const pickFirstNumber = (candidate: any, keys: string[]): number | null => {
  if (!candidate || typeof candidate !== 'object') return null;

  for (const key of keys) {
    const parsed = parseNumberValue(candidate?.[key]);
    if (parsed !== null) return parsed;
  }

  return null;
};

const mergeConfidenceLevel = (
  current: ConfidenceLevel,
  next: ConfidenceLevel
): ConfidenceLevel => {
  return confidenceRank[next] > confidenceRank[current] ? next : current;
};

const setMineralConfidence = (
  target: Record<string, ConfidenceLevel>,
  key: string,
  level: ConfidenceLevel
) => {
  const current = target[key] ?? 'unknown';
  target[key] = mergeConfidenceLevel(current, level);
};

const addToTotals = (target: Record<string, number>, key: string, value: unknown) => {
  const parsed = parseNumberValue(value);
  if (parsed === null) return;
  if (!Number.isFinite(parsed)) return;

  target[key] = (target[key] ?? 0) + parsed;
};

const supportLevelScore = (value: MicrobiomeSupportEntry['supportLevel']): number => {
  if (value === 'high') return 3;
  if (value === 'medium') return 2;
  if (value === 'low') return 1;
  return 0;
};

const normalizeSupportLevel = (
  value: unknown
): MicrobiomeSupportEntry['supportLevel'] => {
  if (typeof value !== 'string') return 'unknown';

  const raw = value.toLowerCase().trim();
  if (raw === 'high' || raw === 'medium' || raw === 'low') return raw;

  return 'unknown';
};

const mergeMicrobiomeSupportLists = (
  entries: MicrobiomeSupportEntry[]
): MicrobiomeSupportEntry[] => {
  const byMicrobe = new Map<string, MicrobiomeSupportEntry>();

  entries.forEach(entry => {
    const key = entry.microbe.toLowerCase().trim();
    if (!key) return;

    const existing = byMicrobe.get(key);
    if (!existing) {
      byMicrobe.set(key, {
        microbe: entry.microbe,
        supportLevel: entry.supportLevel,
        linkedNutrients: Array.from(new Set(entry.linkedNutrients)),
        likelyFoods: Array.from(new Set(entry.likelyFoods)),
        rationale: entry.rationale,
      });
      return;
    }

    const nextLevel =
      supportLevelScore(entry.supportLevel) > supportLevelScore(existing.supportLevel)
        ? entry.supportLevel
        : existing.supportLevel;

    byMicrobe.set(key, {
      microbe: existing.microbe,
      supportLevel: nextLevel,
      linkedNutrients: Array.from(new Set([...existing.linkedNutrients, ...entry.linkedNutrients])),
      likelyFoods: Array.from(new Set([...existing.likelyFoods, ...entry.likelyFoods])),
      rationale: existing.rationale ?? entry.rationale,
    });
  });

  return Array.from(byMicrobe.values());
};

export const extractMicrobiomeSupport = (
  data: any,
  parsedContent: any
): MicrobiomeSupportEntry[] => {
  const candidates = [
    data,
    data?.nutrition,
    data?.raw,
    data?.result,
    data?.result?.nutrition,
    data?.result?.raw,
    parsedContent,
    parsedContent?.nutrition,
    parsedContent?.raw,
  ];

  const entries: MicrobiomeSupportEntry[] = [];

  candidates.forEach(candidate => {
    const fromDetails = Array.isArray(candidate?.nutritionDetails?.microbiomeSupport)
      ? candidate.nutritionDetails.microbiomeSupport
      : [];
    const fromRoot = Array.isArray(candidate?.microbiomeSupport)
      ? candidate.microbiomeSupport
      : [];
    const merged = [...fromDetails, ...fromRoot];

    merged.forEach((item: any) => {
      const microbe = String(item?.microbe ?? '').trim();
      if (!microbe) return;

      entries.push({
        microbe,
        supportLevel: normalizeSupportLevel(item?.supportLevel ?? item?.support_level),
        linkedNutrients: parseStringArray(item?.linkedNutrients ?? item?.linked_nutrients),
        likelyFoods: parseStringArray(item?.likelyFoods ?? item?.likely_foods),
        rationale: typeof item?.rationale === 'string' ? item.rationale : undefined,
      });
    });
  });

  return mergeMicrobiomeSupportLists(entries);
};

const normalizeFlavonoidClassTag = (value: unknown): PolyphenolType | null => {
  if (typeof value !== 'string') return null;

  const normalized = value.toLowerCase().trim();
  if (normalized.includes('anthocyan')) return 'anthocyanins';
  if (normalized.includes('catechin')) return 'catechins';
  if (normalized.includes('flavanol')) return 'flavanols';
  if (normalized.includes('flavonol')) return 'flavonols';
  if (normalized.includes('quercetin')) return 'quercetin';
  if (normalized.includes('ellagitannin')) return 'ellagitannins';
  if (normalized.includes('flavonoid')) return 'flavonoids';

  return null;
};

const applyMeasuredByTypeFromCandidate = (
  candidate: any,
  totals: TypedTotalsAccumulator
) => {
  const {
    fiberByType,
    fiberSubtypeTotals,
    polyphenolByType,
    mineralsByType,
    mineralsConfidenceByType,
    vitaminsByType,
    aminoAcidsByType,
  } = totals;

  const fiberMap = candidate?.fiberByType;
  const fiberSubtypeMap = candidate?.fiberSubtypeTotals;
  const polyMap = candidate?.polyphenolByType;
  const mineralMap = candidate?.mineralsByType ?? candidate?.mineralByType;
  const vitaminMap = candidate?.vitaminsByType ?? candidate?.vitaminByType;
  const aminoMap = candidate?.aminoAcidsByType;

  if (fiberMap && typeof fiberMap === 'object') {
    FIBER_TYPE_KEYS.forEach(tag => addToTotals(fiberByType, tag, fiberMap?.[tag]));
  }

  if (fiberSubtypeMap && typeof fiberSubtypeMap === 'object') {
    ALL_FIBER_SUBTYPES.forEach(tag =>
      addToTotals(fiberSubtypeTotals, tag, fiberSubtypeMap?.[tag])
    );
  }

  if (polyMap && typeof polyMap === 'object') {
    POLYPHENOL_TYPE_KEYS.forEach(tag => addToTotals(polyphenolByType, tag, polyMap?.[tag]));
  }

  if (mineralMap && typeof mineralMap === 'object') {
    MINERAL_TYPE_KEYS.forEach(tag => {
      const before = mineralsByType[tag] ?? 0;
      addToTotals(mineralsByType, tag, mineralMap?.[tag]);
      if ((mineralsByType[tag] ?? 0) > before) {
        setMineralConfidence(mineralsConfidenceByType, tag, 'medium');
      }
    });
  }

  if (vitaminMap && typeof vitaminMap === 'object') {
    VITAMIN_TYPE_KEYS.forEach(tag => addToTotals(vitaminsByType, tag, vitaminMap?.[tag]));
  }

  if (aminoMap && typeof aminoMap === 'object') {
    ALL_AMINO_ACID_KEYS.forEach(tag => addToTotals(aminoAcidsByType, tag, aminoMap?.[tag]));
  }
};

const applyDetailsFromCandidate = (
  candidate: any,
  totals: TypedTotalsAccumulator
) => {
  const {
    fiberByType,
    fiberSubtypeTotals,
    polyphenolByType,
    mineralsByType,
    mineralsConfidenceByType,
    vitaminsByType,
    aminoAcidsByType,
  } = totals;

  const details = candidate?.nutritionDetails;

  const fiberDetails = details?.fiber;
  if (fiberDetails) {
    addToTotals(fiberByType, 'fiber_total', fiberDetails?.total);
    addToTotals(
      fiberByType,
      'fiber_gel_forming',
      fiberDetails?.gelForming ?? fiberDetails?.gel_forming ?? fiberDetails?.soluble
    );
    addToTotals(
      fiberByType,
      'fiber_non_gel_forming',
      fiberDetails?.nonGelForming ?? fiberDetails?.non_gel_forming ?? fiberDetails?.insoluble
    );
    addToTotals(
      fiberByType,
      'fiber_fermentable',
      fiberDetails?.fermentable ??
        fiberDetails?.resistantStarch ??
        fiberDetails?.resistant_starch
    );

    const subtypeRows = Array.isArray(fiberDetails?.subtypes)
      ? fiberDetails.subtypes
      : [];

    subtypeRows.forEach((item: any) => {
      const subtype = String(item?.subtype ?? '').trim();
      if (!ALL_FIBER_SUBTYPES.includes(subtype as FiberSubtypeKey)) return;
      addToTotals(
        fiberSubtypeTotals,
        subtype,
        item?.amountG ?? item?.amount_g ?? item?.amount
      );
    });
  }

  const polyphenols = details?.polyphenols;
  if (polyphenols) {
    addToTotals(polyphenolByType, 'polyphenols_total', polyphenols?.totalMg ?? polyphenols?.total_mg);
  }

  const aminoAcids = details?.aminoAcids;
  if (aminoAcids && typeof aminoAcids === 'object') {
    ALL_AMINO_ACID_KEYS.forEach(tag => addToTotals(aminoAcidsByType, tag, aminoAcids[tag]));

    let aminoRows: any[] = [];
    if (Array.isArray(aminoAcids?.items)) {
      aminoRows = aminoAcids.items;
    } else if (Array.isArray(aminoAcids?.list)) {
      aminoRows = aminoAcids.list;
    }

    aminoRows.forEach((item: any) => {
      const normalizedKey = String(item?.name ?? item?.tag ?? '')
        .toLowerCase()
        .trim()
        .replaceAll(/\s+/g, '_');

      if (!ALL_AMINO_ACID_KEYS.includes(normalizedKey as AminoAcidType)) return;

      addToTotals(
        aminoAcidsByType,
        normalizedKey,
        item?.amountMg ?? item?.amount_mg ?? item?.amount
      );
    });
  }

  const flavonoids = details?.flavonoids;
  if (flavonoids) {
    addToTotals(polyphenolByType, 'flavonoids_total', flavonoids?.totalMg ?? flavonoids?.total_mg);

    const classes = Array.isArray(flavonoids?.classes) ? flavonoids.classes : [];
    classes.forEach((item: any) => {
      const classTag = normalizeFlavonoidClassTag(item?.name);
      if (classTag) {
        addToTotals(polyphenolByType, classTag, item?.amountMg ?? item?.amount_mg);
      }
    });
  }

  const minerals = details?.minerals;
  if (minerals) {
    MINERAL_TYPE_KEYS.forEach(tag => {
      const before = mineralsByType[tag] ?? 0;
      addToTotals(mineralsByType, tag, minerals?.[tag]);
      if ((mineralsByType[tag] ?? 0) > before) {
        setMineralConfidence(mineralsConfidenceByType, tag, 'high');
      }
    });

    let mineralsRows: any[] = [];
    if (Array.isArray(minerals?.items)) {
      mineralsRows = minerals.items;
    } else if (Array.isArray(minerals?.list)) {
      mineralsRows = minerals.list;
    }

    mineralsRows.forEach((item: any) => {
      const rawKey = String(item?.name ?? item?.tag ?? '').toLowerCase().trim();
      const normalizedKey = rawKey.replaceAll(/\s+/g, '_');

      if (!MINERAL_TYPE_KEYS.includes(normalizedKey as MineralType)) return;

      const before = mineralsByType[normalizedKey] ?? 0;
      addToTotals(
        mineralsByType,
        normalizedKey,
        item?.amountMg ?? item?.amount_mg ?? item?.amount
      );

      if ((mineralsByType[normalizedKey] ?? 0) > before) {
        setMineralConfidence(mineralsConfidenceByType, normalizedKey, 'high');
      }
    });
  }

  const vitamins = details?.vitamins;
  if (vitamins) {
    VITAMIN_TYPE_KEYS.forEach(tag => {
      addToTotals(vitaminsByType, tag, vitamins?.[tag]);
    });

    let vitaminRows: any[] = [];
    if (Array.isArray(vitamins?.items)) {
      vitaminRows = vitamins.items;
    } else if (Array.isArray(vitamins?.list)) {
      vitaminRows = vitamins.list;
    }

    vitaminRows.forEach((item: any) => {
      const rawKey = String(item?.name ?? item?.tag ?? '').toLowerCase().trim();
      const normalizedKey = rawKey.replaceAll(/\s+/g, '_');

      if (!VITAMIN_TYPE_KEYS.includes(normalizedKey as VitaminType)) return;

      addToTotals(
        vitaminsByType,
        normalizedKey,
        item?.amountMg ?? item?.amount_mg ?? item?.amount
      );
    });
  }
};

export const extractTypedTotals = (data: any, parsedContent: any) => {
  const totals: TypedTotalsAccumulator = {
    fiberByType: emptyFiberTotals(),
    fiberSubtypeTotals: emptyFiberSubtypeTotals(),
    polyphenolByType: emptyPolyphenolTotals(),
    mineralsByType: emptyMineralTotals(),
    mineralsConfidenceByType: emptyMineralConfidenceTotals(),
    vitaminsByType: emptyVitaminTotals(),
    aminoAcidsByType: emptyAminoAcidTotals(),
  };

  const candidates = [
    data,
    data?.nutrition,
    data?.raw,
    data?.result,
    data?.result?.nutrition,
    data?.result?.raw,
    parsedContent,
    parsedContent?.nutrition,
    parsedContent?.raw,
  ];

  for (const candidate of candidates) {
    applyMeasuredByTypeFromCandidate(candidate, totals);
    applyDetailsFromCandidate(candidate, totals);
  }

  return totals;
};

export const hasAnyTypedTotals = (values: Record<string, number>) =>
  Object.values(values).some(value => (value ?? 0) > 0);

const extractFromCandidate = (candidate: any): ParsedMacroAnalysis | null => {
  if (!candidate || typeof candidate !== 'object') return null;

  const protein = pickFirstNumber(candidate, ['protein', 'protein_g', 'proteinGrams', 'proteins']);
  const calories = pickFirstNumber(candidate, ['calories', 'kcal', 'energy_kcal', 'energy', 'kilocalories']);
  const carbohydrates = pickFirstNumber(candidate, ['carbohydrates', 'carbs', 'carbohydrate_g', 'carbs_g']);
  const fat = pickFirstNumber(candidate, ['fat', 'fats', 'fat_g', 'total_fat']);
  const fiber = pickFirstNumber(candidate, ['fiber', 'fibre', 'fiber_g', 'dietary_fiber']);

  if (
    protein === null &&
    calories === null &&
    carbohydrates === null &&
    fat === null &&
    fiber === null
  ) {
    return null;
  }

  let mealNameRaw = '';
  if (typeof candidate?.mealName === 'string') {
    mealNameRaw = candidate.mealName;
  } else if (typeof candidate?.meal_name === 'string') {
    mealNameRaw = candidate.meal_name;
  } else if (typeof candidate?.name === 'string') {
    mealNameRaw = candidate.name;
  }

  const mealName = mealNameRaw.trim();

  return {
    mealName,
    protein: protein ?? 0,
    calories: calories ?? 0,
    carbohydrates: carbohydrates ?? 0,
    fat: fat ?? 0,
    fiber: fiber ?? 0,
    fiberByType: emptyFiberTotals(),
    fiberSubtypeTotals: emptyFiberSubtypeTotals(),
    polyphenolByType: emptyPolyphenolTotals(),
    mineralsByType: emptyMineralTotals(),
    mineralsConfidenceByType: emptyMineralConfidenceTotals(),
    vitaminsByType: emptyVitaminTotals(),
    aminoAcidsByType: emptyAminoAcidTotals(),
    microbiomeSupport: [],
  };
};

const extractFromText = (text: string): ParsedMacroAnalysis | null => {
  const read = (regex: RegExp): number | null => {
    const match = regex.exec(text);
    if (!match?.[1]) return null;
    return parseNumberValue(match[1]);
  };

  const protein = read(/protein[^\d-]*(-?\d+(?:[.,]\d+)?)/i);
  const calories = read(/(?:kalorier|calories|kcal|energy)[^\d-]*(-?\d+(?:[.,]\d+)?)/i);
  const carbohydrates = read(/(?:kolhydrater|carbohydrates|carbs)[^\d-]*(-?\d+(?:[.,]\d+)?)/i);
  const fat = read(/(?:fett|fat)[^\d-]*(-?\d+(?:[.,]\d+)?)/i);
  const fiber = read(/(?:fibrer|fiber|fibre)[^\d-]*(-?\d+(?:[.,]\d+)?)/i);

  if (
    protein === null &&
    calories === null &&
    carbohydrates === null &&
    fat === null &&
    fiber === null
  ) {
    return null;
  }

  return {
    mealName: '',
    protein: protein ?? 0,
    calories: calories ?? 0,
    carbohydrates: carbohydrates ?? 0,
    fat: fat ?? 0,
    fiber: fiber ?? 0,
    fiberByType: emptyFiberTotals(),
    fiberSubtypeTotals: emptyFiberSubtypeTotals(),
    polyphenolByType: emptyPolyphenolTotals(),
    mineralsByType: emptyMineralTotals(),
    mineralsConfidenceByType: emptyMineralConfidenceTotals(),
    vitaminsByType: emptyVitaminTotals(),
    aminoAcidsByType: emptyAminoAcidTotals(),
    microbiomeSupport: [],
  };
};

export const extractStructuredAnalysis = (
  data: any,
  parsedContent: any
): ParsedMacroAnalysis | null => {
  const candidates = [
    data?.nutrition,
    data?.raw,
    data?.raw?.macros,
    data?.result,
    data?.result?.nutrition,
    data?.result?.raw,
    data?.result?.raw?.macros,
    parsedContent,
    parsedContent?.nutrition,
    parsedContent?.raw,
    parsedContent?.macros,
  ];

  for (const candidate of candidates) {
    const extracted = extractFromCandidate(candidate);
    if (extracted) return extracted;
  }

  if (typeof data?.content === 'string') {
    return extractFromText(data.content);
  }

  return null;
};

export const extractAIResponseDescription = (
  data: any,
  parsedContent: any
): string | null => {
  const candidates: unknown[] = [
    parsedContent?.description,
    parsedContent?.summary,
    parsedContent?.analysis,
    parsedContent?.reasoning,
    parsedContent?.observation,
    parsedContent?.observations,
    data?.description,
    data?.summary,
    data?.analysis,
    data?.reasoning,
    data?.observation,
    data?.observations,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }

    if (Array.isArray(candidate)) {
      const text = candidate
        .filter((item): item is string => typeof item === 'string')
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .join('\n');

      if (text.length > 0) return text;
    }
  }

  if (typeof data?.content === 'string') {
    const trimmed = data.content.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[') && trimmed.length > 0) {
      return trimmed;
    }
  }

  return null;
};

export const mergeWeeklyTrackingSignal = (
  target: WeeklyTrackingSignals,
  key: string,
  value: unknown
) => {
  if (!key || typeof key !== 'string') return;

  if (Array.isArray(value)) {
    // Convert all items to WeeklyTrackingItem
    const nextItems: WeeklyTrackingItem[] = value
      .map((item): WeeklyTrackingItem | null => {
        if (typeof item === 'object' && item && typeof item.en === 'string' && typeof item.local === 'string') {
          return { en: item.en, local: item.local };
        } else if (typeof item === 'string') {
          const norm = item.trim();
          return norm.length > 0 ? { en: norm, local: norm } : null;
        }
        return null;
      })
      .filter((item): item is WeeklyTrackingItem => !!item);

    if (!nextItems.length) return;

    const existing = target[key];
    const existingItems: WeeklyTrackingItem[] = Array.isArray(existing) ? existing : [];
    // Only add unique {en, local} pairs
    const all = [...existingItems, ...nextItems];
    const deduped = Array.from(new Map(all.map(i => [i.en + '|' + i.local, i])).values());
    target[key] = deduped;
    return;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const existing = target[key];
    const existingNumber = typeof existing === 'number' ? existing : 0;
    target[key] = existingNumber + value;
  }
};

export const extractWeeklyTrackingSignals = (
  data: any,
  parsedContent: any
): WeeklyTrackingSignals => {
  const collected: WeeklyTrackingSignals = {};

  const candidates = [
    data,
    data?.nutrition,
    data?.raw,
    data?.result,
    data?.result?.nutrition,
    data?.result?.raw,
    parsedContent,
    parsedContent?.nutrition,
    parsedContent?.raw,
  ];

  candidates.forEach((candidate, idx) => {
    try {
      console.log(`[extractWeeklyTrackingSignals] Kandidat #${idx}:`, candidate);
    } catch (e) {}
    const fromObject = candidate?.weeklyTrackingSignals;
    if (fromObject && typeof fromObject === 'object' && !Array.isArray(fromObject)) {
      try {
        console.log(`[extractWeeklyTrackingSignals] Kandidat #${idx} weeklyTrackingSignals:`, fromObject);
      } catch (e) {}
      Object.entries(fromObject).forEach(([key, value]) =>
        mergeWeeklyTrackingSignal(collected, key, value)
      );
    }

    let fromRows: any[] = [];
    if (Array.isArray(candidate?.weeklyTrackingSignals)) {
      fromRows = candidate.weeklyTrackingSignals;
    } else if (Array.isArray(candidate?.nutritionDetails?.weeklyTrackingSignals)) {
      fromRows = candidate.nutritionDetails.weeklyTrackingSignals;
    }

    fromRows.forEach((row: any) => {
      const key = String(row?.key ?? row?.trackingKey ?? '').trim();
      if (!key) return;

      if (Array.isArray(row?.items)) {
        mergeWeeklyTrackingSignal(collected, key, row.items);
      }

      const increment = parseNumberValue(
        row?.countIncrement ?? row?.increment ?? row?.count
      );
      if (increment !== null) {
        mergeWeeklyTrackingSignal(collected, key, increment);
      }
    });
  });

  try {
    console.log('[extractWeeklyTrackingSignals] Extraherade signals:', collected);
  } catch (e) {}

  return collected;
};

export const extractEvidence = (
  data: any,
  parsedContent: any
): NutritionEvidence => {
  const fromNutrition = data?.nutrition ?? {};
  const fromRaw = data?.raw ?? {};
  const fromParsed = parsedContent ?? {};

  const sources = [
    ...parseStringArray(fromNutrition.sources),
    ...parseStringArray(fromRaw.sources),
    ...parseStringArray(fromParsed.sources),
    ...parseStringArray(data?.sources),
    ...parseStringArray(fromNutrition.foodSources),
    ...parseStringArray(fromRaw.foodSources),
    ...parseStringArray(fromParsed.foodSources),
    ...parseStringArray(data?.foodSources),
    ...parseStringArray(fromNutrition.food_sources),
    ...parseStringArray(fromRaw.food_sources),
    ...parseStringArray(fromParsed.food_sources),
    ...parseStringArray(data?.food_sources),
    ...parseStringArray(fromNutrition.referenceSources),
    ...parseStringArray(fromRaw.referenceSources),
    ...parseStringArray(fromParsed.referenceSources),
    ...parseStringArray(data?.referenceSources),
    ...parseStringArray(fromNutrition.reference_sources),
    ...parseStringArray(fromRaw.reference_sources),
    ...parseStringArray(fromParsed.reference_sources),
    ...parseStringArray(data?.reference_sources),
  ];

  const inferred = [
    ...parseStringArray(fromNutrition.inferred),
    ...parseStringArray(fromRaw.inferred),
    ...parseStringArray(fromParsed.inferred),
    ...parseStringArray(data?.inferred),
    ...parseStringArray(fromNutrition.aiAssumptions),
    ...parseStringArray(fromRaw.aiAssumptions),
    ...parseStringArray(fromParsed.aiAssumptions),
    ...parseStringArray(data?.aiAssumptions),
    ...parseStringArray(fromNutrition.ai_assumptions),
    ...parseStringArray(fromRaw.ai_assumptions),
    ...parseStringArray(fromParsed.ai_assumptions),
    ...parseStringArray(data?.ai_assumptions),
  ];

  const nutritionConfidence = pickConfidence(
    fromNutrition.confidenceLabel,
    fromNutrition.confidence
  );
  const rawConfidence = pickConfidence(fromRaw.confidenceLabel, fromRaw.confidence);
  const parsedConfidence = pickConfidence(
    fromParsed.confidenceLabel,
    fromParsed.confidence
  );
  const rootConfidence = pickConfidence(data?.confidenceLabel, data?.confidence);

  let confidence: NutritionEvidence['confidence'] = 'unknown';

  if (nutritionConfidence !== 'unknown') {
    confidence = nutritionConfidence;
  } else if (rawConfidence !== 'unknown') {
    confidence = rawConfidence;
  } else if (parsedConfidence !== 'unknown') {
    confidence = parsedConfidence;
  } else if (rootConfidence !== 'unknown') {
    confidence = rootConfidence;
  }

  return {
    sources: Array.from(new Set(sources)),
    inferred: Array.from(new Set(inferred)),
    confidence,
  };
};

export const buildEvidenceMessage = (evidence: NutritionEvidence): string => {
  let confidenceLabel = 'Confidence okand';

  if (evidence.confidence === 'high') {
    confidenceLabel = 'Hog confidence';
  } else if (evidence.confidence === 'medium') {
    confidenceLabel = 'Medium confidence';
  } else if (evidence.confidence === 'low') {
    confidenceLabel = 'Lag confidence';
  }

  const sourceLine = evidence.sources.length
    ? `Source-backed: ${evidence.sources.join(', ')}`
    : 'Source-backed: inga explicita kallor angavs';

  const inferredLine = evidence.inferred.length
    ? `AI-inferred: ${evidence.inferred.join(', ')}`
    : 'AI-inferred: inga extra inferenser angavs';

  return `${confidenceLabel}\n${sourceLine}\n${inferredLine}`;
};

export const extractAndValidateNutritionAnalysis = ({
  data,
  t,
  activeTrackingKeys,
  setAnalysisResult,
  setPendingAnalysisReview,
  setIsAnalysisReviewModalVisible,
  setLastLoggedMeal,
}: {
  data: any;
  t: any;
  activeTrackingKeys: Set<string>;
  setAnalysisResult: (val: any) => void;
  setPendingAnalysisReview: (val: any) => void;
  setIsAnalysisReviewModalVisible: (val: boolean) => void;
  setLastLoggedMeal: (val: any) => void;
}) => {
  let analysis: ParsedMacroAnalysis | null = null;
  let parsedContent: any = null;

  if (data?.content) {
    try {
      parsedContent = JSON.parse(data.content);
    } catch {
      // Not JSON
    }
  }

  analysis = extractStructuredAnalysis(data, parsedContent);
  const typedTotals = extractTypedTotals(data, parsedContent);
  const microbiomeSupport = extractMicrobiomeSupport(data, parsedContent);
  const aiWeeklyTrackingSignals = extractWeeklyTrackingSignals(data, parsedContent);
  const aiResponseDescription = extractAIResponseDescription(data, parsedContent);
  const evidence = extractEvidence(data, parsedContent);
  const evidenceMessage = buildEvidenceMessage(evidence);

  if (!analysis) {
    handleNoStructuredData({
      data,
      t,
      setAnalysisResult,
      setPendingAnalysisReview,
      setIsAnalysisReviewModalVisible,
      evidence,
      aiResponseDescription,
      evidenceMessage,
    });
    return null;
  }

  analysis = {
    ...analysis,
    mealName: analysis.mealName || t('nutritionLogger.unnamedMeal'),
    fiberByType: typedTotals.fiberByType,
    fiberSubtypeTotals: typedTotals.fiberSubtypeTotals,
    polyphenolByType: typedTotals.polyphenolByType,
    mineralsByType: typedTotals.mineralsByType,
    mineralsConfidenceByType: typedTotals.mineralsConfidenceByType,
    vitaminsByType: typedTotals.vitaminsByType,
    aminoAcidsByType: typedTotals.aminoAcidsByType,
    microbiomeSupport,
  };

  const hasMacroData = !(
    analysis.protein === 0 &&
    analysis.calories === 0 &&
    analysis.carbohydrates === 0 &&
    analysis.fat === 0 &&
    analysis.fiber === 0
  );

  const hasTypedNutritionData =
    hasAnyTypedTotals(typedTotals.fiberByType) ||
    hasAnyTypedTotals(typedTotals.fiberSubtypeTotals) ||
    hasAnyTypedTotals(typedTotals.polyphenolByType) ||
    hasAnyTypedTotals(typedTotals.mineralsByType) ||
    hasAnyTypedTotals(typedTotals.vitaminsByType) ||
    hasAnyTypedTotals(typedTotals.aminoAcidsByType);

  const hasMicrobiomeData = microbiomeSupport.length > 0;
  const hasTrackingSignals = Object.keys(aiWeeklyTrackingSignals).length > 0;

  if (!hasMacroData && !hasTypedNutritionData && !hasMicrobiomeData && !hasTrackingSignals) {
    handleNoMacroData({
      data,
      t,
      setAnalysisResult,
      setPendingAnalysisReview,
      setIsAnalysisReviewModalVisible,
      analysis,
      evidence,
      aiResponseDescription,
      evidenceMessage,
      setLastLoggedMeal,
    });
    return null;
  }

  const mergedSignals: Record<string, any> = {};
  Object.entries(aiWeeklyTrackingSignals).forEach(([key, value]) => {
    mergeWeeklyTrackingSignal(mergedSignals, key, value);
  });

  const mealWeeklyTrackingSignals = Object.entries(mergedSignals)
    .filter(([key]) => activeTrackingKeys.has(key))
    .reduce((acc: Record<string, any>, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  return {
    analysis,
    mealWeeklyTrackingSignals,
    evidence,
    aiResponseDescription,
    evidenceMessage,
  };
};

export const roundToOneDecimal = (value: number): number =>
  Math.round((value + Number.EPSILON) * 10) / 10;