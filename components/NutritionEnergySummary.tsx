import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import Container from '@/components/ui/Container';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Notice from '@/components/ui/Notice';
import SettingsCard from '@/components/ui/SettingsCard';
import { calculateEnergyNeeds } from '@/utils/energyNeeds';

export default function NutritionEnergySummary() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation('common');
  const { userProfile, updateUserProfile } = useStorage();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const energy = calculateEnergyNeeds(userProfile);
  const pal = energy ? new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1 }).format(energy.pal) : '';

  const finishGuide = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      await updateUserProfile({ nutritionGuideCompleted: true });
      router.dismissTo('/settings/nutrition');
    } catch {
      setSaveError(true);
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
      currentStep={3}
      totalSteps={3}
      contentContainerStyle={styles.container}
      footer={<AppButton title={t('onboarding.continue')} variant="primary" rightIcon="chevron.right" disabled={saving} onPress={finishGuide} />}
    >
      <ThemedText type="title2" style={styles.title}>
        {t('nutritionGoals.summary.title')}
      </ThemedText>
      <ThemedText style={styles.description}>{t('nutritionGoals.summary.description')}</ThemedText>
      {energy ? (
        <>
          <SettingsCard>
            <View style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight }]}>
              <IconSymbol name="flame" size={24} color={colors.primary} />
              <View style={styles.label}>
                <ThemedText type="title3">{t('nutritionGoals.summary.basal')}</ThemedText>
                <ThemedText type="caption">{t('nutritionGoals.summary.basalDescription')}</ThemedText>
              </View>
              <ThemedText type="title3">{energy.basal} kcal</ThemedText>
            </View>
            <View style={styles.row}>
              <IconSymbol name="trainingWalking" size={24} color={colors.primary} />
              <View style={styles.label}>
                <ThemedText type="title3">{t('nutritionGoals.summary.activity')}</ThemedText>
                <ThemedText type="caption">PAL {pal}</ThemedText>
              </View>
              <ThemedText type="title3">+{energy.activity} kcal</ThemedText>
            </View>
          </SettingsCard>
          <SettingsCard style={styles.totalCard}>
            <ThemedText type="title3">{t('nutritionGoals.summary.total')}</ThemedText>
            <ThemedText type="title2" style={{ color: colors.primary }}>
              {energy.total} kcal
            </ThemedText>
            <ThemedText type="caption">{t('nutritionGoals.summary.perDay')}</ThemedText>
          </SettingsCard>
        </>
      ) : (
        <Notice
          variant="info"
          message={t(userProfile.biologicalSex === 'intersex' ? 'nutritionGoals.summary.unsupportedSex' : 'nutritionGoals.summary.missingDetails')}
        />
      )}
      {saveError && <ThemedText type="error">{t('nutritionGoals.summary.saveError')}</ThemedText>}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 140 },
  title: { marginBottom: 12 },
  description: { marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  label: { flex: 1, gap: 4 },
  totalCard: { marginTop: 16, padding: 20, alignItems: 'center', gap: 8 },
});
