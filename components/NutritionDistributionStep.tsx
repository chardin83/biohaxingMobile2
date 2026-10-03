import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { NutritionDistribution } from '@/app/context/storage/userProfile/userProfileTypes';
import { useStorage } from '@/app/context/StorageContext';
import AppButton from '@/components/ui/AppButton';
import Container from '@/components/ui/Container';
import SettingsCard from '@/components/ui/SettingsCard';
import { calculateEnergyNeeds } from '@/utils/energyNeeds';
import { DEFAULT_GOALS, goalsForDistribution,MACROS } from '@/utils/nutritionGoals';

import NumberStepper from './NumberStepper';
import NutritionDistributionSelector from './NutritionDistributionSelector';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

export default function NutritionDistributionStep() {
  const { colors } = useTheme();
  const { t } = useTranslation('common');
  const { userProfile, updateUserProfile } = useStorage();
  const initialGoals = userProfile.nutritionGoals ?? DEFAULT_GOALS;
  const energy = calculateEnergyNeeds(userProfile)?.total ?? MACROS.reduce((total, macro) => total + initialGoals[macro.key] * macro.caloriesPerGram, 0);
  const initialDistribution = userProfile.nutritionDistribution ?? (userProfile.nutritionGoals ? 'custom' : 'balanced');
  const [distribution, setDistribution] = useState<NutritionDistribution>(initialDistribution);
  const [goals, setGoals] = useState(() => (initialDistribution === 'custom' ? initialGoals : goalsForDistribution(initialDistribution, energy)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    setError(false);
    try {
      await updateUserProfile({ nutritionGoals: goals, nutritionDistribution: distribution, nutritionGuideCompleted: true });
      router.dismissTo('/settings/nutrition');
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container
      background="gradient"
      gradientKey="sunrise"
      gradientLocations={colors.gradients?.sunrise?.locations3}
      showBackButton
      currentStep={4}
      totalSteps={4}
      contentContainerStyle={styles.container}
      footer={<AppButton title={t('onboarding.finish')} variant="primary" rightIcon="chevron.right" disabled={saving} onPress={finish} />}
    >
      <ThemedText type="title2" style={styles.title}>
        {t('nutritionGoals.distribution')}
      </ThemedText>
      <NutritionDistributionSelector
        value={distribution}
        disabled={saving}
        onChange={choice => {
          setDistribution(choice);
          if (choice !== 'custom') setGoals(goalsForDistribution(choice, energy));
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
                min={0}
                max={1000}
                step={5}
                disabled={saving}
                accessibilityLabel={t(`nutritionGoals.${macro.key}`)}
                onChange={value => setGoals(current => ({ ...current, [macro.key]: value }))}
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
      {error && <ThemedText type="error">{t('nutritionGoals.summary.saveError')}</ThemedText>}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 140 },
  title: { marginBottom: 20 },
  preview: { marginTop: 16, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  label: { flex: 1 },
});
