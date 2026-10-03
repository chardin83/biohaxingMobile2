import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import AppButton from '@/components/ui/AppButton';
import Container from '@/components/ui/Container';
import Notice from '@/components/ui/Notice';

import PersonalDetailsSettings from './PersonalDetailsSettings';
import { ThemedText } from './ThemedText';

export default function NutritionPersonalDetails() {
  const { t } = useTranslation('common');
  const { colors } = useTheme();

  return (
    <Container
      background="gradient"
      gradientKey="sunrise"
      gradientLocations={colors.gradients?.sunrise?.locations3}
      showBackButton
      currentStep={1}
      totalSteps={4}
      contentContainerStyle={styles.container}
      footer={
        <AppButton title={t('onboarding.continue')} variant="primary" rightIcon="chevron.right" onPress={() => router.push('/settings/nutrition-activity')} />
      }
    >
      <ThemedText type="title2" style={styles.heading}>
        {t('nutritionTargetSection.title')}
      </ThemedText>
      <ThemedText type="title3" style={styles.stepTitle}>
        {t('nutritionGoals.personalDetailsTitle')}
      </ThemedText>
      <PersonalDetailsSettings />
      <Notice variant="info" message={t('nutritionGoals.personalDetailsNotice')} />
    </Container>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: 24 },
  stepTitle: { marginBottom: 12 },
  container: { paddingHorizontal: 20, paddingBottom: 140 },
});
