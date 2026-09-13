import { useTheme } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

export type PastWeekProgress = {
  start: string;
  label: string;
  completed: number;
  total: number;
  days: {
    date: string;
    ratio: number;
    fulfilled: boolean;
    disabled: boolean;
  }[];
};

type PastWeeksProgressProps = {
  weeks: PastWeekProgress[];
  selectedWeekStart: string;
  daysLabel: string;
  onSelectWeek: (weekStart: string) => void;
};

const PastWeeksProgress = ({ weeks, selectedWeekStart, daysLabel, onSelectWeek }: PastWeeksProgressProps) => {
  const { colors } = useTheme();

  const getProgressColor = (actual: number, total: number) => {
    if (actual <= 0 || total <= 0) {
      return colors.textMuted;
    }
    if (actual < total) {
      return colors.goldSoft;
    }
    return colors.accentColor;
  };

  return (
    <View style={styles.row}>
      {weeks.map(week => {
        const isSelected = selectedWeekStart === week.start;
        return (
          <TouchableOpacity
            key={week.start}
            onPress={() => onSelectWeek(week.start)}
            style={[
              styles.cell,
              {
                backgroundColor: isSelected ? colors.background : colors.secondaryBackground,
                borderColor: isSelected ? colors.primary : colors.textWeak,
              },
              isSelected && styles.selectedCell,
            ]}
          >
            <ThemedText type="caption" style={[styles.label, { color: colors.textMuted }]}>
              {week.label}
            </ThemedText>
            <ThemedText type="title3" style={{ color: getProgressColor(week.completed, week.total) }}>
              {`${week.completed}/${week.total}`}
            </ThemedText>
            <ThemedText type="explainer">{daysLabel}</ThemedText>
            <View style={styles.barRow}>
              {week.days.map(day => (
                <View key={day.date} style={styles.barTrack}>
                  {!day.disabled && (
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: day.ratio > 0 ? Math.max(Math.round(day.ratio * 26), 2) : 1,
                          backgroundColor: day.fulfilled ? colors.accentMedium : colors.border,
                        },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  cell: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 2,
  },
  selectedCell: {
    borderWidth: 2,
  },
  label: {
    fontSize: 9,
    textAlign: 'center',
  },
  barRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'flex-end',
    height: 26,
    marginTop: 4,
    width: '100%',
  },
  barTrack: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 2,
  },
});

export default PastWeeksProgress;
