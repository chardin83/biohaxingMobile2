import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import Areas from '@/components/Areas';
import AppButton from '@/components/ui/AppButton';
import Container from '@/components/ui/Container';

import { useStorage } from '../context/StorageContext';

export default function OnboardingGoals() {
  const { t } = useTranslation(['goals', 'common', 'supplements']);
  const { setHasCompletedOnboarding } = useStorage();
  const router = useRouter();
  const { colors } = useTheme();

  const handleNext = () => {
    setHasCompletedOnboarding(true);
    router.push('/dashboard');
  };

  return (
    <Container
      background="gradient"
      gradientKey="sunrise"
      gradientLocations={colors.gradients?.sunrise?.locations3 as any}
      showBackButton
      currentStep={2}
      totalSteps={2}
      onBackPress={() => router.replace('/(onboarding)/onboardingsupplements')}
      contentContainerStyle={styles.container}
      footer={
        <AppButton
          title={t('common:onboarding.continue')}
          onPress={handleNext}
          variant="primary"
          icon="chevron.right"
          iconPosition="right"
        />
      }
    >
      <Areas />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
