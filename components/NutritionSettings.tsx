import { useFocusEffect, useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { NutritionDistribution, UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';
import { useStorage } from '@/app/context/StorageContext';
import NumberStepper from '@/components/NumberStepper';
import NutritionDistributionSelector from '@/components/NutritionDistributionSelector';
import ProteinReferenceNotice from '@/components/ProteinReferenceNotice';
import { ThemedModal } from '@/components/ThemedModal';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import Badge from '@/components/ui/Badge';
import CardLinkList from '@/components/ui/CardLinkList';
import Container from '@/components/ui/Container';
import DiscreetButton from '@/components/ui/DiscreetButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PencilEditButton from '@/components/ui/PencilEditButton';
import SettingsCard from '@/components/ui/SettingsCard';
import { distributionForAge, goalsForDistribution, MACROS, minimumProteinGoal } from '@/utils/nutritionGoals';

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function NutritionSettings({ manual = false }: Readonly<{ manual?: boolean }>) {
  const { colors } = useTheme();
  const { t } = useTranslation('common');
  const { userProfile, updateUserProfile } = useStorage();
  const minimumProtein = minimumProteinGoal(userProfile.weightKg, userProfile.birthDate);
  const goals: Partial<NonNullable<UserProfile['nutritionGoals']>> = userProfile.nutritionGoals ?? {};
  const distribution = userProfile.nutritionDistribution ?? (userProfile.nutritionGoals ? 'custom' : 'balanced');
  const energySource = userProfile.nutritionEnergySource === 'henry' ? 'henry' : 'custom';
  const [draftEnergySource, setDraftEnergySource] = useState<'henry' | 'custom'>(energySource);
  const [draft, setDraft] = useState(goals);
  const [draftDistribution, setDraftDistribution] = useState<NutritionDistribution>(distribution);
  const [choosingDistribution, setChoosingDistribution] = useState(false);
  const [editing, setEditing] = useState(manual);
  const [energyExpanded, setEnergyExpanded] = useState(manual);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  useEffect(() => {
    if (!manual || userProfile.nutritionGuideCompleted || userProfile.nutritionGuideSkipped) return;
    updateUserProfile({ nutritionGuideSkipped: true }).catch(() => setError(true));
  }, [manual, userProfile.nutritionGuideCompleted, userProfile.nutritionGuideSkipped, updateUserProfile]);
  useFocusEffect(
    useCallback(() => {
      setEditing(manual);
      setEnergyExpanded(manual);
      setChoosingDistribution(false);
      setError(false);
    }, [manual])
  );
  const displayedDistribution = editing ? draftDistribution : distribution;
  const displayedGoals = editing ? draft : goals;
  const presetPercentages = displayedDistribution === 'custom' ? undefined : distributionForAge(displayedDistribution, userProfile.birthDate);
  const hasGoals = MACROS.some(macro => displayedGoals[macro.key] !== undefined);
  const totalEnergy = MACROS.reduce((total, macro) => total + (displayedGoals[macro.key] ?? 0) * macro.caloriesPerGram, 0);
  const canSave = MACROS.every(macro => Number.isFinite(draft[macro.key])) && totalEnergy > 0;
  const hasUnsavedChanges = editing && (draftDistribution !== distribution || MACROS.some(macro => draft[macro.key] !== goals[macro.key]));
  const goBack = () => {
    if (manual) router.dismissTo('/settings/person');
    else router.back();
  };
  const handleBack = () => {
    if (saving) return;
    if (hasUnsavedChanges) setShowUnsavedModal(true);
    else goBack();
  };

  const save = async (leaveAfterSaving = false) => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(false);
    try {
      await updateUserProfile({
        nutritionGoals: { protein: Math.max(draft.protein!, minimumProtein), carbohydrates: draft.carbohydrates!, fat: draft.fat! },
        nutritionDistribution: draftDistribution,
        nutritionEnergySource: draftEnergySource,
        ...(manual ? { nutritionGuideCompleted: true } : {}),
      });
      setEditing(false);
      setEnergyExpanded(false);
      setShowUnsavedModal(false);
      if (leaveAfterSaving) goBack();
      else if (manual) router.replace('/settings/nutrition');
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const selectDistribution = (choice: NutritionDistribution) => {
    if (saving) return;
    const nextGoals = { ...displayedGoals };
    if (choice !== 'custom' && totalEnergy > 0) {
      const energy = totalEnergy;
      Object.assign(nextGoals, goalsForDistribution(choice, energy, userProfile.weightKg, userProfile.birthDate));
    }
    setDraft(nextGoals);
    setDraftDistribution(choice);
    setEditing(true);
    setError(false);
    setChoosingDistribution(false);
  };

  return (
    <Container
      background="gradient"
      gradientKey="sunrise"
      gradientLocations={colors.gradients?.sunrise?.locations3}
      showBackButton
      onBackPress={handleBack}
      footer={
        editing ? (
          <View style={styles.actions}>
            <AppButton style={styles.footerButton} title={t('general.save')} variant="primary" disabled={saving || !canSave} onPress={() => save()} />
            <AppButton
              style={styles.footerButton}
              title={t('general.cancel')}
              variant="secondary"
              disabled={saving}
              onPress={() => {
                setEditing(false);
                setEnergyExpanded(false);
                setChoosingDistribution(false);
                setDraft(goals);
                setDraftEnergySource(energySource);
                setDraftDistribution(distribution);
              }}
            />
          </View>
        ) : undefined
      }
    >
      <View style={styles.header}>
        <ThemedText type="title2">{t('nutritionTargetSection.title')}</ThemedText>
        <PencilEditButton
          accessibilityLabel={t('nutritionGoals.edit')}
          style={[styles.editButton, { backgroundColor: colors.overlayLight }]}
          onPress={() => {
            if (saving) return;
            setDraft(goals);
            setDraftEnergySource(energySource);
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
            const macroLabel = t(`nutritionGoals.${macro.key}`);
            const share = totalEnergy > 0 ? ((grams ?? 0) * macro.caloriesPerGram) / totalEnergy : 0;
            const percent = grams === undefined ? presetPercentages?.[macro.key] : Math.round(share * 100);
            return (
              <View key={macro.key} style={styles.macro}>
                <View style={styles.chart} accessible accessibilityLabel={`${grams === undefined ? '–' : `${grams} g`} ${macroLabel}`}>
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
                    <ThemedText type="title3">{grams === undefined ? '–' : `${grams}g`}</ThemedText>
                    <View style={styles.chartLabelRow}>
                      <IconSymbol name={macro.icon} size={12} color={macro.color} />
                      <ThemedText type="caption" numberOfLines={1} adjustsFontSizeToFit style={styles.macroLabel}>
                        {macroLabel}
                      </ThemedText>
                    </View>
                  </View>
                </View>
                <ThemedText type="caption" style={styles.share}>
                  {percent === undefined ? '–' : t('nutritionGoals.energyShare', { percent })}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </SettingsCard>
      <CardLinkList
        style={styles.energyCard}
        rows={[
          {
            key: 'energy',
            iconName: 'flame',
            title: t('nutritionGoals.totalEnergy'),
            value: hasGoals ? `${Math.round(totalEnergy)} kcal` : '–',
            accessory: (
              <View style={styles.energyValue}>
                {hasGoals && (
                  <Badge style={{ backgroundColor: colors.infoWeak, borderColor: colors.infoColor }}>
                    <ThemedText type="pill">{t(`nutritionGoals.energySource.${editing ? draftEnergySource : energySource}`)}</ThemedText>
                  </Badge>
                )}
                <ThemedText>{hasGoals ? `${Math.round(totalEnergy)} kcal` : '–'}</ThemedText>
              </View>
            ),
            expanded: energyExpanded,
            disabled: saving,
            onPress: () => {
              if (!editing) {
                setDraft(goals);
                setDraftEnergySource(energySource);
                setDraftDistribution(distribution);
                setEditing(true);
              }
              setEnergyExpanded(current => !current);
            },
            content: (
              <View style={[styles.editRow, styles.energyEditor]}>
                <View style={styles.iconLabelRow}>
                  <IconSymbol name="flame" size={20} color={colors.primary} />
                  <ThemedText style={styles.editLabel}>{t('nutritionGoals.totalEnergy')} (kcal)</ThemedText>
                </View>
                <NumberStepper
                  value={hasGoals ? Math.round(totalEnergy) : undefined}
                  min={Math.max(1, minimumProtein * 4)}
                  max={10000}
                  step={50}
                  disabled={saving}
                  accessibilityLabel={t('nutritionGoals.totalEnergy')}
                  onChange={value => {
                    setDraftEnergySource('custom');
                    if (!hasGoals || draftDistribution !== 'custom') {
                      setDraft(
                        goalsForDistribution(
                          draftDistribution === 'custom' ? 'balanced' : draftDistribution,
                          value,
                          userProfile.weightKg,
                          userProfile.birthDate
                        )
                      );
                      return;
                    }
                    const ratio = totalEnergy > 0 ? value / totalEnergy : 1;
                    const protein = Math.max(minimumProtein, Math.round((draft.protein ?? 0) * ratio));
                    const remainingEnergy = Math.max(0, value - protein * 4);
                    const nonProteinEnergy = (draft.carbohydrates ?? 0) * 4 + (draft.fat ?? 0) * 9;
                    const carbohydrateShare = nonProteinEnergy > 0 ? ((draft.carbohydrates ?? 0) * 4) / nonProteinEnergy : 0.5;
                    setDraft({
                      protein,
                      carbohydrates: Math.round((remainingEnergy * carbohydrateShare) / 4),
                      fat: Math.round((remainingEnergy * (1 - carbohydrateShare)) / 9),
                    });
                    setDraftDistribution('custom');
                  }}
                />
              </View>
            ),
          },
        ]}
      />
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
      {editing && draftDistribution === 'custom' && (
        <SettingsCard style={styles.editor}>
          {MACROS.map(macro => (
            <View key={macro.key} style={styles.editRow}>
              <View style={styles.iconLabelRow}>
                <IconSymbol name={macro.icon} size={20} color={macro.color} />
                <ThemedText style={styles.editLabel}>{t(`nutritionGoals.${macro.key}`)} (g)</ThemedText>
              </View>
              <View style={styles.amountControl}>
                {draftDistribution === 'custom' ? (
                  <NumberStepper
                    value={draft[macro.key]}
                    min={macro.key === 'protein' ? minimumProtein : 0}
                    max={1000}
                    step={5}
                    disabled={saving}
                    accessibilityLabel={t(`nutritionGoals.${macro.key}`)}
                    onChange={value => {
                      if (value === draft[macro.key]) return;
                      setDraftEnergySource('custom');
                      setDraft(current => ({ ...current, [macro.key]: value }));
                      setDraftDistribution('custom');
                    }}
                  />
                ) : (
                  <ThemedText>{draft[macro.key] === undefined ? '–' : `${draft[macro.key]} g`}</ThemedText>
                )}
              </View>
            </View>
          ))}
          {error && <ThemedText type="error">{t('nutritionGoals.saveError')}</ThemedText>}
        </SettingsCard>
      )}
      {error && (!editing || draftDistribution !== 'custom') && <ThemedText type="error">{t('nutritionGoals.saveError')}</ThemedText>}
      <CardLinkList
        style={styles.distributionCard}
        rows={[
          {
            key: 'link',
            iconName: 'target',
            title: t('nutritionGoals.distribution'),
            value: t(`nutritionGoals.distributions.${displayedDistribution}`),
            onPress: () => {
              if (!saving) setChoosingDistribution(current => !current);
            },
          },
        ]}
      />
      {choosingDistribution && (
        <NutritionDistributionSelector value={displayedDistribution} onChange={selectDistribution} disabled={saving} birthDate={userProfile.birthDate} />
      )}
      <ProteinReferenceNotice />
      <ThemedModal
        visible={showUnsavedModal}
        title={t('nutritionGoals.unsaved.title')}
        iconName="error"
        onClose={() => {
          if (!saving) setShowUnsavedModal(false);
        }}
        showCancelButton={false}
      >
        <ThemedText>{t('nutritionGoals.unsaved.description')}</ThemedText>
        <View style={styles.unsavedActions}>
          <AppButton title={t('nutritionGoals.unsaved.saveAndBack')} variant="primary" disabled={saving || !canSave} onPress={() => save(true)} />
          <AppButton title={t('nutritionGoals.unsaved.continueEditing')} variant="secondary" disabled={saving} onPress={() => setShowUnsavedModal(false)} />
          <View style={styles.discardAction}>
            <DiscreetButton
              title={t('nutritionGoals.unsaved.discard')}
              disabled={saving}
              onPress={() => {
                setShowUnsavedModal(false);
                setDraft(goals);
                setDraftEnergySource(energySource);
                setDraftDistribution(distribution);
                setEditing(false);
                goBack();
              }}
            />
            {error && <ThemedText type="error">{t('nutritionGoals.saveError')}</ThemedText>}
          </View>
        </View>
      </ThemedModal>
    </Container>
  );
}

const styles = StyleSheet.create({
  energyValue: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  energyEditor: { paddingHorizontal: 12 },
  unsavedActions: { width: '100%', gap: 12, marginTop: 20 },
  discardAction: { alignItems: 'center' },
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
  energyCard: { marginTop: 16 },
  calculatorSpacing: { marginTop: 16 },
  calculatorCard: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  distributionCard: { marginTop: 24, marginBottom: 8 },
  optionLabel: { flex: 1, gap: 4 },
  editor: { marginTop: 16, padding: 16 },
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, gap: 8 },
  amountControl: { maxWidth: '50%' },
  editLabel: { flex: 1 },
  actions: { flexDirection: 'row', gap: 12 },
  footerButton: { flex: 1 },
});
