import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { type ArchivedPlanTipEntry, type ArchivedSupplementPlanEntry } from '@/app/context/StorageContext';
import { Collapsible } from '@/components/Collapsible';
import PlanCategoryIcon, { getPlanCategoryIconColor, type PlanCategory } from '@/components/plan/PlanCategoryIcon';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol.ios';
import { formatDate, formatDateRange, getInclusiveDayCount } from '@/utils/dateUtils';

type ArchivedPlanSectionProps = {
  category: PlanCategory;
  plans: ArchivedPlanTipEntry[] | ArchivedSupplementGroup[];
};

export type ArchivedSupplementGroup = {
  supplement: ArchivedSupplementPlanEntry['supplement'];
  entries: ArchivedSupplementPlanEntry[];
};

export function ArchivedPlanSection({ category, plans }: Readonly<ArchivedPlanSectionProps>) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation(['common', 'tips']);
  const categoryTitle = category === 'supplement' ? t('plan.supplementSectionTitle') : t(`plan.${category}Header`);

  return (
    <Collapsible
      title={categoryTitle}
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
            (() => {
              const supplementGroup = plan as ArchivedSupplementGroup;
              const dates = category === 'supplement'
                ? { startedAt: supplementGroup.entries[0]?.startedAt ?? '', endedAt: supplementGroup.entries[0]?.endedAt ?? '' }
                : { startedAt: (plan as ArchivedPlanTipEntry).startedAt, endedAt: (plan as ArchivedPlanTipEntry).endedAt ?? '' };
              const tipPlan = plan as ArchivedPlanTipEntry;
              const tipTitle = t(`tips:${tipPlan.tipId}.title`, { defaultValue: tipPlan.tipId });
              const cardKey = category === 'supplement'
                ? [supplementGroup.supplement.id, supplementGroup.supplement.name].join('-')
                : tipPlan.id ?? [tipPlan.tipId, dates.startedAt].join('-');

              return (
            <Card
              key={cardKey}
              style={[styles.planCard, { borderLeftColor: getPlanCategoryIconColor(category, colors) }]}
            >
              <TouchableOpacity
                style={styles.planCardButton}
                onPress={() => {
                  if (category === 'supplement') return;
                  router.push({
                    pathname: '/plan/[tipId]',
                    params: {
                      tipId: tipPlan.tipId,
                      planId: tipPlan.id,
                      title: t(`tips:${tipPlan.tipId}.title`, { defaultValue: tipPlan.tipId }),
                      startedAt: tipPlan.startedAt,
                      createdBy: tipPlan.createdBy,
                      comment: tipPlan.comment ?? '',
                      planCategory: tipPlan.planCategory,
                    },
                  });
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={category === 'supplement' ? supplementGroup.supplement.name : tipTitle}
              >
                <View style={styles.titleRow}>
                  <ThemedText type="title3" style={styles.planTitle}>
                    {category === 'supplement'
                      ? supplementGroup.supplement.name
                      : tipTitle}
                  </ThemedText>

                  {category !== 'supplement' && <IconSymbol name="chevron.right" size={16} color={colors.icon} />}
                </View>
                {category === 'supplement'
                  ? supplementGroup.entries.map(entry => {
                      const dayCount = getInclusiveDayCount(entry.startedAt, entry.endedAt);
                      const durationKey = dayCount > 1 ? 'plan.previousPlansDuration_plural' : 'plan.previousPlansDuration';
                      return (
                        <ThemedText key={`${entry.startedAt}-${entry.endedAt}`} type="caption" style={styles.dateRange}>
                          {formatDateRange(entry.startedAt, entry.endedAt, i18n.language)} · {t(durationKey, { count: dayCount })} <IconSymbol name="clock" size={12} color={colors.icon} /> {entry.prefferedTime}
                        </ThemedText>
                      );
                    })
                  : (
                    <ThemedText type="caption" style={styles.dateRange}>
                      {dates.startedAt && dates.endedAt
                        ? `${formatDateRange(dates.startedAt, dates.endedAt, i18n.language)} · ${(() => {
                            const dayCount = getInclusiveDayCount(dates.startedAt, dates.endedAt);
                            const durationKey = dayCount > 1 ? 'plan.previousPlansDuration_plural' : 'plan.previousPlansDuration';
                            return t(durationKey, { count: dayCount });
                          })()}`
                        : t('plan.previousPlansNoDates')}
                    </ThemedText>
                  )}
              </TouchableOpacity>
            </Card>
              );
            })()
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
