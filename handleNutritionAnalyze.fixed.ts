type ConfidenceLabel = 'high' | 'medium' | 'low' | 'unknown';
type FiberSubtypeTag =
  | 'beta_glucans'
  | 'pectin'
  | 'psyllium'
  | 'mucilage'
  | 'cellulose'
  | 'hemicellulose'
  | 'lignin'
  | 'arabinoxylan'
  | 'resistant_starch'
  | 'inulin'
  | 'fructooligosaccharides'
  | 'galactooligosaccharides'
  | 'pectic_oligosaccharides';

type VitaminTargetTag =
  | 'vitamins_total'
  | 'vitamin_a'
  | 'vitamin_c'
  | 'vitamin_d'
  | 'vitamin_e'
  | 'vitamin_k'
  | 'vitamin_b1'
  | 'vitamin_b2'
  | 'vitamin_b3'
  | 'vitamin_b5'
  | 'vitamin_b6'
  | 'vitamin_b7'
  | 'vitamin_b9'
  | 'vitamin_b12';

type EssentialAminoAcidTag =
  | 'histidine'
  | 'isoleucine'
  | 'leucine'
  | 'lysine'
  | 'methionine'
  | 'phenylalanine'
  | 'threonine'
  | 'tryptophan'
  | 'valine';

type OtherAminoAcidTag =
  | 'arginine'
  | 'cysteine'
  | 'glutamine'
  | 'glycine'
  | 'proline'
  | 'tyrosine'
  | 'citrulline';

type AminoAcidTag = EssentialAminoAcidTag | OtherAminoAcidTag;

export interface NutritionAnalysisResponse {
  type: 'match_result' | 'text' | 'nutrition' | 'error';
  content?: string;
  mealName?: string;
  match?: boolean;
  confidence?: number;
  confidenceLabel?: ConfidenceLabel;
  raw?: any;
  foodSources?: string[];
  aiAssumptions?: string[];
  referenceSources?: string[];
  // Backward-compatible aliases for current frontend parsing
  sources?: string[];
  inferred?: string[];
    weeklyTrackingSignals?: Record<string, Array<{ en: string; local: string }> | number> | Array<{
      key: string;
      items?: Array<{ en: string; local: string }>;
      countIncrement?: number;
    }>;
  nutritionDetails?: {
    fiber?: {
      total?: number;
      gelForming?: number;
      nonGelForming?: number;
      fermentable?: number;
      subtypes?: Array<{
        subtype: FiberSubtypeTag;
        amountG?: number;
        likelySources?: string[];
      }>;
      unit?: 'g';
    };
    flavonoids?: {
      totalMg?: number;
      classes?: Array<{
        name: string;
        amountMg?: number;
        likelySources?: string[];
      }>;
    };
    polyphenols?: {
      totalMg?: number;
      likelySources?: string[];
    };
    minerals?: {
      totalMg?: number;
      sodium?: number;
      potassium?: number;
      magnesium?: number;
      calcium?: number;
      iron?: number;
      zinc?: number;
      selenium?: number;
      iodine?: number;
      phosphorus?: number;
      copper?: number;
      manganese?: number;
    };
    vitamins?: {
      totalMg?: number;
      vitamin_a?: number;
      vitamin_c?: number;
      vitamin_d?: number;
      vitamin_e?: number;
      vitamin_k?: number;
      vitamin_b1?: number;
      vitamin_b2?: number;
      vitamin_b3?: number;
      vitamin_b5?: number;
      vitamin_b6?: number;
      vitamin_b7?: number;
      vitamin_b9?: number;
      vitamin_b12?: number;
    };
    microbiomeSupport?: Array<{
      microbe: string;
      supportLevel: ConfidenceLabel;
      linkedNutrients?: string[];
      likelyFoods?: string[];
      rationale?: string;
    }>;
    aminoAcids?: {
      items?: Array<{
        name: AminoAcidTag;
        amountMg?: number;
        likelySources?: string[];
      }>;
    };
  };
  aminoAcidsByType?: Record<AminoAcidTag, number>;
  vitaminsByType?: Record<VitaminTargetTag, number>;
  nutrition?: {
    mealName?: string;
    protein?: number;
    calories?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    [k: string]: any;
  };
  message?: string;
}

type HandleOpts = {
  rawBuffer?: Buffer;
  file_base64?: string;
  mime?: string;
  filename?: string;
  ingredientListRawBuffer?: Buffer;
  ingredientListBase64?: string;
  ingredientListMime?: string;
  mealDescription?: string;
  prompt?: string;
  supplement?: string;
  locale?: 'sv' | 'en';
  trackingTargets?: Array<{ key: string; unit: 'items' | 'count'; amount?: number; aiInstruction?: string }>;
};

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const roundNumber = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const roundMacroGrams = (value: number): number => roundNumber(value, 1);
const roundCalories = (value: number): number => roundNumber(value, 0);

const normalizeNutrition = (args: any) => ({
  protein: roundMacroGrams(Number(args?.protein ?? 0)),
  calories: roundCalories(Number(args?.calories ?? args?.kcal ?? 0)),
  carbohydrates: roundMacroGrams(Number(args?.carbohydrates ?? args?.carbs ?? 0)),
  fat: roundMacroGrams(Number(args?.fat ?? 0)),
  fiber: roundMacroGrams(Number(args?.fiber ?? args?.fibre ?? 0)),
});

const normalizeNumber = (value: any): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) ? roundNumber(n) : undefined;
};

const FIBER_SUBTYPE_TAGS = new Set<FiberSubtypeTag>([
  'beta_glucans',
  'pectin',
  'psyllium',
  'mucilage',
  'cellulose',
  'hemicellulose',
  'lignin',
  'arabinoxylan',
  'resistant_starch',
  'inulin',
  'fructooligosaccharides',
  'galactooligosaccharides',
  'pectic_oligosaccharides',
]);

const GEL_FORMING_SUBTYPES: FiberSubtypeTag[] = ['beta_glucans', 'pectin', 'psyllium', 'mucilage'];
const NON_GEL_FORMING_SUBTYPES: FiberSubtypeTag[] = ['cellulose', 'hemicellulose', 'lignin', 'arabinoxylan'];
const FERMENTABLE_SUBTYPES: FiberSubtypeTag[] = [
  'resistant_starch',
  'inulin',
  'fructooligosaccharides',
  'galactooligosaccharides',
  'pectic_oligosaccharides',
  'beta_glucans',
  'pectin',
  'mucilage',
];

const VITAMIN_TAGS = new Set<VitaminTargetTag>([
  'vitamins_total',
  'vitamin_a',
  'vitamin_c',
  'vitamin_d',
  'vitamin_e',
  'vitamin_k',
  'vitamin_b1',
  'vitamin_b2',
  'vitamin_b3',
  'vitamin_b5',
  'vitamin_b6',
  'vitamin_b7',
  'vitamin_b9',
  'vitamin_b12',
]);

const ESSENTIAL_AMINO_ACID_TAGS: EssentialAminoAcidTag[] = [
  'histidine', 'isoleucine', 'leucine', 'lysine', 'methionine',
  'phenylalanine', 'threonine', 'tryptophan', 'valine',
];

const OTHER_AMINO_ACID_TAGS: OtherAminoAcidTag[] = [
  'arginine', 'cysteine', 'glutamine', 'glycine', 'proline', 'tyrosine',
];

const ALL_AMINO_ACID_TAGS: AminoAcidTag[] = [...ESSENTIAL_AMINO_ACID_TAGS, ...OTHER_AMINO_ACID_TAGS];
const AMINO_ACID_TAG_SET = new Set<AminoAcidTag>(ALL_AMINO_ACID_TAGS);
const isAminoAcidTag = (value: any): value is AminoAcidTag => AMINO_ACID_TAG_SET.has(value as AminoAcidTag);

const isVitaminTag = (value: any): value is VitaminTargetTag => VITAMIN_TAGS.has(value as VitaminTargetTag);

const isFiberSubtypeTag = (value: any): value is FiberSubtypeTag => FIBER_SUBTYPE_TAGS.has(value as FiberSubtypeTag);
const sumSubtypeGroup = (
  subtypes: Array<{ subtype: FiberSubtypeTag; amountG?: number }>,
  group: FiberSubtypeTag[]
): number => {
  return subtypes.reduce((acc, item) => {
    if (!group.includes(item.subtype)) return acc;
    return acc + (item.amountG ?? 0);
  }, 0);
};

const normalizeMicrobeSupportLevel = (value: any): ConfidenceLabel => {
  const normalized = String(value ?? '').toLowerCase().trim();
  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') return normalized;
  return 'unknown';
};

const toStringArray = (value: any): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
};

const dedupe = (values: string[]): string[] => Array.from(new Set(values));

  type WeeklyTrackingItem = { en: string; local: string };

  const normalizeWeeklyTrackingSignals = (args: any): Record<string, WeeklyTrackingItem[] | number> => {
    const signals: Record<string, WeeklyTrackingItem[] | number> = {};

    const pushRow = (keyRaw: unknown, itemsRaw: unknown, countRaw: unknown) => {
      if (typeof keyRaw !== 'string') return;
      const key = keyRaw.trim();
      if (!key) return;

      // FIX: Om itemsRaw är en sträng, försök parsa till array
      let itemsParsed = itemsRaw;
      if (typeof itemsRaw === 'string') {
        try {
          const parsed = JSON.parse(itemsRaw);
          if (Array.isArray(parsed)) {
            itemsParsed = parsed;
          }
        } catch (e) {
          // behåll som sträng om det inte går att parsa
        }
      }

      // Accept only new {en,local}[] format
      let items: WeeklyTrackingItem[] = [];
      if (Array.isArray(itemsParsed)) {
        items = itemsParsed
          .map((item: any) => {
            if (typeof item === 'object' && item && typeof item.en === 'string' && typeof item.local === 'string') {
              return { en: item.en.trim(), local: item.local.trim() };
            }
            return null;
          })
          .filter((item): item is WeeklyTrackingItem => !!item && item.en.length > 0 && item.local.length > 0);
        // dedupe by en/local tuple
        items = Array.from(new Map(items.map(i => [i.en + '|' + i.local, i])).values());
      }
      const count = normalizeNumber(countRaw);

      if (items.length === 0 && count === undefined) return;

      if (items.length > 0) {
        signals[key] = items;
      } else if (count !== undefined) {
        signals[key] = count;
      }
    };

    const raw = args?.weeklyTrackingSignals;
    if (Array.isArray(raw)) {
      raw.forEach((row: any) => {
        pushRow(row?.key ?? row?.trackingKey, row?.items, row?.countIncrement ?? row?.increment ?? row?.count);
      });
    } else if (raw && typeof raw === 'object') {
      Object.entries(raw).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          pushRow(key, value, undefined);
        } else {
          pushRow(key, undefined, value);
        }
      });
    }

    // LOGGA DETALJERAT
    try {
      // Visa alla keys och en tydlig förhandsvisning av items
      const debug = Object.entries(signals).map(([key, value]) => ({
        key,
        items: Array.isArray(value)
          ? value.slice(0, 3).map((item: any) =>
              typeof item === 'object' && item !== null
                ? `{en: ${item.en}, local: ${item.local}}`
                : String(item)
            )
          : undefined,
        count: typeof value === 'number' ? value : undefined
      }));
      console.log('[normalizeWeeklyTrackingSignals] Result:', debug);
    } catch (e) {
      console.log('[normalizeWeeklyTrackingSignals] Log error:', e);
    }

    return signals;
  };

const normalizeNutritionDetails = (args: any): NutritionAnalysisResponse['nutritionDetails'] => {
  const fiberRaw = args?.fiberDetails ?? args?.fiber_breakdown ?? {};
  const flavRaw = args?.flavonoids ?? {};
  const polyRaw = args?.polyphenols ?? {};
  const mineralsRaw = args?.minerals ?? {};
  const vitaminsRaw = args?.vitamins ?? {};
  const microRaw = Array.isArray(args?.microbiomeSupport) ? args.microbiomeSupport : [];

  const classes = Array.isArray(flavRaw?.classes)
    ? flavRaw.classes
        .map((item: any) => ({
          name: String(item?.name ?? '').trim(),
          amountMg: normalizeNumber(item?.amountMg ?? item?.amount_mg),
        }))
        .filter((item: any) => item.name.length > 0)
    : [];

  const microbiomeSupport = microRaw
    .map((item: any) => ({
      microbe: String(item?.microbe ?? '').trim(),
      supportLevel: normalizeMicrobeSupportLevel(item?.supportLevel ?? item?.support_level),
      linkedNutrients: dedupe(toStringArray(item?.linkedNutrients ?? item?.linked_nutrients)),
      likelyFoods: dedupe(toStringArray(item?.likelyFoods ?? item?.likely_foods)),
      rationale: typeof item?.rationale === 'string' ? item.rationale : undefined,
    }))
    .filter((item: any) => item.microbe.length > 0);

  let subtypeArrayRaw: any[] = [];
  if (Array.isArray(fiberRaw?.subtypes)) {
    subtypeArrayRaw = fiberRaw.subtypes;
  } else if (Array.isArray(fiberRaw?.fiberSubtypes)) {
    subtypeArrayRaw = fiberRaw.fiberSubtypes;
  }

  let subtypes = subtypeArrayRaw
    .map((item: any) => {
      const subtype = String(item?.subtype ?? item?.name ?? '').trim();
      if (!isFiberSubtypeTag(subtype)) return null;
      return {
        subtype,
        amountG: normalizeNumber(item?.amountG ?? item?.amount_g ?? item?.amount),
        likelySources: dedupe(toStringArray(item?.likelySources ?? item?.likely_sources)),
      };
    })
    .filter((item: any) => item !== null) as Array<{
      subtype: FiberSubtypeTag;
      amountG?: number;
      likelySources?: string[];
    }>;
  const gelFromSubtypes = sumSubtypeGroup(subtypes, GEL_FORMING_SUBTYPES);
  const nonGelFromSubtypes = sumSubtypeGroup(subtypes, NON_GEL_FORMING_SUBTYPES);
  const fermentableFromSubtypes = sumSubtypeGroup(subtypes, FERMENTABLE_SUBTYPES);

  const gelForming = normalizeNumber(fiberRaw?.gelForming ?? fiberRaw?.gel_forming);
  const nonGelForming = normalizeNumber(fiberRaw?.nonGelForming ?? fiberRaw?.non_gel_forming);
  const fermentable = normalizeNumber(fiberRaw?.fermentable);

  return {
    fiber: {
      total: normalizeNumber(fiberRaw?.total ?? args?.fiber),
      gelForming: gelForming ?? (gelFromSubtypes > 0 ? gelFromSubtypes : undefined),
      nonGelForming: nonGelForming ?? (nonGelFromSubtypes > 0 ? nonGelFromSubtypes : undefined),
      fermentable: fermentable ?? (fermentableFromSubtypes > 0 ? fermentableFromSubtypes : undefined),
      subtypes,
      unit: 'g',
    },
    flavonoids: {
      totalMg: normalizeNumber(flavRaw?.totalMg ?? flavRaw?.total_mg),
      classes,
    },
    polyphenols: {
      totalMg: normalizeNumber(polyRaw?.totalMg ?? polyRaw?.total_mg),
      likelySources: dedupe(toStringArray(polyRaw?.likelySources ?? polyRaw?.likely_sources)),
    },
    minerals: {
      totalMg: normalizeNumber(mineralsRaw?.totalMg ?? mineralsRaw?.total_mg),
      sodium: normalizeNumber(mineralsRaw?.sodium),
      potassium: normalizeNumber(mineralsRaw?.potassium),
      magnesium: normalizeNumber(mineralsRaw?.magnesium),
      calcium: normalizeNumber(mineralsRaw?.calcium),
      iron: normalizeNumber(mineralsRaw?.iron),
      zinc: normalizeNumber(mineralsRaw?.zinc),
      selenium: normalizeNumber(mineralsRaw?.selenium),
      iodine: normalizeNumber(mineralsRaw?.iodine),
      phosphorus: normalizeNumber(mineralsRaw?.phosphorus),
      copper: normalizeNumber(mineralsRaw?.copper),
      manganese: normalizeNumber(mineralsRaw?.manganese),
    },
    vitamins: {
      totalMg: normalizeNumber(vitaminsRaw?.totalMg ?? vitaminsRaw?.total_mg),
      vitamin_a: normalizeNumber(vitaminsRaw?.vitamin_a),
      vitamin_c: normalizeNumber(vitaminsRaw?.vitamin_c),
      vitamin_d: normalizeNumber(vitaminsRaw?.vitamin_d),
      vitamin_e: normalizeNumber(vitaminsRaw?.vitamin_e),
      vitamin_k: normalizeNumber(vitaminsRaw?.vitamin_k),
      vitamin_b1: normalizeNumber(vitaminsRaw?.vitamin_b1),
      vitamin_b2: normalizeNumber(vitaminsRaw?.vitamin_b2),
      vitamin_b3: normalizeNumber(vitaminsRaw?.vitamin_b3),
      vitamin_b5: normalizeNumber(vitaminsRaw?.vitamin_b5),
      vitamin_b6: normalizeNumber(vitaminsRaw?.vitamin_b6),
      vitamin_b7: normalizeNumber(vitaminsRaw?.vitamin_b7),
      vitamin_b9: normalizeNumber(vitaminsRaw?.vitamin_b9),
      vitamin_b12: normalizeNumber(vitaminsRaw?.vitamin_b12),
    },
    microbiomeSupport,
  };
};

const normalizeAminoAcids = (args: any): Record<AminoAcidTag, number> | undefined => {
  const raw = args?.aminoAcids;
  if (!raw || typeof raw !== 'object') return undefined;

  const result: Partial<Record<AminoAcidTag, number>> = {};

  // Direct flat map: aminoAcids.histidine = 120
  ALL_AMINO_ACID_TAGS.forEach(tag => {
    const val = normalizeNumber(raw[tag]);
    if (val !== undefined) result[tag] = val;
  });

  // Structured list: aminoAcids.items[]
  const items = Array.isArray(raw?.items) ? raw.items : [];
  items.forEach((item: any) => {
    const name = String(item?.name ?? '').toLowerCase().trim();
    if (!isAminoAcidTag(name)) return;
    const val = normalizeNumber(item?.amountMg ?? item?.amount_mg ?? item?.amount);
    if (val !== undefined) result[name] = val;
  });

  if (Object.keys(result).length === 0) return undefined;
  return result as Record<AminoAcidTag, number>;
};

const normalizeVitamins = (args: any): Record<VitaminTargetTag, number> | undefined => {
  const raw = args?.vitamins;
  if (!raw || typeof raw !== 'object') return undefined;

  const result: Partial<Record<VitaminTargetTag, number>> = {};

  VITAMIN_TAGS.forEach(tag => {
    const val = normalizeNumber(raw[tag]);
    if (val !== undefined) result[tag] = val;
  });

  const items = Array.isArray(raw?.items) ? raw.items : [];
  items.forEach((item: any) => {
    const name = String(item?.name ?? '').toLowerCase().trim();
    if (!isVitaminTag(name)) return;
    const val = normalizeNumber(item?.amountMg ?? item?.amount_mg ?? item?.amount);
    if (val !== undefined) result[name] = val;
  });

  if (Object.keys(result).length === 0) return undefined;
  return result as Record<VitaminTargetTag, number>;
};

const confidenceToLabel = (value: number): ConfidenceLabel => {
  if (!Number.isFinite(value)) return 'unknown';
  if (value >= 0.8) return 'high';
  if (value >= 0.5) return 'medium';
  if (value > 0) return 'low';
  return 'unknown';
};

const errorToMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
};

const buildHeaders = () => ({
  Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
  'Content-Type': 'application/json',
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const tryPostOnce = async (payload: any) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    return { response, data };
  } finally {
    clearTimeout(timeout);
  }
};

const shouldRetry = (status: number | null, errorMessage: string): boolean => {
  const msg = errorMessage.toLowerCase();

  if (msg.includes('socket hang up') || msg.includes('timeout')) return true;
  if (status === null) return true;
  if (status >= 500 || status === 429) return true;

  return false;
};

const postWithRetries = async (payload: any, maxRetries = 2) => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { response, data } = await tryPostOnce(payload);

      if (!response.ok) {
        const message = (data?.error?.message as string | undefined) ?? `HTTP ${response.status}`;
        if (attempt === maxRetries || !shouldRetry(response.status, message)) {
          throw new Error(message);
        }
        const backoff = Math.min(8000, 400 * 2 ** attempt);
        await delay(backoff);
        continue;
      }

      return { data };
    } catch (e: unknown) {
      lastError = e;
      const msg = errorToMessage(e);
      if (attempt === maxRetries || !shouldRetry(null, msg)) throw e;
      const backoff = Math.min(8000, 400 * 2 ** attempt);
      await delay(backoff);
    }
  }

  throw lastError;
};

export async function handleNutritionAnalyze(
  messages: any[],
  opts: HandleOpts = {}
): Promise<NutritionAnalysisResponse> {
  try {
    const configuredTrackingTargets = Array.isArray(opts.trackingTargets) ? opts.trackingTargets : [];
    const hasTrackingTargets = configuredTrackingTargets.length > 0;
    const allowedWeeklyTrackingKeys = new Set(
      configuredTrackingTargets
        .map(target => (typeof target?.key === 'string' ? target.key.trim() : ''))
        .filter(key => key.length > 0)
    );

    let buffer: Buffer | undefined;
    let mimeType = opts.mime ?? 'image/jpeg';
    let ingredientListBuffer: Buffer | undefined;
    let ingredientListMimeType = opts.ingredientListMime ?? 'image/jpeg';

    if (opts.file_base64) {
      const raw = opts.file_base64.includes(',') ? opts.file_base64.split(',')[1] : opts.file_base64;
      buffer = Buffer.from(raw, 'base64');
    } else if (opts.rawBuffer) {
      buffer = opts.rawBuffer;
    } else {
      return { type: 'error', message: 'No file data provided', content: 'No file data provided' };
    }

    if (opts.ingredientListBase64) {
      const raw = opts.ingredientListBase64.includes(',')
        ? opts.ingredientListBase64.split(',')[1]
        : opts.ingredientListBase64;
      ingredientListBuffer = Buffer.from(raw, 'base64');
    } else if (opts.ingredientListRawBuffer) {
      ingredientListBuffer = opts.ingredientListRawBuffer;
    }

    if (!buffer || buffer.length === 0) {
      return { type: 'error', message: 'No image data' };
    }

    if (buffer.length > MAX_IMAGE_BYTES) {
      const mb = Math.round((buffer.length / (1024 * 1024)) * 10) / 10;
      return {
        type: 'error',
        message: `Image too large (${mb} MB). Max is 4 MB.`,
      };
    }

    if (!mimeType.startsWith('image/')) {
      mimeType = 'image/jpeg';
    }

    if (ingredientListBuffer && !ingredientListMimeType.startsWith('image/')) {
      ingredientListMimeType = 'image/jpeg';
    }

    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    const ingredientListDataUrl = ingredientListBuffer
      ? `data:${ingredientListMimeType};base64,${ingredientListBuffer.toString('base64')}`
      : null;

    const contextSuffix = opts.supplement ? ` (context: ${opts.supplement})` : '';
    const locale = opts.locale ?? 'sv';
    const mealDescription = typeof opts.mealDescription === 'string' ? opts.mealDescription.trim() : '';
    const responseLanguageInstruction =
      locale === 'sv'
        ? 'Write all free-text fields in Swedish (for example: aiAssumptions, rationale, and referenceSources notes).'
        : 'Write all free-text fields in English (for example: aiAssumptions, rationale, and referenceSources notes).';
    const mealDescriptionHint = mealDescription.length > 0
      ? `\n  - User-provided meal description: "${mealDescription}". Treat this only as a hint and only use it when it matches the visible food in the image(s).`
      : '';

    const weeklyTrackingPromptSection = hasTrackingTargets
      ? [
          '- Return weeklyTrackingSignals[] for dynamic weekly goals. Use key + either items[] (for unique lists) or countIncrement (for counters).',
          '- Only use keys from trackingTargets (JSON below).',
          `- trackingTargets: ${JSON.stringify(configuredTrackingTargets)}`,
          '- Example weeklyTrackingSignals rows: {"key":"unique_plants","items":["spinach","lentils"]}, {"key":"fish_meals","countIncrement":1}.',
        ].join('\n  ')
      : '- Do not return weeklyTrackingSignals when trackingTargets is not provided.';

    const extractionPrompt = `Analyze ONLY what can be directly observed in the provided image(s). The first image is the meal or food item. If a second image is included, it is an ingredient list, packaging label, or contents declaration for the same product and should be used as additional evidence for ingredients and nutrient estimation. Extract nutritional values (protein, calories, carbohydrates, fat, fiber) and detailed nutrition and microbiome support.
  Language:
  - ${responseLanguageInstruction}
  Rules:
  - Return mealName as a short, human-readable meal label (2-6 words, e.g. "Chicken salad bowl" or "Overnight oats with berries").
  - Identify concrete foodSources visible in the image(s) (e.g. oats, berries, chicken).
  ${mealDescriptionHint}
  - Keep output concise to reduce response size and latency.
  - Limit aiAssumptions to max 4 short strings.
  - Limit referenceSources to max 3 short strings.
  - For likelySources arrays, include max 2 short items per field.
  - Limit microbiomeSupport to max 3 entries.
  - When a package label or ingredient list is present, use it to improve ingredient identification and nutrient confidence, but do not invent values that are not visible or reasonably inferable from the provided images.
  - Do not use generic statements like "typical nutritional values for similar dishes".
  - If uncertain: set analysisMode='estimated', confidenceLabel='low', and list aiAssumptions with what was assumed.
  - If no basis at all: set analysisMode='fallback', confidenceLabel='unknown', and empty foodSources.
  - Return fiberDetails: total, gelForming, nonGelForming, fermentable (grams where possible).
  - ALWAYS return fiberDetails.subtypes[] with subtype (beta_glucans, pectin, psyllium, mucilage, cellulose, hemicellulose, lignin, arabinoxylan, resistant_starch, inulin, fructooligosaccharides, galactooligosaccharides, pectic_oligosaccharides), amountG and likelySources.
  - amountG per subtype must be meal-level (not daily) and should sum reasonably against fiberDetails.total.
  - Return flavonoids: totalMg + classes[] with name (e.g. anthocyanins, flavonols, flavanols, catechins) and likelySources.
  - Return polyphenols: totalMg + likelySources.
  - Return minerals: totalMg and meal-level amounts in mg for sodium, potassium, magnesium, calcium, iron, zinc, selenium, iodine, phosphorus, copper, manganese.
  - Do not return minerals.items[]; return only minerals scalar fields.
  - Return vitamins: totalMg and meal-level amounts in mg for vitamin_a, vitamin_c, vitamin_d, vitamin_e, vitamin_k, vitamin_b1, vitamin_b2, vitamin_b3, vitamin_b5, vitamin_b6, vitamin_b7, vitamin_b9, vitamin_b12.
  - Do not return vitamins.items[]; return only vitamins scalar fields.
  - Return aminoAcids as scalar fields by amino acid key (histidine, isoleucine, leucine, lysine, methionine, phenylalanine, threonine, tryptophan, valine, arginine, cysteine, glutamine, glycine, proline, tyrosine). Do not return aminoAcids.items[].
  ${weeklyTrackingPromptSection}
  - Return microbiomeSupport[] with microbe, supportLevel, linkedNutrients, likelyFoods, rationale.
  - Always return confidenceLabel, analysisMode, foodSources, aiAssumptions, referenceSources.
  ${opts.prompt ?? ''}${contextSuffix}`;

    const userContent: Array<any> = [
      { type: 'image_url', image_url: { url: dataUrl } },
    ];

    if (ingredientListDataUrl) {
      userContent.push({ type: 'image_url', image_url: { url: ingredientListDataUrl } });
    }

    userContent.push(
      {
        type: 'text',
        text: extractionPrompt,
      },
    );

    const fullMessages = [
      ...messages,
      {
        role: 'user',
        content: userContent,
      },
    ];

    const functions = [
      {
        name: 'extractNutrition',
        description: 'Returnerar strukturerad naringsdata for bilden',
        parameters: {
          type: 'object',
          properties: {
            mealName: { type: 'string' },
            protein: { type: 'number' },
            calories: { type: 'number' },
            carbohydrates: { type: 'number' },
            fat: { type: 'number' },
            fiber: { type: 'number' },
            confidence: { type: 'number' },
            confidenceLabel: { type: 'string', enum: ['high', 'medium', 'low', 'unknown'] },
            analysisMode: { type: 'string', enum: ['observed', 'estimated', 'fallback'] },
            foodSources: { type: 'array', items: { type: 'string' } },
            aiAssumptions: { type: 'array', items: { type: 'string' } },
            referenceSources: { type: 'array', items: { type: 'string' } },
            fiberDetails: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                gelForming: { type: 'number' },
                nonGelForming: { type: 'number' },
                fermentable: { type: 'number' },
                subtypes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      subtype: {
                        type: 'string',
                        enum: [
                          'beta_glucans',
                          'pectin',
                          'psyllium',
                          'mucilage',
                          'cellulose',
                          'hemicellulose',
                          'lignin',
                          'arabinoxylan',
                          'resistant_starch',
                          'inulin',
                          'fructooligosaccharides',
                          'galactooligosaccharides',
                          'pectic_oligosaccharides',
                        ],
                      },
                      amountG: { type: 'number' },
                      likelySources: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['subtype', 'amountG'],
                  },
                },
              },
            },
            flavonoids: {
              type: 'object',
              properties: {
                totalMg: { type: 'number' },
                classes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      amountMg: { type: 'number' },
                      likelySources: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['name'],
                  },
                },
              },
            },
            polyphenols: {
              type: 'object',
              properties: {
                totalMg: { type: 'number' },
                likelySources: { type: 'array', items: { type: 'string' } },
              },
            },
            minerals: {
              type: 'object',
              properties: {
                totalMg: { type: 'number' },
                sodium: { type: 'number' },
                potassium: { type: 'number' },
                magnesium: { type: 'number' },
                calcium: { type: 'number' },
                iron: { type: 'number' },
                zinc: { type: 'number' },
                selenium: { type: 'number' },
                iodine: { type: 'number' },
                phosphorus: { type: 'number' },
                copper: { type: 'number' },
                manganese: { type: 'number' },
              },
            },
            vitamins: {
              type: 'object',
              properties: {
                totalMg: { type: 'number' },
                vitamin_a: { type: 'number' },
                vitamin_c: { type: 'number' },
                vitamin_d: { type: 'number' },
                vitamin_e: { type: 'number' },
                vitamin_k: { type: 'number' },
                vitamin_b1: { type: 'number' },
                vitamin_b2: { type: 'number' },
                vitamin_b3: { type: 'number' },
                vitamin_b5: { type: 'number' },
                vitamin_b6: { type: 'number' },
                vitamin_b7: { type: 'number' },
                vitamin_b9: { type: 'number' },
                vitamin_b12: { type: 'number' },
              },
            },
            fiberTargets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tag: { type: 'string', enum: ['fiber_total', 'fiber_gel_forming', 'fiber_non_gel_forming', 'fiber_fermentable'] },
                  amount: { type: 'number' },
                  unit: { type: 'string', enum: ['g'] },
                },
                required: ['tag', 'amount', 'unit'],
              },
            },
            weeklyTrackingSignals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  items: { type: 'array', items: { type: 'string' } },
                  countIncrement: { type: 'number' },
                },
                required: ['key'],
              },
            },
            microbiomeSupport: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  microbe: { type: 'string' },
                  supportLevel: { type: 'string', enum: ['high', 'medium', 'low', 'unknown'] },
                  linkedNutrients: { type: 'array', items: { type: 'string' } },
                  likelyFoods: { type: 'array', items: { type: 'string' } },
                  rationale: { type: 'string' },
                },
                required: ['microbe', 'supportLevel'],
              },
            },
            aminoAcids: {
              type: 'object',
              properties: {
                histidine: { type: 'number' },
                isoleucine: { type: 'number' },
                leucine: { type: 'number' },
                lysine: { type: 'number' },
                methionine: { type: 'number' },
                phenylalanine: { type: 'number' },
                threonine: { type: 'number' },
                tryptophan: { type: 'number' },
                valine: { type: 'number' },
                arginine: { type: 'number' },
                cysteine: { type: 'number' },
                glutamine: { type: 'number' },
                glycine: { type: 'number' },
                proline: { type: 'number' },
                tyrosine: { type: 'number' },
              },
            },
            notes: { type: 'string' },
          },
          required: ['mealName', 'protein', 'calories', 'confidenceLabel', 'analysisMode', 'foodSources', 'aiAssumptions', 'referenceSources', 'fiberDetails'],
        },
      },
    ];

    const res = await postWithRetries({
      model: 'gpt-5-mini',
      messages: fullMessages,
      functions,
      function_call: 'auto',
    }, 2);

    const choice = res.data?.choices?.[0];
    if (!choice) {
      return {
        type: 'error',
        message: 'No choice from OpenAI',
        raw: {
          reason: 'no_choice',
        },
      };
    }

    if (choice.finish_reason === 'function_call' && choice.message?.function_call) {
      let args: any = {};
      try {
        args = JSON.parse(choice.message.function_call.arguments || '{}');
      } catch {
        args = {};
      }

      const normalizedArgs = {
        ...args,
        mealName: typeof args?.mealName === 'string' ? args.mealName.trim() : '',
        confidenceLabel: args?.confidenceLabel ?? 'unknown',
        analysisMode: args?.analysisMode ?? 'fallback',
        foodSources: Array.isArray(args?.foodSources) ? args.foodSources : [],
        aiAssumptions: Array.isArray(args?.aiAssumptions) ? args.aiAssumptions : [],
        referenceSources: Array.isArray(args?.referenceSources) ? args.referenceSources : [],
        fiberDetails: args?.fiberDetails ?? {},
        flavonoids: args?.flavonoids ?? { totalMg: undefined, classes: [] },
        polyphenols: args?.polyphenols ?? { totalMg: undefined, likelySources: [] },
        weeklyTrackingSignals: hasTrackingTargets
          ? (() => {
              const all = normalizeWeeklyTrackingSignals(args);
              // Only allowed keys
              return Object.fromEntries(
                Object.entries(all).filter(([key]) => allowedWeeklyTrackingKeys.has(key))
              );
            })()
          : {},
        microbiomeSupport: Array.isArray(args?.microbiomeSupport) ? args.microbiomeSupport : [],
      };


      // weeklyTrackingSignals is always an object now
      const weeklyTrackingSignalsOutput =
        normalizedArgs.weeklyTrackingSignals && typeof normalizedArgs.weeklyTrackingSignals === 'object'
          ? normalizedArgs.weeklyTrackingSignals
          : {};

      console.log('[handleNutritionAnalyze] function_call summary:', {
        mealName: normalizedArgs.mealName,
        confidenceLabel: normalizedArgs.confidenceLabel,
        analysisMode: normalizedArgs.analysisMode,
        foodSourcesCount: normalizedArgs.foodSources.length,
        assumptionsCount: normalizedArgs.aiAssumptions.length,
      });

      return {
        type: 'nutrition',
        mealName: normalizedArgs.mealName,
        nutrition: {
          ...normalizeNutrition(normalizedArgs),
          mealName: normalizedArgs.mealName,
        },
        confidence: Number(normalizedArgs?.confidence ?? 0),
        confidenceLabel:
          (normalizedArgs?.confidenceLabel as 'high' | 'medium' | 'low' | 'unknown' | undefined)
          ?? confidenceToLabel(Number(normalizedArgs?.confidence ?? 0)),
        foodSources: dedupe(toStringArray(normalizedArgs?.foodSources)),
        aiAssumptions: dedupe(toStringArray(normalizedArgs?.aiAssumptions)),
        referenceSources: dedupe(toStringArray(normalizedArgs?.referenceSources)),
        // aliases used by current frontend evidence parser
        sources: dedupe([
          ...toStringArray(normalizedArgs?.foodSources),
          ...toStringArray(normalizedArgs?.referenceSources),
        ]),
        inferred: dedupe(toStringArray(normalizedArgs?.aiAssumptions)),
        weeklyTrackingSignals: weeklyTrackingSignalsOutput,
        nutritionDetails: normalizeNutritionDetails(normalizedArgs),
        aminoAcidsByType: normalizeAminoAcids(normalizedArgs),
        vitaminsByType: normalizeVitamins(normalizedArgs),
      };
    }

    if (typeof choice.message?.content === 'string') {
      const text = choice.message.content;
      const normalized = text.toLowerCase();
      if (normalized.includes('typical nutritional values') || normalized.includes('similar dishes')) {
        return {
          type: 'error',
          message: 'Bilden kunde inte analyseras tillrackligt specifikt. Ta en tydligare narbild sa att fiber/makron kan uppskattas fran faktiska ingredienser.',
          raw: {
            finish_reason: choice.finish_reason,
            contentPreview: text.slice(0, 400),
          },
        };
      }
    }

    return {
      type: 'text',
      content: choice.message?.content,
      raw: { finish_reason: choice.finish_reason },
    };
  } catch (err: any) {
    return {
      type: 'error',
      message: err?.message ?? 'Nutrition analysis failed',
      raw: {
        name: err?.name,
        code: err?.code,
        details: typeof err?.message === 'string' ? err.message : undefined,
      },
    };
  }
}
