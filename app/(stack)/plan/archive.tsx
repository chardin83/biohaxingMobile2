import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { type PlanCategory } from '@/components/plan/PlanCategoryIcon';
import ArchivedPlanSection from '@/components/sections/plan/ArchivedPlanSection';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';

const categories: Array<Exclude<PlanCategory, 'supplement'>> = ['training', 'nutrition', 'other'];

export default function ArchivedPlansScreen() {
  const { t } = useTranslation(['common', 'tips']);
  const { archivedPlans } = useStorage();

  const archivedPlanGroups = useMemo(
    () =>
      categories.map(category => ({
        category,
        plans: [...(archivedPlans[category] ?? [])].sort((left, right) =>
          (right.endedAt ?? right.startedAt).localeCompare(left.endedAt ?? left.startedAt)
        ),
      })),
    [archivedPlans]
  );

  const archivedPlanCount = archivedPlanGroups.reduce((count, group) => count + group.plans.length, 0);

  return (
    <Container background="gradient" showBackButton onBackPress={() => router.back()}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title">{t('plan.previousPlansTitle')}</ThemedText>
          <ThemedText type="explainer" style={styles.count}>
            {archivedPlanCount}
          </ThemedText>
        </View>

        {archivedPlanGroups.map(group => (
          <ArchivedPlanSection key={group.category} category={group.category} plans={group.plans} />
        ))}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  count: {
    opacity: 0.7,
  },
});
