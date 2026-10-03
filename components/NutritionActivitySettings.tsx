import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import Container from '@/components/ui/Container';
import RadioButton from '@/components/ui/RadioButton';
import SettingsCard from '@/components/ui/SettingsCard';

const ACTIVITY_LEVELS = [
  { key: 'bedbound', pal: 1.1 },
  { key: 'sedentary', pal: 1.2 },
  { key: 'light', pal: 1.4 },
  { key: 'moderate', pal: 1.6 },
  { key: 'active', pal: 1.8 },
  { key: 'veryActive', pal: 2.0 },
  { key: 'highlyActive', pal: 2.2 },
  { key: 'eliteAthlete', pal: 2.4 },
] as const;

export default function NutritionActivitySettings() {
  const { t, i18n } = useTranslation('common');
  const { colors } = useTheme();
  const { userProfile, updateUserProfile } = useStorage();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const selected = userProfile.activityPal;

  const selectLevel = async (pal: number) => {
    setSaving(true);
    setError(false);
    try {
      await updateUserProfile({ activityPal: pal });
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
      currentStep={2}
      totalSteps={4}
      contentContainerStyle={styles.container}
      footer={
        <AppButton
          title={t('onboarding.continue')}
          variant="primary"
          rightIcon="chevron.right"
          disabled={saving || !ACTIVITY_LEVELS.some(level => level.pal === selected)}
          onPress={() => router.push('/settings/nutrition-summary')}
        />
      }
    >
      <ThemedText type="title2" style={styles.title}>
        {t('nutritionGoals.activity.title')}
      </ThemedText>
      <ThemedText style={styles.description}>{t('nutritionGoals.activity.description')}</ThemedText>
      <SettingsCard>
        {ACTIVITY_LEVELS.map((level, index) => (
          <RadioButton
            key={level.key}
            selected={selected === level.pal}
            disabled={saving}
            onPress={() => selectLevel(level.pal)}
            accessibilityLabel={`${t(`nutritionGoals.activity.${level.key}.title`)}, PAL ${level.pal}`}
            style={[
              styles.option,
              index < ACTIVITY_LEVELS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight },
            ]}
          >
            <View style={styles.optionText}>
              <ThemedText type="title3">
                {index + 1}. {t(`nutritionGoals.activity.${level.key}.title`)}
              </ThemedText>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {t(`nutritionGoals.activity.${level.key}.description`)}
              </ThemedText>
              <ThemedText type="caption" style={{ color: colors.primary }}>
                PAL {new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(level.pal)}
              </ThemedText>
            </View>
          </RadioButton>
        ))}
      </SettingsCard>
      {error && (
        <ThemedText type="error" style={styles.error}>
          {t('nutritionGoals.activity.saveError')}
        </ThemedText>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 140 },
  title: { marginBottom: 12 },
  description: { marginBottom: 20 },
  option: { padding: 16 },
  optionText: { flex: 1, gap: 6 },
  error: { marginTop: 12 },
});
