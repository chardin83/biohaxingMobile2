import type {
  TargetPeriod,
} from './targetProgressTypes';

const toISODate = (
  date: Date
): string =>
  date.toISOString().slice(0, 10);

export const getTargetDates = (
  selectedDate: string,
  period: TargetPeriod
): string[] => {
  if (period === 'daily') {
    return [selectedDate];
  }

  const date =
    new Date(
      `${selectedDate}T12:00:00`
    );

  const day =
    date.getDay();

  const daysFromMonday =
    day === 0
      ? 6
      : day - 1;

  const monday =
    new Date(date);

  monday.setDate(
    date.getDate() -
      daysFromMonday
  );

  return Array.from(
    { length: 7 },
    (_, index) => {
      const current =
        new Date(monday);

      current.setDate(
        monday.getDate() +
          index
      );

      return toISODate(
        current
      );
    }
  );
};