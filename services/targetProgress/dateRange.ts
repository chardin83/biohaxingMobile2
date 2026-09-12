import { TargetPeriod } from './targetProgressTypes';

export type DateRange = {
  start: string;
  end: string;
};

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(year, month - 1, day, 12);
};

export const getWeekStartKey = (dateKey: string): string => {
  const date = parseDateKey(dateKey);

  const day = date.getDay();
  const diffToMonday = (day + 6) % 7;

  date.setDate(date.getDate() - diffToMonday);

  return toDateKey(date);
};

export const getTargetDateRange = (
  selectedDate: string,
  period: TargetPeriod
): DateRange => {
  if (period === 'daily') {
    return {
      start: selectedDate,
      end: selectedDate,
    };
  }

  const startDate = parseDateKey(getWeekStartKey(selectedDate));
  const endDate = new Date(startDate);

  endDate.setDate(startDate.getDate() + 6);

  return {
    start: toDateKey(startDate),
    end: toDateKey(endDate),
  };
};

export const isDateWithinRange = (
  dateKey: string,
  range: DateRange
): boolean =>
  dateKey >= range.start &&
  dateKey <= range.end;