export const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const fromDateKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

export const formatMonthDay = (date: Date, language: string): string => {
  const formatted = new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
  }).format(date);

  return formatted.replaceAll('.', '');
};

export const formatMonthDayRange = (start: Date, end: Date, language: string): string => {
  return `${formatMonthDay(start, language)}\u2013${formatMonthDay(end, language)}`;
};