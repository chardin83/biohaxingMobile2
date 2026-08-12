import { useTheme } from '@react-navigation/native';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform,StyleSheet, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getFirstDayOfWeek, getLocalizedWeekdayLabels } from '@/utils/dateUtils';

const addDays = (dateString: string, days: number) => {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const isAfterDate = (dateString: string, maxDate: string) => dateString > maxDate;

const formatDayLabel = (dateString: string, language: string) => {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString(language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const buildIntlCalendarLocale = (language: string, todayLabel: string) => {
  const baseYear = 2024;
  const normalizeShort = (value: string) => value.replaceAll('.', '');

  const monthNames = Array.from({ length: 12 }, (_v, monthIndex) =>
    new Intl.DateTimeFormat(language, { month: 'long' }).format(new Date(baseYear, monthIndex, 1))
  );

  const monthNamesShort = Array.from({ length: 12 }, (_v, monthIndex) =>
    normalizeShort(new Intl.DateTimeFormat(language, { month: 'short' }).format(new Date(baseYear, monthIndex, 1)))
  );

  // LocaleConfig expects Sunday-first weekday ordering.
  const dayNames = getLocalizedWeekdayLabels(language, {
    format: 'long',
    weekStartsOn: 'sunday',
  });

  const dayNamesShort = getLocalizedWeekdayLabels(language, {
    format: 'short',
    weekStartsOn: 'sunday',
    stripDots: true,
  }).map(normalizeShort);

  return {
    monthNames,
    monthNamesShort,
    dayNames,
    dayNamesShort,
    today: todayLabel,
  };
};

const configureCalendarLocale = (language: string, t: any) => {
  const localeConfig = buildIntlCalendarLocale(language, t('today'));
  LocaleConfig.locales[language] = localeConfig;
  LocaleConfig.defaultLocale = language;
};

interface CalendarComponentProps {
  onDayPress?: (date: string) => void;
  selectedDate?: string;
}

interface CalendarComponentRef {
  addMarkForDate: (date: string) => void;
  removeMarkForDate: (date: string) => void;
}

const CalendarComponent = forwardRef<CalendarComponentRef, CalendarComponentProps>(({ onDayPress, selectedDate: selectedDateProp }, ref) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { takenDates, setTakenDates, dailyNutritionSummaries, trainingEntries } = useStorage();
  const today = new Date().toISOString().split('T')[0];

  const [calendarKey, setCalendarKey] = useState(i18n.language + colors.background);
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [isExpanded, setIsExpanded] = useState(false);
  const firstDay = getFirstDayOfWeek(i18n.language);

  useImperativeHandle(ref, () => ({
    addMarkForDate: (date: string) => {
      setTakenDates(prev => ({ ...prev, [date]: [] }));
    },
    removeMarkForDate: (date: string) => {
      setTakenDates(prev => {
        const updated = { ...prev };
        delete updated[date];
        return updated;
      });
    },
  }));

  useEffect(() => {
    configureCalendarLocale(i18n.language, t);
    setCalendarKey(i18n.language + colors.background); // Uppdatera key när språk eller tema ändras
    setIsLocaleReady(true);
  }, [i18n.language, t, colors.background]);

  useEffect(() => {
    if (selectedDateProp && selectedDateProp !== selectedDate) {
      setSelectedDate(selectedDateProp);
    }
  }, [selectedDateProp, selectedDate]);

  const handleDayPress = (day: { dateString: string }) => {
    if (isAfterDate(day.dateString, today)) return;
    setSelectedDate(day.dateString);
    setIsExpanded(false);
    onDayPress?.(day.dateString);
  };

  const goToPreviousDay = () => {
    const nextDate = addDays(selectedDate, -1);
    setSelectedDate(nextDate);
    setIsExpanded(false);
    onDayPress?.(nextDate);
  };

  const goToNextDay = () => {
    const nextDate = addDays(selectedDate, 1);
    if (isAfterDate(nextDate, today)) return;
    setSelectedDate(nextDate);
    setIsExpanded(false);
    onDayPress?.(nextDate);
  };

  const canGoToNextDay = !isAfterDate(addDays(selectedDate, 1), today);

  if (!isLocaleReady) return null;

  // Reducera logiken
  const dynamicMarkedDates = Object.keys({
    ...dailyNutritionSummaries,
    ...takenDates,
    ...trainingEntries,
  }).reduce(
    (acc, date) => {
      const dots = [];

      if (dailyNutritionSummaries[date]?.meals?.length > 0) {
        dots.push({ key: 'meal', color: colors.checkmarkMeal });
      }

      if (takenDates[date]?.length > 0) {
        dots.push({ key: 'supplement', color: colors.checkmarkSupplement });
      }

      if ((trainingEntries[date]?.length ?? 0) > 0) {
        dots.push({ key: 'training', color: colors.checkmarkTraining });
      }

      acc[date] = {
        dots,
        marked: dots.length > 0,
      };

      return acc;
    },
    {} as { [date: string]: any }
  );

  dynamicMarkedDates[selectedDate] = {
    ...dynamicMarkedDates[selectedDate],
    selected: true,
  };

  const calendarTheme = {
    backgroundColor: colors.cardBackground,
    calendarBackground: colors.cardBackground,
    dayTextColor: colors.text,
    todayTextColor: colors.primary,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: colors.background,
    textSectionTitleColor: colors.textLight,
    textDisabledColor: colors.textMuted,
    monthTextColor: colors.text,
    arrowColor: colors.primary,
  };

  // Only show shadow/glow on iOS
  const containerShadow = Platform.OS === 'ios'
    ? {
        shadowColor: colors.buttonGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      }
    : {
        elevation: 6,
      };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }, containerShadow]}> 
      <View style={styles.headerRow}>
        {isExpanded ? (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsExpanded(false)}
            accessibilityRole="button"
            accessibilityState={{ expanded: true }}
            accessibilityLabel="Collapse calendar"
          >
            <IconSymbol name="calendar" size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.dayNavRow}>
            <TouchableOpacity
              onPress={goToPreviousDay}
              style={styles.dayNavButton}
              accessibilityRole="button"
              accessibilityLabel="Previous day"
            >
              <IconSymbol name="chevron.left" size={20} color={colors.primary} />
            </TouchableOpacity>

            <View style={styles.dayLabelContainer}>
              <ThemedText type="defaultSemiBold">{formatDayLabel(selectedDate, i18n.language)}</ThemedText>
            </View>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsExpanded(true)}
              accessibilityRole="button"
              accessibilityState={{ expanded: false }}
              accessibilityLabel="Expand calendar"
            >
              <IconSymbol name="calendar" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToNextDay}
              style={styles.dayNavButton}
              disabled={!canGoToNextDay}
              accessibilityRole="button"
              accessibilityLabel="Next day"
              accessibilityState={{ disabled: !canGoToNextDay }}
            >
              <IconSymbol
                name="chevron.right"
                size={20}
                color={canGoToNextDay ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isExpanded ? (
        <Calendar
          key={`${calendarKey}-month`}
          current={selectedDate}
          firstDay={firstDay}
          onDayPress={handleDayPress}
          markingType="multi-dot"
          markedDates={dynamicMarkedDates}
          theme={calendarTheme}
          style={styles.calendar}
          maxDate={today}
          disableAllTouchEventsForDisabledDays
          enableSwipeMonths
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: globalStyles.card.borderRadius,
    marginTop: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  calendar: {
    borderRadius: globalStyles.borders.borderRadius,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayNavRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dayNavButton: {
    padding: 4,
  },
  dayLabelContainer: {
    alignItems: 'center',
  },
  dayDotRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    minHeight: 8,
    alignItems: 'center',
  },
  dayDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  toggleButton: {
    padding: 4,
  },
});

export default CalendarComponent;
