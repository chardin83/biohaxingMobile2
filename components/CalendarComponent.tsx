import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Image, View, StyleSheet } from "react-native";
import { LocaleConfig, Calendar } from "react-native-calendars";
import { useTranslation } from "react-i18next";
import { Colors } from "@/constants/Colors";
import { useStorage } from "@/app/context/StorageContext";

const configureCalendarLocale = (language: string, t: any) => {
  const localeConfig = {
    monthNames: t("monthNames", { returnObjects: true }),
    monthNamesShort: t("monthNamesShort", { returnObjects: true }),
    dayNames: t("dayNames", { returnObjects: true }),
    dayNamesShort: t("dayNamesShort", { returnObjects: true }),
    today: t("today"),
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

const CalendarComponent = forwardRef<
  CalendarComponentRef,
  CalendarComponentProps
>(({ onDayPress }, ref) => {
  const { t, i18n } = useTranslation();
  const { takenDates, setTakenDates } = useStorage();

  const [calendarKey, setCalendarKey] = useState(i18n.language);
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { dailyNutritionSummaries } = useStorage();

  useImperativeHandle(ref, () => ({
    addMarkForDate: (date: string) => {
      setTakenDates((prev) => ({ ...prev, [date]: [] }));
    },
    removeMarkForDate: (date: string) => {
      setTakenDates((prev) => {
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
  }, [i18n.language]);

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    onDayPress?.(day.dateString);
  };

  if (!isLocaleReady) return null;

// Reducera logiken
const dynamicMarkedDates = Object.keys({
  ...dailyNutritionSummaries,
  ...takenDates,
}).reduce((acc, date) => {
  const dots = [];

  if (dailyNutritionSummaries[date]?.meals?.length > 0) {
    dots.push({ key: "meal", color: Colors.dark.checkmarkMeal });
  }

  if (takenDates[date]?.length > 0) {
    dots.push({ key: "supplement", color: Colors.dark.checkmarkSupplement });
  }

  acc[date] = {
    dots,
    marked: dots.length > 0,
  };

  return acc;
}, {} as { [date: string]: any });

if (selectedDate) {
  dynamicMarkedDates[selectedDate] = {
    ...(dynamicMarkedDates[selectedDate] || {}),
    selected: true,
    selectedColor: "#32D1A6",
  };
}


  return (
    <View style={styles.container}>
      <Calendar
        key={calendarKey}
        onDayPress={handleDayPress}
        markingType="multi-dot"
        markedDates={dynamicMarkedDates}
        theme={{
          backgroundColor: Colors.dark.secondary,
          calendarBackground: Colors.dark.secondary,
          dayTextColor: Colors.dark.textWhite,
          todayTextColor: Colors.dark.primary,
          selectedDayBackgroundColor: Colors.dark.primary,
          selectedDayTextColor: Colors.dark.background,
          textSectionTitleColor: Colors.dark.textLight,
          textDisabledColor: "#555",
          monthTextColor: Colors.dark.textWhite,
          arrowColor: Colors.dark.primary,
        }}
        style={styles.calendar}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.secondary,
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: Colors.dark.buttonGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  reactLogo: {
    height: 211,
    width: "100%",
  },
  calendar: {
    borderRadius: 16,
    overflow: "hidden",
  },
});

export default CalendarComponent;
