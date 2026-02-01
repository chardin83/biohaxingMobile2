import { useTheme } from '@react-navigation/native';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

import { useStorage } from '@/app/context/StorageContext';

const configureCalendarLocale = (language: string, t: any) => {
  const localeConfig = {
    monthNames: t('monthNames', { returnObjects: true }),
    monthNamesShort: t('monthNamesShort', { returnObjects: true }),
    dayNames: t('dayNames', { returnObjects: true }),
    dayNamesShort: t('dayNamesShort', { returnObjects: true }),
    today: t('today'),
  };
  LocaleConfig.locales[language] = localeConfig;
  LocaleConfig.defaultLocale = language;
};

interface CalendarComponentProps {
  onDayPress?: (date: string) => void;
}

interface CalendarComponentRef {
  addMarkForDate: (date: string) => void;
  removeMarkForDate: (date: string) => void;
}

const CalendarComponent = forwardRef<CalendarComponentRef, CalendarComponentProps>(({ onDayPress }, ref) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { takenDates, setTakenDates } = useStorage();

  const [calendarKey, setCalendarKey] = useState(i18n.language);
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { dailyNutritionSummaries } = useStorage();

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
    setCalendarKey(i18n.language);
    setIsLocaleReady(true);
  }, [i18n.language, t]);

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    onDayPress?.(day.dateString);
  };

  if (!isLocaleReady) return null;

  // Reducera logiken
  const dynamicMarkedDates = Object.keys({
    ...dailyNutritionSummaries,
    ...takenDates,
  }).reduce(
    (acc, date) => {
      const dots = [];

      if (dailyNutritionSummaries[date]?.meals?.length > 0) {
        dots.push({ key: 'meal', color: colors.checkmarkMeal });
      }

      if (takenDates[date]?.length > 0) {
        dots.push({ key: 'supplement', color: colors.checkmarkSupplement });
      }

      acc[date] = {
        dots,
        marked: dots.length > 0,
      };

      return acc;
    },
    {} as { [date: string]: any }
  );

  if (selectedDate) {
    dynamicMarkedDates[selectedDate] = {
      ...dynamicMarkedDates[selectedDate],
      selected: true,
      selectedColor: colors.successColor,
    };
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, shadowColor: colors.buttonGlow }]}>
      {/* Exempel på rubrik med ThemedText */}
      {/* <ThemedText type="title3" style={{ marginBottom: 8 }}>{t('calendar.title')}</ThemedText> */}
      <Calendar
        key={calendarKey}
        onDayPress={handleDayPress}
        markingType="multi-dot"
        markedDates={dynamicMarkedDates}
        theme={{
          backgroundColor: colors.secondary,
          calendarBackground: colors.secondary,
          dayTextColor: colors.text,
          todayTextColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.background,
          textSectionTitleColor: colors.textLight ,
          textDisabledColor: colors.textMuted,
          monthTextColor: colors.text,
          arrowColor: colors.primary,
        }}
        style={styles.calendar}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  calendar: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default CalendarComponent;
