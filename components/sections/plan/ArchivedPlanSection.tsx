import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { type ArchivedPlanTipEntry } from '@/app/context/StorageContext';
import { Collapsible } from '@/components/Collapsible';
import PlanCategoryIcon, { getPlanCategoryIconColor, type PlanCategory } from '@/components/plan/PlanCategoryIcon';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol.ios';
import { formatDate, getInclusiveDayCount } from '@/utils/dateUtils';

type ArchivedPlanSectionProps = {
  category: Exclude<PlanCategory, 'supplement'>;
  plans: ArchivedPlanTipEntry[];
};

export function ArchivedPlanSection({ category, plans }: Readonly<ArchivedPlanSectionProps>) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation(['common', 'tips']);

  return (
    <Collapsible
      title={t(`plan.${category}Header`)}
      leftContent={<PlanCategoryIcon category={category} />}
      rightContent={
        <View style={[styles.countBadge, { backgroundColor: colors.planSectionBadgeBackground, borderColor: colors.planSectionBadgeBorder }]}>
          <ThemedText type="caption" style={{ color: colors.planSectionBadgeText }}>
            {plans.length}
          </ThemedText>
        </View>
      }
      chevronPosition="right"
      titleType="title3"
      initialCollapsed={false}
    >
      {plans.length ? (
        <View style={styles.plansList}>
          {plans.map(plan => (
            <Card
              key={plan.id ?? `${plan.tipId}-${plan.startedAt}`}
              style={[styles.planCard, { borderLeftColor: getPlanCategoryIconColor(category, colors) }]}
            >
              <TouchableOpacity
                style={styles.planCardButton}
                onPress={() =>
                  router.push({
                    pathname: '/plan/[tipId]',
                    params: {
                      tipId: plan.tipId,
                      planId: plan.id,
                      title: t(`tips:${plan.tipId}.title`, { defaultValue: plan.tipId }),
                      startedAt: plan.startedAt,
                      createdBy: plan.createdBy,
                      comment: plan.comment ?? '',
                      planCategory: plan.planCategory,
                    },
                  })
                }
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t(`tips:${plan.tipId}.title`, { defaultValue: plan.tipId })}
              >
                <View style={styles.titleRow}>
                  <ThemedText type="title3" style={styles.planTitle}>
                    {t(`tips:${plan.tipId}.title`, { defaultValue: plan.tipId })}
                  </ThemedText>

                  <IconSymbol name="chevron.right" size={16} color={colors.icon} />
                </View>
                <ThemedText type="caption" style={styles.dateRange}>
                  {formatDate(plan.startedAt, i18n.language)} - {formatDate(plan.endedAt, i18n.language)}
                  {' · '}
                  {(() => {
                    const dayCount = getInclusiveDayCount(plan.startedAt, plan.endedAt);
                    const durationKey = dayCount > 1 ? 'plan.previousPlansDuration_plural' : 'plan.previousPlansDuration';
                    return t(durationKey, { count: dayCount });
                  })()}
                </ThemedText>
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      ) : (
        <ThemedText type="caption" style={styles.emptyText}>
          {t(`plan.previousPlansEmpty${category.charAt(0).toUpperCase()}${category.slice(1)}`)}
        </ThemedText>
      )}
    </Collapsible>
  );
}

export default ArchivedPlanSection;

const styles = StyleSheet.create({
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 999,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 6,
  },
  plansList: {
    gap: 10,
  },
  planCard: {
    borderWidth: 0,
    borderLeftWidth: 6,
    borderRadius: 16,
    paddingLeft: 12,
  },
  planCardButton: {
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
      alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  planTitle: {
    flex: 1,
    textTransform: 'uppercase',
  },
  dateRange: {
    opacity: 0.75,
  },
  emptyText: {
    opacity: 0.7,
  },
});
