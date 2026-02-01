import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { t } from 'i18next';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import { defaultPlans } from '@/locales/defaultPlans';
import { useSupplements } from '@/locales/supplements';

import { useStorage } from '../context/StorageContext';

export default function OnboardingSupplements() {
  const { colors } = useTheme();
  const supplements = useSupplements()
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const router = useRouter();
  const { setPlans, setOnboardingStep } = useStorage();

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleNext = () => {
    const selectedSupplements = supplements.filter(s => selectedIds.includes(s.id));

    const morning = defaultPlans.find(p => p.key === 'morning');

    const morningPlan = {
      name: t(`plan.defaultPlan.${morning!.key}`),
      prefferedTime: morning!.time,
      supplements: selectedSupplements,
      notify: true,
    };

    setPlans(prev => ({ ...prev, supplements: [morningPlan] }));
    setOnboardingStep(1);
    router.push('/(onboarding)/onboardinggoals');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}> {t('common:onboarding.whatSupplementDoYouTakeAlready')}</Text>

      <FlatList
        data={supplements}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <AppCard
            title={item.name}
            description={item.description}
            isActive={selectedIds.includes(item.id)}
            onPress={() => toggleSelection(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
      />

      <AppButton title={t('common:onboarding.continue')} onPress={handleNext} variant="primary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
    paddingTop: 70,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  list: {
    paddingBottom: 40,
  },
});
