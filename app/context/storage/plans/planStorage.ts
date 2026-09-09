import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  type ArchivedPlansByCategory,
  EMPTY_ARCHIVED_PLANS,
  EMPTY_PLANS,
  type PlansByCategory,
  type ReasonSummary,
} from './planTypes';

const STORAGE_KEYS = {
  PLANS: 'plans',
  ARCHIVED_PLANS: 'archivedPlans',
} as const;

const normalizeReasonSummary = (
  value: unknown
): ReasonSummary => {
  if (!value) {
    return {
      text: '',
      createdAt: '',
    };
  }

  if (typeof value === 'string') {
    return {
      text: value,
      createdAt: new Date().toISOString(),
    };
  }

  if (typeof value === 'object') {
    const item = value as Partial<ReasonSummary>;

    return {
      text:
        typeof item.text === 'string'
          ? item.text
          : '',
      createdAt:
        typeof item.createdAt === 'string'
          ? item.createdAt
          : '',
    };
  }

  return {
    text: '',
    createdAt: '',
  };
};

const normalizePlans = (
  raw: string | null
): PlansByCategory => {
  if (!raw) {
    return EMPTY_PLANS;
  }

  try {
    const parsed = JSON.parse(raw);

    // Bakåtkompatibilitet:
    // tidigare kunde plans vara en array med supplement-planer.
    if (Array.isArray(parsed)) {
      return {
        ...EMPTY_PLANS,
        supplements: parsed,
      };
    }

    return {
      supplements: Array.isArray(parsed?.supplements)
        ? parsed.supplements
        : [],
      training: Array.isArray(parsed?.training)
        ? parsed.training
        : [],
      nutrition: Array.isArray(parsed?.nutrition)
        ? parsed.nutrition
        : [],
      other: Array.isArray(parsed?.other)
        ? parsed.other
        : [],
      reasonSummary: normalizeReasonSummary(
        parsed?.reasonSummary
      ),
    };
  } catch (error) {
    console.warn(
      'planStorage: failed to parse plans',
      error
    );

    return EMPTY_PLANS;
  }
};

const normalizeArchivedPlans = (
  raw: string | null
): ArchivedPlansByCategory => {
  if (!raw) {
    return EMPTY_ARCHIVED_PLANS;
  }

  try {
    const parsed = JSON.parse(raw);

    const storedSupplements = Array.isArray(
      parsed?.supplements
    )
      ? parsed.supplements
      : [];

    /*
     * Bakåtkompatibilitet.
     *
     * Tidigare kunde archived supplements ligga som:
     *
     * {
     *   supplements: [
     *     {
     *       endedAt: "...",
     *       supplements: [...]
     *     }
     *   ]
     * }
     *
     * Nu vill vi ha en platt lista.
     */
    const supplements = storedSupplements.flatMap(
      (item: any) => {
        if (Array.isArray(item?.supplements)) {
          return item.supplements.map(
            (supplement: any) => ({
              ...supplement,
              endedAt:
                supplement.endedAt ??
                item.endedAt ??
                new Date().toISOString(),
            })
          );
        }

        return item;
      }
    );

    return {
      training: Array.isArray(parsed?.training)
        ? parsed.training
        : [],
      nutrition: Array.isArray(parsed?.nutrition)
        ? parsed.nutrition
        : [],
      other: Array.isArray(parsed?.other)
        ? parsed.other
        : [],
      supplements,
    };
  } catch (error) {
    console.warn(
      'planStorage: failed to parse archived plans',
      error
    );

    return EMPTY_ARCHIVED_PLANS;
  }
};

export const getPlans =
  async (): Promise<PlansByCategory> => {
    try {
      const raw = await AsyncStorage.getItem(
        STORAGE_KEYS.PLANS
      );

      return normalizePlans(raw);
    } catch (error) {
      console.warn(
        'planStorage: failed to load plans',
        error
      );

      return EMPTY_PLANS;
    }
  };

export const savePlans = async (
  plans: PlansByCategory
): Promise<void> => {
  try {
    const normalized: PlansByCategory = {
      ...EMPTY_PLANS,
      ...plans,
      supplements: plans.supplements ?? [],
      training: plans.training ?? [],
      nutrition: plans.nutrition ?? [],
      other: plans.other ?? [],
      reasonSummary: normalizeReasonSummary(
        plans.reasonSummary
      ),
    };

    await AsyncStorage.setItem(
      STORAGE_KEYS.PLANS,
      JSON.stringify(normalized)
    );
  } catch (error) {
    console.warn(
      'planStorage: failed to save plans',
      error
    );

    throw error;
  }
};

export const getArchivedPlans =
  async (): Promise<ArchivedPlansByCategory> => {
    try {
      const raw = await AsyncStorage.getItem(
        STORAGE_KEYS.ARCHIVED_PLANS
      );

      return normalizeArchivedPlans(raw);
    } catch (error) {
      console.warn(
        'planStorage: failed to load archived plans',
        error
      );

      return EMPTY_ARCHIVED_PLANS;
    }
  };

export const saveArchivedPlans = async (
  plans: ArchivedPlansByCategory
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.ARCHIVED_PLANS,
      JSON.stringify(plans)
    );
  } catch (error) {
    console.warn(
      'planStorage: failed to save archived plans',
      error
    );

    throw error;
  }
};

export const clearPlansStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(
      STORAGE_KEYS.PLANS
    );
  } catch (error) {
    console.warn(
      'planStorage: failed to clear plans',
      error
    );

    throw error;
  }
};

export const clearArchivedPlansStorage =
  async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(
        STORAGE_KEYS.ARCHIVED_PLANS
      );
    } catch (error) {
      console.warn(
        'planStorage: failed to clear archived plans',
        error
      );

      throw error;
    }
  };