import { ArchivedPlansByCategory,PlansByCategory } from './planTypes';

type PlanSubscriber = (plans: PlansByCategory) => void;
type ArchivedPlanSubscriber = (plans: ArchivedPlansByCategory) => void;

const planSubscribers = new Set<PlanSubscriber>();
const archivedPlanSubscribers = new Set<ArchivedPlanSubscriber>();

export const subscribePlans = (fn: PlanSubscriber) => {
  planSubscribers.add(fn);
  return () => planSubscribers.delete(fn);
};

export const emitPlans = (plans: PlansByCategory) => {
  planSubscribers.forEach(fn => fn(plans));
};

export const subscribeArchivedPlans = (
  fn: ArchivedPlanSubscriber
) => {
  archivedPlanSubscribers.add(fn);
  return () => archivedPlanSubscribers.delete(fn);
};

export const emitArchivedPlans = (
  plans: ArchivedPlansByCategory
) => {
  archivedPlanSubscribers.forEach(fn => fn(plans));
};