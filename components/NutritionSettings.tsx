import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { NutritionDistribution } from '@/app/context/storage/userProfile/userProfileTypes';
import { useStorage } from '@/app/context/StorageContext';
import NumberStepper from '@/components/NumberStepper';
import NutritionDistributionSelector from '@/components/NutritionDistributionSelector';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PencilEditButton from '@/components/ui/PencilEditButton';
import SettingsCard from '@/components/ui/SettingsCard';
import SettingsCardLink from '@/components/ui/SettingsCardLink';
import { DEFAULT_GOALS, goalsForDistribution,MACROS } from '@/utils/nutritionGoals';

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function NutritionSettings() {
  const { colors } = useTheme();
  const { t } = useTranslation('common');
  const { userProfile, updateUserProfile } = useStorage();
  const goals = userProfile.nutritionGoals ?? DEFAULT_GOALS;
  const distribution = userProfile.nutritionDistribution ?? (userProfile.nutritionGoals ? 'custom' : 'balanced');
  const [draft, setDraft] = useState(goals);
  const [draftDistribution, setDraftDistribution] = useState<NutritionDistribution>(distribution);
  const [choosingDistribution, setChoosingDistribution] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const displayedDistribution = editing ? draftDistribution : distribution;
  const displayedGoals = editing ? draft : goals;
  const totalEnergy = MACROS.reduce((total, macro) => total + displayedGoals[macro.key] * macro.caloriesPerGram, 0);

  const save = async () => {
    setSaving(true);
    setError(false);
    try {
      await updateUserProfile({ nutritionGoals: draft, nutritionDistribution: draftDistribution });
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const selectDistribution = async (choice: NutritionDistribution) => {
    if (saving) return;
    const nextGoals = { ...displayedGoals };
    if (choice !== 'custom') {
      const energy = totalEnergy || 2000;
      Object.assign(nextGoals, goalsForDistribution(choice, energy));
    }
    if (editing || choice === 'custom') {
      setDraft(nextGoals);
      setDraftDistribution(choice);
      setEditing(true);
      setError(false);
      setChoosingDistribution(false);
      return;
    }
    setSaving(true);
    setError(false);
    try {
      await updateUserProfile({ nutritionGoals: nextGoals, nutritionDistribution: choice });
      setChoosingDistribution(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container background="gradient" gradientKey="sunrise" gradientLocations={colors.gradients?.sunrise?.locations3} showBackButton>
      <View style={styles.header}>
        <ThemedText type="title2">{t('nutritionTargetSection.title')}</ThemedText>
        <PencilEditButton
          accessibilityLabel={t('nutritionGoals.edit')}
          style={[styles.editButton, { backgroundColor: colors.overlayLight }]}
          onPress={() => {
            if (saving) return;
            setDraft(goals);
            setDraftDistribution(distribution);
            setError(false);
            setEditing(true);
          }}
        />
      </View>
      <ThemedText type="label" uppercase style={styles.sectionTitle}>
        {t('nutritionGoals.macros')}
      </ThemedText>
      <SettingsCard style={styles.card}>
        <View style={styles.charts}>
          {MACROS.map(macro => {
            const grams = displayedGoals[macro.key];
            const share = totalEnergy > 0 ? (grams * macro.caloriesPerGram) / totalEnergy : 0;
            return (
              <View key={macro.key} style={styles.macro}>
                <View style={styles.chart} accessible accessibilityLabel={`${grams} g ${t(`nutritionGoals.${macro.key}`)}`}>
                  <Svg width="100%" height="100%" viewBox="0 0 108 108">
                    <Circle cx={54} cy={54} r={RADIUS} stroke={colors.border} strokeWidth={8} fill="none" />
                    <Circle
                      cx={54}
                      cy={54}
                      r={RADIUS}
                      stroke={macro.color}
                      strokeWidth={8}
                      fill="none"
                      strokeDasharray={`${CIRCUMFERENCE * share} ${CIRCUMFERENCE}`}
                      transform="rotate(-90 54 54)"
                    />
                  </Svg>
                  <View style={styles.chartText} pointerEvents="none">
                    <ThemedText type="title3">{grams}g</ThemedText>
                    <View style={styles.chartLabelRow}>
                      <IconSymbol name={macro.icon} size={12} color={macro.color} />
                      <ThemedText type="caption" numberOfLines={1} adjustsFontSizeToFit style={styles.macroLabel}>
                        {t(`nutritionGoals.${macro.key}`)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
                <ThemedText type="caption" style={styles.share}>
                  {t('nutritionGoals.energyShare', { percent: Math.round(share * 100) })}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </SettingsCard>
      <SettingsCard style={styles.energyCard}>
        <View style={styles.iconLabelRow}>
          <IconSymbol name="flame" size={22} color={colors.primary} />
          <ThemedText type="title3" style={styles.editLabel}>
            {t('nutritionGoals.totalEnergy')}
          </ThemedText>
        </View>
        <ThemedText type="title2" accessibilityLiveRegion="polite">
          {Math.round(totalEnergy)} kcal
        </ThemedText>
      </SettingsCard>
      <SettingsCard style={styles.calculatorSpacing}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('nutritionGoals.calculatorTitle')}
          style={styles.calculatorCard}
          onPress={() => router.push('/settings/nutrition-details')}
        >
          <IconSymbol name="calculator" size={24} color={colors.icon} />
          <View style={styles.optionLabel}>
            <ThemedText type="title3">{t('nutritionGoals.calculatorTitle')}</ThemedText>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              {t('nutritionGoals.calculatorDescription')}
            </ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={16} color={colors.text} />
        </Pressable>
      </SettingsCard>
      {editing && (
        <SettingsCard style={styles.editor}>
          {MACROS.map(macro => (
            <View key={macro.key} style={styles.editRow}>
              <View style={styles.iconLabelRow}>
                <IconSymbol name={macro.icon} size={20} color={macro.color} />
                <ThemedText style={styles.editLabel}>{t(`nutritionGoals.${macro.key}`)} (g)</ThemedText>
              </View>
              <View style={styles.amountControl}>
                <NumberStepper
                  value={draft[macro.key]}
                  min={0}
                  max={1000}
                  step={5}
                  disabled={saving}
                  accessibilityLabel={t(`nutritionGoals.${macro.key}`)}
                  onChange={value => {
                    if (value === draft[macro.key]) return;
                    setDraft(current => ({ ...current, [macro.key]: value }));
                    setDraftDistribution('custom');
                  }}
                />
              </View>
            </View>
          ))}
          {error && <ThemedText type="error">{t('nutritionGoals.saveError')}</ThemedText>}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={saving} onPress={() => setEditing(false)} style={styles.action}>
              <ThemedText>{t('general.cancel')}</ThemedText>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={saving} onPress={save} style={styles.action}>
              <ThemedText style={{ color: colors.primary }}>{t('general.save')}</ThemedText>
            </Pressable>
          </View>
        </SettingsCard>
      )}
      {error && !editing && <ThemedText type="error">{t('nutritionGoals.saveError')}</ThemedText>}
      <SettingsCardLink
        style={styles.distributionCard}
        iconName="target"
        title={t('nutritionGoals.distribution')}
        value={t(`nutritionGoals.distributions.${displayedDistribution}`)}
        onPress={() => {
          if (!saving) setChoosingDistribution(current => !current);
        }}
      />
      {choosingDistribution && <NutritionDistributionSelector value={displayedDistribution} onChange={selectDistribution} disabled={saving} />}
    </Container>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  editButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { marginBottom: 8 },
  card: { paddingVertical: 20, paddingHorizontal: 8 },
  charts: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  macro: { flex: 1, alignItems: 'center' },
  chart: { width: '100%', maxWidth: 140, aspectRatio: 1 },
  chartText: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  chartLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, width: '100%' },
  macroLabel: { flexShrink: 1, textAlign: 'center' },
  iconLabelRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  share: { textAlign: 'center', marginTop: 12 },
  energyCard: { marginTop: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  calculatorSpacing: { marginTop: 16 },
  calculatorCard: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  distributionCard: { marginTop: 24, marginBottom: 8 },
  optionLabel: { flex: 1, gap: 4 },
  editor: { marginTop: 16, padding: 16 },
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, gap: 8 },
  amountControl: { maxWidth: '50%' },
  editLabel: { flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  action: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
});
