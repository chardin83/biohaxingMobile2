import { Plan } from '@/app/domain/Plan';
import { SupplementPlanEntry } from '@/app/domain/SupplementPlanEntry';

import {
  emitArchivedPlans,
  emitPlans,
} from './planEvents';
import {
  getArchivedPlans,
  getPlans,
  saveArchivedPlans,
  savePlans,
} from './planStorage';
import {
  type ArchivedPlansByCategory,
  type ArchivedPlanTipEntry,
  type ArchivedSupplementPlanEntry,
  type PlansByCategory,
} from './planTypes';


/**
 * Ersätter hela plans-objektet.
 */
export const setPlans = async (
  plans: PlansByCategory
): Promise<PlansByCategory> => {
  await savePlans(plans);
  emitPlans(plans);

  return plans;
};
export const updatePlans = async (
  updater:
    | Partial<PlansByCategory>
    | ((current: PlansByCategory) => PlansByCategory)
): Promise<PlansByCategory> => {
  const current = await getPlans();

  const updated =
    typeof updater === 'function'
      ? updater(current)
      : {
          ...current,
          ...updater,
        };

  await savePlans(updated);
  emitPlans(updated);

  return updated;
};

export const saveSupplementToPlan = async (
  selectedPlan: Plan,
  supplement: SupplementPlanEntry,
  isEditingSupplement: boolean
): Promise<Plan> => {
  const plans = await getPlans();
  const supplementPlans = plans.supplements ?? [];

  const existingPlan = supplementPlans.find(
    plan =>
      plan.name === selectedPlan.name &&
      plan.prefferedTime === selectedPlan.prefferedTime
  );

  const targetKey =
    supplement.supplement?.id ??
    supplement.supplement?.name;

  if (!targetKey) {
    throw new Error(
      'Ogiltigt tillskott (saknar id/namn).'
    );
  }

  let updatedSupplementPlans: Plan[];
  let updatedPlan: Plan;

  if (!existingPlan) {
    updatedPlan = {
      name: selectedPlan.name,
      prefferedTime: selectedPlan.prefferedTime,
      supplements: [supplement],
      notify: selectedPlan.notify,
    };

    updatedSupplementPlans = [
      ...supplementPlans,
      updatedPlan,
    ];
  } else if (isEditingSupplement) {
    updatedPlan = {
      ...existingPlan,
      supplements: (
        existingPlan.supplements ?? []
      ).map(existingSupplement => {
        const existingKey =
          existingSupplement.supplement?.id ??
          existingSupplement.supplement?.name;

        return existingKey === targetKey
          ? supplement
          : existingSupplement;
      }),
    };

    updatedSupplementPlans = supplementPlans.map(plan =>
      plan.name === existingPlan.name &&
      plan.prefferedTime === existingPlan.prefferedTime
        ? updatedPlan
        : plan
    );
  } else {
    const supplementExists = (
      existingPlan.supplements ?? []
    ).some(existingSupplement => {
      const existingKey =
        existingSupplement.supplement?.id ??
        existingSupplement.supplement?.name;

      return existingKey === targetKey;
    });

    if (supplementExists) {
      throw new Error(
        `Tillskottet "${
          supplement.supplement?.name ?? targetKey
        }" finns redan i planen.`
      );
    }

    updatedPlan = {
      ...existingPlan,
      supplements: [
        ...(existingPlan.supplements ?? []),
        supplement,
      ],
    };

    updatedSupplementPlans = supplementPlans.map(plan =>
      plan.name === existingPlan.name &&
      plan.prefferedTime === existingPlan.prefferedTime
        ? updatedPlan
        : plan
    );
  }

  const nextPlans: PlansByCategory = {
    ...plans,
    supplements: updatedSupplementPlans,
  };

  await savePlans(nextPlans);
  emitPlans(nextPlans);

  return updatedPlan;
};

export const archivePlan = async (
  category: Exclude<
    keyof ArchivedPlansByCategory,
    'supplements'
  >,
  planId: string | undefined,
  tipId: string
) => {
  const [plans, archivedPlans] = await Promise.all([
    getPlans(),
    getArchivedPlans(),
  ]);

  const activePlans = plans[category];

  const index = activePlans.findIndex(plan =>
    planId
      ? plan.id === planId
      : plan.tipId === tipId
  );

  if (index < 0) {
    return;
  }

  const archivedPlan: ArchivedPlanTipEntry = {
    ...activePlans[index],
    endedAt: new Date().toISOString(),
  };

  const nextPlans: PlansByCategory = {
    ...plans,
    [category]: activePlans.filter(
      (_, itemIndex) => itemIndex !== index
    ),
  };

  const nextArchivedPlans: ArchivedPlansByCategory = {
    ...archivedPlans,
    [category]: [
      ...archivedPlans[category],
      archivedPlan,
    ],
  };

  await Promise.all([
    savePlans(nextPlans),
    saveArchivedPlans(nextArchivedPlans),
  ]);

  emitPlans(nextPlans);
  emitArchivedPlans(nextArchivedPlans);
};

export const archiveSupplement = async (
  supplementName: string,
  planName: string,
  preferredTime: string
) => {
  const [plans, archivedPlans] = await Promise.all([
    getPlans(),
    getArchivedPlans(),
  ]);

  const planIndex = plans.supplements.findIndex(
    plan =>
      plan.name === planName &&
      plan.prefferedTime === preferredTime
  );

  if (planIndex < 0) {
    return;
  }

  const plan = plans.supplements[planIndex];

  const supplementIndex = plan.supplements.findIndex(
    item => item.supplement.name === supplementName
  );

  if (supplementIndex < 0) {
    return;
  }

  const archivedSupplement: ArchivedSupplementPlanEntry = {
    ...plan.supplements[supplementIndex],
    endedAt: new Date().toISOString(),
  };

  const remainingSupplements =
    plan.supplements.filter(
      (_, index) => index !== supplementIndex
    );

  const nextSupplementPlans =
    remainingSupplements.length === 0
      ? plans.supplements.filter(
          (_, index) => index !== planIndex
        )
      : plans.supplements.map((item, index) =>
          index === planIndex
            ? {
                ...item,
                supplements: remainingSupplements,
              }
            : item
        );

  const nextPlans: PlansByCategory = {
    ...plans,
    supplements: nextSupplementPlans,
  };

  const nextArchivedPlans: ArchivedPlansByCategory = {
    ...archivedPlans,
    supplements: [
      ...archivedPlans.supplements,
      archivedSupplement,
    ],
  };

  await Promise.all([
    savePlans(nextPlans),
    saveArchivedPlans(nextArchivedPlans),
  ]);

  emitPlans(nextPlans);
  emitArchivedPlans(nextArchivedPlans);
};

export const archiveSupplementPlan = async (
  planName: string,
  preferredTime: string
) => {
  const [plans, archivedPlans] = await Promise.all([
    getPlans(),
    getArchivedPlans(),
  ]);

  const planIndex = plans.supplements.findIndex(
    plan =>
      plan.name === planName &&
      plan.prefferedTime === preferredTime
  );

  if (planIndex < 0) {
    return;
  }

  const plan = plans.supplements[planIndex];

  const endedAt = new Date().toISOString();

  const archivedSupplements: ArchivedSupplementPlanEntry[] =
    plan.supplements.map(supplement => ({
      ...supplement,
      endedAt,
    }));

  const nextPlans: PlansByCategory = {
    ...plans,
    supplements: plans.supplements.filter(
      (_, index) => index !== planIndex
    ),
  };

  const nextArchivedPlans: ArchivedPlansByCategory = {
    ...archivedPlans,
    supplements: [
      ...archivedPlans.supplements,
      ...archivedSupplements,
    ],
  };

  await Promise.all([
    savePlans(nextPlans),
    saveArchivedPlans(nextArchivedPlans),
  ]);

  emitPlans(nextPlans);
  emitArchivedPlans(nextArchivedPlans);
};

export const clearPlans = async () => {
  const empty: PlansByCategory = {
    supplements: [],
    training: [],
    nutrition: [],
    other: [],
    reasonSummary: {
      text: '',
      createdAt: '',
    },
  };

  await savePlans(empty);
  emitPlans(empty);
};

/**
 * Rensar arkiverade planer.
 */
export const clearArchivedPlans = async () => {
  const empty: ArchivedPlansByCategory = {
    training: [],
    nutrition: [],
    other: [],
    supplements: [],
  };

  await saveArchivedPlans(empty);
  emitArchivedPlans(empty);
};