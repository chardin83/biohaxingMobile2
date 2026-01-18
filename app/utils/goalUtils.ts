// utils/goalUtils.ts
export function calculateGoalProgress(startDate: Date, duration: { amount: number; unit: string }) {
  const now = new Date();
  const endDate = getEndDate(startDate, duration.amount, duration.unit);

  const totalTime = endDate.getTime() - startDate.getTime();
  const timePassed = now.getTime() - startDate.getTime();

  const progress = Math.min(timePassed / totalTime, 1);
  const isGoalFinished = now >= endDate;

  return { progress, endDate, isGoalFinished };
}

export function getEndDate(start: Date, amount: number, unit: string) {
  const end = new Date(start);
  if (unit === 'days') end.setDate(end.getDate() + amount);
  if (unit === 'weeks') end.setDate(end.getDate() + amount * 7);
  if (unit === 'months') end.setMonth(end.getMonth() + amount);
  return end;
}

export function getTimeLeftText(t: any, endDate: Date, durationUnit: string) {
  const now = new Date();
  const msLeft = endDate.getTime() - now.getTime();

  if (msLeft <= 0) return t('common:goalDetails.completed');

  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  if (durationUnit === 'days') {
    return t('common:goalDetails.timeLeft.days', { count: daysLeft });
  } else if (durationUnit === 'weeks') {
    return t('common:goalDetails.timeLeft.weeks', {
      count: Math.ceil(daysLeft / 7),
    });
  } else if (durationUnit === 'months') {
    return t('common:goalDetails.timeLeft.months', {
      count: Math.ceil(daysLeft / 30),
    });
  }

  return '';
}
