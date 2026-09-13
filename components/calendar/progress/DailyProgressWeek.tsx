import { useTheme } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

export type DailyProgressState = 'none' | 'partial' | 'fulfilled' | 'disabled';

export type DailyProgressStatus = {
  state: DailyProgressState;
  ratio?: number;
};

interface DailyProgressWeekProps {
  days: string[];
  dayLabels: string[];
  todayKey: string;
  selectedDate?: string;
  startDate?: string;
  getStatus: (dateKey: string) => DailyProgressStatus;
  onSelectDate: (dateKey: string) => void;
}

const PARTIAL_PROGRESS_ICON = '◐';

const DailyProgressWeek = ({ days, dayLabels, todayKey, selectedDate, startDate, getStatus, onSelectDate }: DailyProgressWeekProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.weekRow}>
      {days.map((dateKey, index) => {
        const status = getStatus(dateKey);
        const isToday = dateKey === todayKey;
        const isSelected = selectedDate === dateKey;
        const isFuture = dateKey > todayKey;
        const isBeforeStart = !!startDate && dateKey < startDate;
        const isStartDay = dateKey === startDate;
        const isDisabled = status.state === 'disabled' || isFuture || isBeforeStart;

        let dayLabelColor = colors.textMuted;
        let iconColor = colors.textMuted;
        let cellBackground = colors.overlayLight;
        let iconChar = '✗';

        if (isToday) {
          dayLabelColor = colors.accentColor;
        }

        if (isStartDay) {
          dayLabelColor = colors.goldSoft;
        }

        if (status.state === 'fulfilled') {
          iconChar = '✓';
          iconColor = colors.progressSuccessIcon;
          cellBackground = colors.progressSuccessCell;
        } else if (status.state === 'partial') {
          iconChar = PARTIAL_PROGRESS_ICON;
          iconColor = colors.progressPartialIcon;
        } else if (status.state === 'none') {
          iconChar = '✗';
        }

        if (isDisabled) {
          iconChar = '';
          iconColor = colors.secondaryBackground;
          cellBackground = colors.overlayLight;
        }

        return (
          <View key={dateKey} style={styles.dayColumn}>
            <ThemedText
              type="caption"
              style={[
                styles.dayLabel,
                (isToday || isStartDay) && styles.dayLabelUnderlined,
                {
                  color: dayLabelColor,
                },
              ]}
            >
              {dayLabels[index] ?? ''}
            </ThemedText>

            <TouchableOpacity
              activeOpacity={0.75}
              disabled={isDisabled}
              onPress={() => onSelectDate(dateKey)}
              style={[
                styles.dayCell,
                {
                  backgroundColor: cellBackground,
                },
                isBeforeStart && styles.dayCellBeforeStart,
                isSelected && styles.dayCellSelected,
                isSelected && {
                  borderColor: colors.accentColor,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.dayCellIcon,
                  {
                    color: iconColor,
                  },
                ]}
              >
                {iconChar}
              </ThemedText>
            </TouchableOpacity>

            {isSelected && !isDisabled && (
              <ThemedText
                type="title2"
                style={[
                  styles.dayCellArrow,
                  {
                    color: colors.accentColor,
                  },
                ]}
              >
                {'⌵'}
              </ThemedText>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  weekRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    maxWidth: 36,
  },
  dayLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  dayLabelUnderlined: {
    textDecorationLine: 'underline',
  },
  dayCell: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellBeforeStart: {
    opacity: 0.6,
  },
  dayCellSelected: {
    borderWidth: 1.5,
  },
  dayCellIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  dayCellArrow: {
    marginTop: -14,
  },
});

export default DailyProgressWeek;
