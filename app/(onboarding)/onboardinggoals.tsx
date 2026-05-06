import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import AppButton from '@/components/ui/AppButton';

import Areas from '../(manage)/areas';
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Areas />

      <AppButton title={t('common:onboarding.continue')} onPress={handleNext} variant="primary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
