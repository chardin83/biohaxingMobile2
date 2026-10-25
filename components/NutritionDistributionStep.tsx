import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { NutritionDistribution } from '@/app/context/storage/userProfile/userProfileTypes';
import { useStorage } from '@/app/context/StorageContext';
import AppButton from '@/components/ui/AppButton';
import SettingsCard from '@/components/ui/SettingsCard';
import StepsContainer from '@/components/ui/StepsContainer';
import { calculateEnergyNeeds } from '@/utils/energyNeeds';
import { DEFAULT_GOALS, goalsForDistribution, MACROS, minimumProteinGoal } from '@/utils/nutritionGoals';

import NumberStepper from './NumberStepper';
import NutritionDistributionSelector from './NutritionDistributionSelector';
import type { NutritionStepNavigation } from './nutritionStepNavigation';
import ProteinReferenceNotice from './ProteinReferenceNotice';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

export default function NutritionDistributionStep({ currentStep = 4, totalSteps = 4, onContinue, onBack }: NutritionStepNavigation = {}) {
  const { colors } = useTheme();
  const { t } = useTranslation('common');
  const { userProfile, updateUserProfile } = useStorage();
  const initialGoals = userProfile.nutritionGoals ?? DEFAULT_GOALS;
  const minimumProtein = minimumProteinGoal(userProfile.weightKg, userProfile.birthDate);
  const energyNeeds = calculateEnergyNeeds(userProfile);
  const energy = energyNeeds?.total ?? MACROS.reduce((total, macro) => total + initialGoals[macro.key] * macro.caloriesPerGram, 0);
  const initialDistribution = userProfile.nutritionDistribution ?? (userProfile.nutritionGoals ? 'custom' : 'balanced');
  const [distribution, setDistribution] = useState<NutritionDistribution>(initialDistribution);
  const [customGoals, setCustomGoals] = useState(initialGoals);
  const goals =
    distribution === 'custom'
      ? { ...customGoals, protein: Math.max(customGoals.protein, minimumProtein) }
      : goalsForDistribution(distribution, energy, userProfile.weightKg, userProfile.birthDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const finish = async () => {
    if (saving || !energyNeeds) return;
    setSaving(true);
    setError(false);
    try {
      await updateUserProfile({
        nutritionGoals: goals,
        nutritionDistribution: distribution,
        nutritionEnergySource: distribution === 'custom' ? 'custom' : 'henry',
        nutritionGuideCompleted: true,
      });
      if (onContinue) onContinue();
      else router.dismissTo('/settings/nutrition');
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepsContainer
      title={t('nutritionGoals.distribution')}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBackPress={onBack}
      footer={
        <AppButton
          title={t(onContinue ? 'onboarding.continue' : 'onboarding.finish')}
          variant="primary"
          rightIcon="chevron.right"
          busy={saving}
          disabled={saving || !energyNeeds}
          onPress={finish}
        />
      }
    >
      <NutritionDistributionSelector
        birthDate={userProfile.birthDate}
        value={distribution}
        disabled={saving}
        onChange={choice => {
          if (choice === 'custom') setCustomGoals(goals);
          setDistribution(choice);
        }}
      />
      <SettingsCard style={styles.preview}>
        {MACROS.map(macro => (
          <View key={macro.key} style={styles.row}>
            <IconSymbol name={macro.icon} size={20} color={macro.color} />
            <ThemedText style={styles.label}>{t(`nutritionGoals.${macro.key}`)}</ThemedText>
            {distribution === 'custom' ? (
              <NumberStepper
                value={goals[macro.key]}
                min={macro.key === 'protein' ? minimumProtein : 0}
                max={1000}
                step={5}
                disabled={saving}
                accessibilityLabel={t(`nutritionGoals.${macro.key}`)}
                onChange={value => setCustomGoals(current => ({ ...current, [macro.key]: value }))}
              />
            ) : (
              <ThemedText>{goals[macro.key]}</ThemedText>
            )}
            <ThemedText>g</ThemedText>
          </View>
        ))}
        <View style={styles.row}>
          <IconSymbol name="flame" size={20} color={colors.primary} />
          <ThemedText style={styles.label}>{t('nutritionGoals.totalEnergy')}</ThemedText>
          <ThemedText>{Math.round(MACROS.reduce((total, macro) => total + goals[macro.key] * macro.caloriesPerGram, 0))} kcal</ThemedText>
        </View>
      </SettingsCard>
      <ProteinReferenceNotice />
      {error && <ThemedText type="error">{t('nutritionGoals.summary.saveError')}</ThemedText>}
    </StepsContainer>
  );
}

const styles = StyleSheet.create({
  preview: { marginTop: 16, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  label: { flex: 1 },
});
