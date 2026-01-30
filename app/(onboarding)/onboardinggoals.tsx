import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/app/theme/Colors';
import AppButton from '@/components/ui/AppButton';

import Areas from '../(manage)/areas';
import { useStorage } from '../context/StorageContext';

export default function OnboardingGoals() {
  const { t } = useTranslation(['goals', 'common', 'supplements']);
  const { setHasCompletedOnboarding } = useStorage();
  const router = useRouter();

  const handleNext = () => {
    setHasCompletedOnboarding(true);
    router.push('/dashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('common:areas.selectAreas')}</Text>
      <Areas />

      <AppButton title={t('common:onboarding.continue')} onPress={handleNext} variant="primary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginBottom: 20,
  },
});
