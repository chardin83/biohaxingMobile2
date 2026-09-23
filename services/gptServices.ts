// services/gptService.ts
import debug from 'debug';
import { t } from 'i18next';

import { PlansByCategory } from '@/app/context/storage/plans/planTypes';
import { ReasonSummary } from '@/app/context/StorageContext';
import { GPTResponse } from '@/app/domain/GPTResponse';
import { Message } from '@/app/domain/Message';
import i18n from '@/app/i18n';
import { ENDPOINTS } from '@/config';
import { tips } from '@/locales/tips';

const log = debug('app:gptServices');

type SupportLevel = 'high' | 'medium' | 'low' | 'unknown';
type DrinkConfidence = 'high' | 'medium' | 'low' | 'unknown';

export type DrinkType =
  'water' | 'coffee' | 'tea' | 'soft_drink' | 'energy_drink' | 'juice' | 'milk' | 'red_wine' | 'white_wine' | 'beer' | 'spirits' | 'drink';

export const ALCOHOL_TYPES = ['red_wine', 'white_wine', 'beer', 'spirits'] as const satisfies readonly DrinkType[];

export type AlcoholType = (typeof ALCOHOL_TYPES)[number];

export const isAlcohol = (type: DrinkType): type is AlcoholType => ALCOHOL_TYPES.includes(type as AlcoholType);

export type DetectedDrink = {
  type: DrinkType;
  name: string;
  amountMl?: number;
  sugarFree?: boolean;
  caffeinated?: boolean;
  confidence: DrinkConfidence;
};

export interface NutritionAnalysisResponse {
  type: 'match_result' | 'text' | 'nutrition' | 'error';
  content?: string;
  match?: boolean;
  confidence?: number;
  uploadedFileId?: string;
  raw?: any;

  detectedDrinks?: DetectedDrink[];

  nutrition?: {
    mealName?: string;
    protein?: number;
    calories?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;

    nutritionDetails?: {
      fiber?: {
        total?: number;
        gelForming?: number;
        nonGelForming?: number;
        fermentable?: number;
        subtypes?: Array<{
          subtype: string;
          amountG?: number;
          likelySources?: string[];
        }>;
        unit?: 'g';
      };

      polyphenols?: {
        totalMg?: number;
        byType?: Record<string, number>;
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
        supportLevel: SupportLevel;
        linkedNutrients: string[];
        likelyFoods: string[];
        rationale?: string;
      }>;
    };

    aminoAcidsByType?: Record<string, number>;
    vitaminsByType?: Record<string, number>;

    weeklyTrackingSignals?:
      | Record<string, string[] | number>
      | Array<{
          key?: string;
          trackingKey?: string;
          items?: string[];
          count?: number;
          increment?: number;
          countIncrement?: number;
        }>;

    confidenceLabel?: SupportLevel;
    analysisMode?: 'observed' | 'estimated' | 'fallback';
    foodSources?: string[];
    aiAssumptions?: string[];
    referenceSources?: string[];

    [k: string]: any;
  };

  nutritionDetails?: {
    fiber?: {
      total?: number;
      gelForming?: number;
      nonGelForming?: number;
      fermentable?: number;
      subtypes?: Array<{
        subtype: string;
        amountG?: number;
        likelySources?: string[];
      }>;
      unit?: 'g';
    };

    polyphenols?: {
      totalMg?: number;
      byType?: Record<string, number>;
      likelySources?: string[];
    };

    minerals?: Record<string, number | undefined>;
    vitamins?: Record<string, number | undefined>;

    microbiomeSupport?: Array<{
      microbe: string;
      supportLevel: SupportLevel;
      linkedNutrients: string[];
      likelyFoods: string[];
      rationale?: string;
    }>;
  };

  aminoAcidsByType?: Record<string, number>;
  vitaminsByType?: Record<string, number>;

  weeklyTrackingSignals?:
    | Record<string, string[] | number>
    | Array<{
        key?: string;
        trackingKey?: string;
        items?: string[];
        count?: number;
        increment?: number;
        countIncrement?: number;
      }>;

  confidenceLabel?: SupportLevel;
  analysisMode?: 'observed' | 'estimated' | 'fallback';
  foodSources?: string[];
  aiAssumptions?: string[];
  referenceSources?: string[];

  message?: string;
}

type TrackingTargetInput = {
  key: string;
  unit: 'items' | 'count';
  amount?: number;
  aiInstruction?: string;
};

export type NutritionAnalysisTier = 'free' | 'premium';

export type NutritionAnalysisFeatures = {
  fiberBreakdown?: boolean;
  polyphenolBreakdown?: boolean;
  aminoAcidBreakdown?: boolean;
  microbiomeSupport?: boolean;
};

type AnalyseParams = {
  uri?: string;
  name?: string;
  type?: string;
  mealDescription?: string;
  file_base64?: string;
  mime?: string;
  ingredientListUri?: string;
  ingredientListName?: string;
  ingredientListType?: string;
  ingredientListBase64?: string;
  ingredientListMime?: string;
  prompt?: string;
  supplement?: string;
  locale?: 'sv' | 'en';
  trackingTargets?: TrackingTargetInput[];
  analysisTier?: NutritionAnalysisTier;
  analysisFeatures?: NutritionAnalysisFeatures;
};

function appendNutritionFile(form: FormData, params: AnalyseParams): void {
  if (params.file_base64) {
    const raw = params.file_base64.includes(',') ? params.file_base64.split(',')[1] : params.file_base64;
    form.append('file_base64', raw);
    form.append('mime', params.mime ?? 'image/jpeg');
    return;
  }

  if (params.uri) {
    form.append('file', {
      uri: params.uri,
      name: params.name ?? `upload_${Date.now()}.jpg`,
      type: params.type ?? 'image/jpeg',
    } as any);
    return;
  }

  throw new Error('No file data provided to NutritionAnalyze');
}

function appendIngredientFile(form: FormData, params: AnalyseParams): void {
  if (params.ingredientListBase64) {
    const raw = params.ingredientListBase64.includes(',') ? params.ingredientListBase64.split(',')[1] : params.ingredientListBase64;
    form.append('ingredient_list_base64', raw);
    form.append('ingredient_list_mime', params.ingredientListMime ?? 'image/jpeg');
    return;
  }

  if (params.ingredientListUri) {
    form.append('ingredient_list_file', {
      uri: params.ingredientListUri,
      name: params.ingredientListName ?? `ingredient_list_${Date.now()}.jpg`,
      type: params.ingredientListType ?? 'image/jpeg',
    } as any);
  }
}

function appendNutritionOptions(form: FormData, params: AnalyseParams, locale: 'sv' | 'en'): NutritionAnalysisTier {
  const analysisTier: NutritionAnalysisTier = params.analysisTier ?? 'premium';
  const languageInstruction = locale === 'sv' ? 'Write all free-text outputs in Swedish.' : 'Write all free-text outputs in English.';

  form.append('prompt', `${params.prompt ?? ''}\n${languageInstruction}`.trim());
  form.append('mealDescription', params.mealDescription ?? '');
  form.append('supplement', params.supplement ?? '');
  form.append('locale', locale);
  form.append('analysisTier', analysisTier);

  if (params.analysisFeatures && Object.keys(params.analysisFeatures).length > 0) {
    form.append('analysisFeatures', JSON.stringify(params.analysisFeatures));
  }
  if (params.trackingTargets && params.trackingTargets.length > 0) {
    form.append('trackingTargets', JSON.stringify(params.trackingTargets));
  }

  return analysisTier;
}

async function parseNutritionResponse(response: Response): Promise<NutritionAnalysisResponse> {
  const text = await response.text();
  let json: NutritionAnalysisResponse | null = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON from server: ${text}`);
  }

  if (!response.ok) {
    const message = (json && (json.message || json.content)) ?? `HTTP ${response.status}`;
    throw new Error(message);
  }

  return json!;
}

export const buildSystemPrompt = (plans: PlansByCategory, shareHealthPlan: boolean): string => {
  const supplementPlans = plans?.supplements ?? [];

  if (shareHealthPlan && supplementPlans.length > 0) {
    const planSummary = supplementPlans
      .map(plan =>
        plan.supplements?.length
          ? `🕒 ${plan.prefferedTime}: ${plan.supplements.map((s: any) => `${s.supplement.name} (${s.supplement.quantity}${s.supplement.unit})`).join(', ')}`
          : null
      )
      .filter(Boolean)
      .join('\n');

    const prompt = t('prompts:system.withPlanTemplate', { plan: planSummary });

    log('[buildSystemPrompt] withPlanTemplate:', prompt);

    return prompt;
  }

  return t('prompts:system.noPlan');
};

export const askGPT = async (messagesToSend: Message[]): Promise<GPTResponse> => {
  const res = await fetch(ENDPOINTS.askAIv2, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: messagesToSend }),
  });

  const text = await res.text();
  return JSON.parse(text) as GPTResponse;
};

function getNutritionLocale(params: AnalyseParams): 'sv' | 'en' {
  const activeLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'en').toLowerCase();
  const fallbackLocale: 'sv' | 'en' = activeLanguage.startsWith('sv') ? 'sv' : 'en';
  return params.locale ?? fallbackLocale;
}

function logNutritionRequest(params: AnalyseParams, analysisTier: NutritionAnalysisTier, locale: 'sv' | 'en'): void {
  log('[NutritionAnalyze] request', {
    endpoint: ENDPOINTS.handleNutritionCheck,
    analysisTier,
    analysisFeatures: params.analysisFeatures,
    hasIngredientList: Boolean(params.ingredientListBase64 || params.ingredientListUri),
    trackingTargetCount: params.trackingTargets?.length ?? 0,
    locale,
  });
}

async function runNutritionAnalysis(params: AnalyseParams): Promise<NutritionAnalysisResponse> {
  const form = new FormData();
  const locale = getNutritionLocale(params);

  appendNutritionFile(form, params);
  appendIngredientFile(form, params);
  const analysisTier = appendNutritionOptions(form, params, locale);
  logNutritionRequest(params, analysisTier, locale);

  const response = await fetch(ENDPOINTS.handleNutritionCheck, {
    method: 'POST',
    body: form as any,
  });

  return parseNutritionResponse(response);
}

function isRetryableNutritionError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('socket hang up') || normalized.includes('econnreset') || normalized.includes('timeout');
}

export async function NutritionAnalyze(params: AnalyseParams): Promise<NutritionAnalysisResponse> {
  try {
    return await runNutritionAnalysis(params);
  } catch (error) {
    const firstMessage = error instanceof Error ? error.message : String(error);
    if (!isRetryableNutritionError(firstMessage)) {
      throw error;
    }

    await new Promise(resolve => setTimeout(resolve, 700));
    return await runNutritionAnalysis(params);
  }
}

type PlanTipPayload = {
  id: string;
  title: string;
  areas: string[];
};

export interface CreatePlanResponse {
  plans: PlansByCategory;
}

function extractPlansFromResponse(raw: any): PlansByCategory | null {
  // Om server redan returnerar { plans }
  if (raw?.plans) return raw.plans;

  // Om server returnerar hela OpenAI-svaret
  const args = raw?.choices?.[0]?.message?.function_call?.arguments;
  if (!args) return null;

  const parsed = JSON.parse(args);
  return parsed?.plans ?? null;
}

function normalizePlanTips(
  items:
    | Array<{
        id?: string;
        tipId?: string;
        createdBy?: string;
        editedAt?: string;
        editedBy?: string;
        startedAt?: string;
      }>
    | undefined,
  category: 'training' | 'nutrition' | 'other'
) {
  const now = new Date().toISOString();
  return (items ?? []).map((item: any) => ({
    tipId: item.tipId ?? item.id,
    startedAt: item.startedAt ?? now,
    createdBy: item.createdBy ?? 'AI',
    editedAt: item.editedAt ?? now,
    editedBy: item.editedBy ?? item.createdBy ?? 'AI',
    planCategory: category,
  }));
}

function normalizeReasonSummary(value: any): ReasonSummary {
  if (!value) return { text: '', createdAt: '' };
  if (typeof value === 'string') {
    return { text: value, createdAt: new Date().toISOString() };
  }
  const text = typeof value.text === 'string' ? value.text : '';
  const createdAt = typeof value.createdAt === 'string' ? value.createdAt : '';
  return { text, createdAt };
}

export async function createPlan(
  plans: PlansByCategory,
  goals: string[],
  myLevel: number,
  locale: 'sv' | 'en',
  userAreas: string[]
): Promise<CreatePlanResponse> {
  const filteredTips = tips.filter(tip => (tip.level ?? 1) <= myLevel);

  const translatedTips: PlanTipPayload[] = filteredTips.map(tip => ({
    id: tip.id,
    title: i18n.t(`tips:${tip.title}`),
    areas: tip.areas.map(a => a.id),
    planCategory: tip.planCategory,
    supplements: tip.supplements,
  }));

  log('[createPlan] tips (first 3):', translatedTips.slice(0, 3));
  console.log('[createPlan] goals:', goals);
  log('[createPlan] userAreas:', userAreas);
  log('[createPlan] myLevel:', myLevel);

  const response = await fetch(ENDPOINTS.createPlan, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tips: translatedTips, plans, goals, userAreas, locale }),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`createPlan failed: ${response.status} ${text}`);

  const raw = JSON.parse(text);
  const newPlans = extractPlansFromResponse(raw);

  if (!newPlans) throw new Error('createPlan: invalid response format');

  return {
    plans: {
      ...newPlans,
      reasonSummary: normalizeReasonSummary((newPlans as any).reasonSummary),
      training: normalizePlanTips(newPlans.training as any, 'training'),
      nutrition: normalizePlanTips(newPlans.nutrition as any, 'nutrition'),
      other: normalizePlanTips(newPlans.other as any, 'other'),
    },
  };
}
