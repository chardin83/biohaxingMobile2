import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useStorage } from '@/app/context/StorageContext';
import { MACROS } from '@/utils/nutritionGoals';

import { ThemedText } from '../ThemedText';
import AppButton from '../ui/AppButton';
import { IconSymbol } from '../ui/IconSymbol';
import Pill from '../ui/Pill';
import SettingsCard from '../ui/SettingsCard';

const CHART_SIZE = 104;
const CHART_RADIUS = 46;
const CHART_CIRCUMFERENCE = 2 * Math.PI * CHART_RADIUS;

type DailyTotals = Partial<Record<'calories' | 'protein' | 'carbohydrates' | 'fat', number>>;

export default function MacroGoalsCard({ totals = {} }: Readonly<{ totals?: DailyTotals }>) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const { userProfile, updateUserProfile } = useStorage();
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const tracking = userProfile.trackMacros !== false;
  const goals = userProfile.nutritionGoals;
  const totalCalories = goals ? MACROS.reduce((total, macro) => total + goals[macro.key] * macro.caloriesPerGram, 0) : 0;
  const consumedCalories = Math.round(totals.calories ?? 0);
  const formatGrams = (value: number) => Math.round(value * 10) / 10;
  let chartOffset = 0;

  const toggleTracking = async (value: boolean) => {
    setSaving(true);
    setError(false);
    try {
      await updateUserProfile({ trackMacros: value });
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  let goalsContent: ReactNode;
  if (!tracking) {
    goalsContent = (
      <ThemedText type="caption" style={{ color: colors.textMuted }}>
        {t('nutritionGoals.logger.disabled')}
      </ThemedText>
    );
  } else if (goals) {
    goalsContent = (
      <View style={styles.goalsRow}>
        <View style={styles.chartColumn}>
          <View
            style={styles.chart}
            accessible
            accessibilityLabel={t('nutritionGoals.logger.energyProgress', { consumed: consumedCalories, goal: Math.round(totalCalories) })}
          >
            <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox="0 0 104 104">
              <Circle cx={52} cy={52} r={CHART_RADIUS} stroke={colors.border} strokeWidth={8} fill="none" />
              {MACROS.map(macro => {
                const targetLength = totalCalories > 0 ? ((goals[macro.key] * macro.caloriesPerGram) / totalCalories) * CHART_CIRCUMFERENCE : 0;
                const progress = goals[macro.key] > 0 ? Math.min(Math.max((totals[macro.key] ?? 0) / goals[macro.key], 0), 1) : 0;
                const length = targetLength * progress;
                const offset = chartOffset;
                chartOffset += targetLength;
                return (
                  <Circle
                    key={macro.key}
                    cx={52}
                    cy={52}
                    r={CHART_RADIUS}
                    fill="none"
                    stroke={macro.color}
                    strokeWidth={8}
                    strokeDasharray={`${length} ${CHART_CIRCUMFERENCE}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 52 52)"
                  />
                );
              })}
            </Svg>
            <View style={styles.chartCenter} pointerEvents="none">
              <IconSymbol name="flame" size={18} color={colors.primary} />
              <ThemedText type="title3">{consumedCalories}</ThemedText>
              <ThemedText type="caption">kcal</ThemedText>
            </View>
          </View>
          <ThemedText type="caption" style={styles.energyGoal}>
            / {Math.round(totalCalories)} kcal
          </ThemedText>
        </View>
        <View style={styles.macros}>
          {MACROS.map(macro => (
            <View key={macro.key} style={styles.macro}>
              <IconSymbol name={macro.icon} size={20} color={macro.color} />
              <ThemedText type="caption" style={styles.label}>
                {t(`nutritionGoals.${macro.key}`)}
              </ThemedText>
              <ThemedText type="defaultSemiBold">
                {formatGrams(totals[macro.key] ?? 0)} / {goals[macro.key]} g
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    );
  } else {
    goalsContent = (
      <View style={styles.setup}>
        <ThemedText type="caption">{t('nutritionGoals.logger.notSet')}</ThemedText>
        <AppButton
          title={t('nutritionGoals.logger.setGoals')}
          variant="secondary"
          rightIcon="chevron.right"
          onPress={() => router.push('/settings/nutrition')}
        />
      </View>
    );
  }

  return (
    <SettingsCard style={styles.card}>
      <Pressable
        style={styles.header}
        accessibilityRole="button"
        accessibilityLabel={t('nutritionGoals.logger.options')}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(current => !current)}
      >
        <ThemedText type="title3" style={styles.label}>
          {t('nutritionGoals.logger.title')}
        </ThemedText>
        <Pill label={t(tracking ? 'nutritionGoals.logger.on' : 'nutritionGoals.logger.off')} active={tracking} />
        <IconSymbol name={expanded ? 'expandMore' : 'chevron.right'} size={18} color={colors.text} />
      </Pressable>
      {expanded && (
        <View style={[styles.options, { borderColor: colors.borderLight }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nutritionGoals.logger.edit')}
            onPress={() => router.push(goals ? '/settings/nutrition-goals' : '/settings/nutrition')}
            style={styles.editRow}
          >
            <IconSymbol name="pencil" size={20} color={colors.icon} />
            <IconSymbol name="chevron.right" size={16} color={colors.text} />
            <ThemedText style={styles.label}>{t('nutritionGoals.logger.edit')}</ThemedText>
          </Pressable>
          <View style={styles.toggleRow}>
            <ThemedText style={styles.label}>{t('nutritionGoals.logger.track')}</ThemedText>
            <Switch
              accessibilityLabel={t('nutritionGoals.logger.track')}
              value={tracking}
              disabled={saving}
              onValueChange={toggleTracking}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        </View>
      )}
      {goalsContent}
      {error && <ThemedText type="error">{t('nutritionGoals.logger.saveError')}</ThemedText>}
      {expanded && <AppButton title={t('general.close')} variant="secondary" style={styles.closeButton} onPress={() => setExpanded(false)} />}
    </SettingsCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, marginBottom: 12 },
  label: { flex: 1 },
  options: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12, marginBottom: 16, gap: 8 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  goalsRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  chartColumn: { alignItems: 'center', gap: 4 },
  energyGoal: { textAlign: 'center' },
  chart: { width: CHART_SIZE, height: CHART_SIZE },
  chartCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  macros: { flex: 1, gap: 12 },
  macro: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setup: { gap: 12 },
  closeButton: { marginTop: 16 },
});
