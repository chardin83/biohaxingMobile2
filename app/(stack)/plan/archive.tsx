import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { type ArchivedPlanTipEntry, useStorage } from '@/app/context/StorageContext';
import { type PlanCategory } from '@/components/plan/PlanCategoryIcon';
import ArchivedPlanSection, { type ArchivedSupplementGroup } from '@/components/sections/plan/ArchivedPlanSection';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';

const categories: PlanCategory[] = ['training', 'nutrition', 'supplement', 'other'];

type ArchivedPlanGroup =
  | { category: 'supplement'; plans: ArchivedSupplementGroup[] }
  | { category: 'training' | 'nutrition' | 'other'; plans: ArchivedPlanTipEntry[] };

export default function ArchivedPlansScreen() {
  const { t } = useTranslation(['common', 'tips']);
  const { archivedPlans } = useStorage();

  const archivedPlanGroups = useMemo(
    (): ArchivedPlanGroup[] => categories.map(category => {
      if (category === 'supplement') {
        const groups = new Map<string, ArchivedSupplementGroup>();
        archivedPlans.supplements.forEach(entry => {
          const key = entry.supplement.id;
          const existing = groups.get(key);
          if (existing) {
            existing.entries.push(entry);
          } else {
            groups.set(key, { supplement: entry.supplement, entries: [entry] });
          }
        });

        return {
          category,
          plans: Array.from(groups.values()),
        };
      }

      return {
        category,
        plans: [...archivedPlans[category]].sort((left, right) =>
          right.endedAt.localeCompare(left.endedAt)
        ),
      };
    }),
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
