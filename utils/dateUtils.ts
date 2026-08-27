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

export const formatDate = (isoDate?: string, language?: string): string => {
  if (!isoDate) return '';

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  const locale = language?.trim() || undefined;

  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
};

export const formatDateRange = (
  startIsoDate?: string,
  endIsoDate?: string,
  language?: string
): string => {
  if (!startIsoDate || !endIsoDate) return '';

  const startDate = new Date(startIsoDate);
  const endDate = new Date(endIsoDate);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    return '';
  }

  const locale = language?.trim() || undefined;
  const sameYear = startDate.getFullYear() === endDate.getFullYear();

  try {
    const start = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      ...(!sameYear && { year: 'numeric' }),
    }).format(startDate);

    const end = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(endDate);

    return `${start} – ${end}`;
  } catch {
    const start = new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      ...(!sameYear && { year: 'numeric' }),
    }).format(startDate);

    const end = new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(endDate);

    return `${start} – ${end}`;
  }
};

export const getInclusiveDayCount = (startDate?: string, endDate?: string): number => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(1, Math.floor((endDay - startDay) / 86_400_000) + 1);
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

export const getLocalizedWeekdayLabels = (
  language: string,
  options?: {
    format?: 'short' | 'long';
    weekStartsOn?: 'sunday' | 'monday' | number;
    stripDots?: boolean;
  }
): string[] => {
  const formatter = new Intl.DateTimeFormat(language, { weekday: options?.format ?? 'short' });
  const stripDots = options?.stripDots ?? false;
  const weekStartsOn = options?.weekStartsOn ?? 'monday';
  const firstSunday = new Date(2024, 0, 7);

  let startOffset: number;

  if (typeof weekStartsOn === 'number') {
    startOffset = ((weekStartsOn % 7) + 7) % 7;
  } else {
    startOffset = weekStartsOn === 'sunday' ? 0 : 1;
  }

  return Array.from({ length: 7 }, (_v, index) => {
    const date = new Date(2024, 0, firstSunday.getDate() + startOffset + index);
    const label = formatter.format(date);
    return stripDots ? label.replaceAll('.', '') : label;
  });
};

export const getFirstDayOfWeek = (language?: string): number => {
  const locale = language?.trim();
  if (!locale) return 1;

  try {
    const intlLocale = new Intl.Locale(locale) as Intl.Locale & {
      weekInfo?: { firstDay?: number };
    };

    const firstDay = intlLocale.weekInfo?.firstDay;
    if (typeof firstDay === 'number' && Number.isFinite(firstDay)) {
      // Intl uses 1..7 where Sunday is 7. react-native-calendars expects 0..6 where Sunday is 0.
      return firstDay % 7;
    }
  } catch {
    // Fall back to a practical default when locale parsing isn't available.
  }

  return locale.toLowerCase().startsWith('en') ? 0 : 1;
};