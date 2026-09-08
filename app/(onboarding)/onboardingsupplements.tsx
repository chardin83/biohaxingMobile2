import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { t } from 'i18next';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';

import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import Container from '@/components/ui/Container';
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

    // Map each Supplement to SupplementPlanEntry
    const supplementPlanEntries = selectedSupplements.map(supplement => ({
      supplement,
      startedAt: new Date().toISOString(),
      createdBy: 'onboarding',
      planName: t(`plan.defaultPlan.${morning!.key}`),
      prefferedTime: morning!.time,
      notify: true,
    }));

    const morningPlan = {
      name: t(`plan.defaultPlan.${morning!.key}`),
      prefferedTime: morning!.time,
      supplements: supplementPlanEntries,
      notify: true,
    };

    setPlans(prev => ({ ...prev, supplements: [morningPlan] }));
    setOnboardingStep(1);
    router.push('/(onboarding)/onboardinggoals');
  };

  return (
    <Container
      background="gradient"
      gradientKey="sunrise"
      gradientLocations={colors.gradients?.sunrise?.locations3 as any}
      centerContent
      showBackButton
      currentStep={1}
      totalSteps={2}
      onBackPress={() => router.replace('/(onboarding)/onboardingwelcome')}
      scrollable={false}
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
      <Text style={[styles.title, { color: colors.primary }]}> {t('common:onboarding.whatSupplementDoYouTakeAlready')}</Text>

      <FlatList
        data={supplements}
        keyExtractor={item => item.id}
        style={styles.listContainer}
        renderItem={({ item }) => (
          <AppCard
            title={item.name}
            description={item.description}
            isActive={selectedIds.includes(item.id)}
            showCheckbox
            onPress={() => toggleSelection(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
    paddingTop: 70,
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  list: {
    paddingBottom: 100,
  },
  listContainer: {
    flex: 1,
    width: '100%',
  },
});
