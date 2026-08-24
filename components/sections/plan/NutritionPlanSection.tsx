import { useRouter } from 'expo-router';
import React, { useCallback,useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { PlanTipEntry, useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { PlanMeta } from '@/components/sections/plan/PlanMeta';
import { ThemedText } from '@/components/ThemedText';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import DiscreetButton from '@/components/ui/DiscreetButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useSupplementMap } from '@/locales/supplements';
import { Tip,tips } from '@/locales/tips';

type Props = {
  colors: any;
};

export const NutritionPlanSection: React.FC<Props> = ({ colors }) => {
  const { t } = useTranslation(['common', 'areas', 'tips']);
  const router = useRouter();
  const { plans } = useStorage();
  const supplementMap = useSupplementMap();

  const nutritionPlans = plans.nutrition;

  const [expandedNutritionTips, setExpandedNutritionTips] = useState<Record<string, boolean>>({});

  const nutritionGroups = useMemo(() => {
    const tipIds = new Set<string>();
    nutritionPlans.forEach(plan => {
      if (plan.tipId) tipIds.add(plan.tipId);
    });
    return Array.from(tipIds).map(tipId => ({ tipId }));
  }, [nutritionPlans]);

  const getRecommendedDoseLabel = useCallback(
    (tip?: Tip) => {
      if (!tip?.supplements?.length) return null;
      for (const reference of tip.supplements) {
        if (!reference.id) continue;
        const suppMeta = supplementMap.get(reference.id);
        if (suppMeta?.quantity) {
          const unit = suppMeta.unit ? ` ${suppMeta.unit}` : '';
          const dose = `${suppMeta.quantity}${unit}`.trim();
          if (dose.length > 0) {
            return t('plan.recommendedDose', { dose });
          }
        }
      }
      return null;
    },
    [supplementMap, t]
  );

  const toggleNutritionFoods = useCallback((tipId: string) => {
    setExpandedNutritionTips(prev => ({
      ...prev,
      [tipId]: !prev[tipId],
    }));
  }, []);


  const openPlanDetails = (tipId: string, plan?: PlanTipEntry, title?: string | null, foodItems?: Array<{ name: string; details?: string; imageKey?: string }>, recommendedDoseLabel?: string | null) => {
    if (!tipId) return;
    const cardData = JSON.stringify({
      foodItems: foodItems ?? [],
      recommendedDoseLabel: recommendedDoseLabel ?? undefined,
      comment: plan?.comment ?? '',
    });

    router.push({
      pathname: '/plan/[tipId]',
      params: {
        tipId,
        planId: plan?.id,
        title: title ?? t(`tips:${tipId}.title`),
        startedAt: plan?.startedAt ?? '',
        createdBy: plan?.createdBy ?? '',
        comment: plan?.comment ?? '',
        planCategory: 'nutrition',
        cardData,
      },
    });
  };

  if (!nutritionGroups.length) {
    return (
      <ThemedText type="default">
        {t('nutritionPlanSection.noActiveNutrition')}
      </ThemedText>
    );
  }



  return (
    <>
      {nutritionGroups.map(({ tipId }) => {
        const tip = tips.find(candidate => candidate.id === tipId);
        const tipTitle = t(`tips:${tipId}.title`, {
          // ingen defaultValue
        });
        const recommendedDoseLabel = getRecommendedDoseLabel(tip);

        const plan = nutritionPlans.find(g => g.tipId === tipId);

        const foodItems = (tip?.nutritionFoods ?? []).map(food => {
          const itemKey = food.key;
          const detailKey = food.detailsKey ?? itemKey;
          const name = t(`tips:${tipId}.nutritionFoods.items.${itemKey}.name`, {
            defaultValue: t(`food:foods.${itemKey}.name`, { defaultValue: itemKey }),
          });
          const details = t(`tips:${tipId}.nutritionFoods.items.${detailKey}.details`, {
            defaultValue: '',
          });
          return {
            key: `${tipId}-${itemKey}-${detailKey}`,
            name,
            details,
            imageKey: itemKey,
            foodKey: itemKey,
            detailsKey: detailKey,
          };
        });
        const maxVisibleFoods = 2;
        const isExpanded = !!expandedNutritionTips[tipId];
        const visibleFoodItems = isExpanded ? foodItems : foodItems.slice(0, maxVisibleFoods);
        const hiddenCount = Math.max(foodItems.length - maxVisibleFoods, 0);
        const hasExtraFoods = hiddenCount > 0;
        const arrowRotation = isExpanded ? '-90deg' : '0deg';

        return (
          <Card
            key={tipId}
            style={[
              styles.nutritionGoalCard,
              { borderLeftColor: colors.planSectionNutritionIcon },
            ]}
          >
            <View style={styles.nutritionCardHeaderRow}>
              <TouchableOpacity
                style={styles.nutritionCardHeaderMain}
                onPress={() => openPlanDetails(tipId, plan, tipTitle, foodItems, recommendedDoseLabel)}
                activeOpacity={0.85}
              >
                <IconSymbol name="flame" size={18} color={colors.planSectionNutritionIcon} />
                  <ThemedText type="title3" style={[styles.nutritionCardTitle, { color: colors.planSectionNutritionIcon }]}>
                    {tipTitle}
                  </ThemedText>
                <IconSymbol name="chevron.right" size={16} color={colors.icon} />
              </TouchableOpacity>
            </View>
            {plan?.startedAt && (
              <PlanMeta
                startedAt={plan.startedAt}
                createdBy={plan.createdBy}
              />
            )}
            {recommendedDoseLabel && (
              <ThemedText type="default" style={styles.recommendedDose}>
                {recommendedDoseLabel}
              </ThemedText>
            )}
            {/* Visa kommentar om den finns */}
            {plan?.comment ? (
              <ThemedText type="default" style={styles.commentText}>
                {plan.comment}
              </ThemedText>
            ) : null}
            {!!foodItems.length && (
              <View style={styles.badgeRow}>
                {visibleFoodItems.map(({ key, name, details }) => (
                  <Badge key={`food-${key}`} variant="overlay">
                    <View>
                      <ThemedText type="defaultSemiBold">
                        {name}
                      </ThemedText>
                      {!!details && isExpanded && (
                        <ThemedText type="default" style={styles.badgeDetail}>
                          {details}
                        </ThemedText>
                      )}
                    </View>
                  </Badge>
                ))}
                {hasExtraFoods && (
                  <Badge
                    key={`toggle-${tipId}`}
                    variant="overlay"
                    style={styles.toggleBadge}
                    onPress={() => toggleNutritionFoods(tipId)}
                  >
                    <ThemedText type="default">
                      {isExpanded
                        ? t('general.showLess')
                        : t('nutritionPlanSection.showMoreNutritionFoods', { count: hiddenCount })}
                    </ThemedText>
                     <IconSymbol
                      name="chevron.right"
                      size={18}
                      color={colors.icon}
                      style={[styles.toggleBadgeIcon, { transform: [{ rotate: arrowRotation }] }]}
                    />
                  </Badge>
                )}
              </View>
            )}
          </Card>
        );
      })}
      <View style={styles.addNutritionButtonWrap}>
        <DiscreetButton
          title={`+ ${t('general.add')}`}
          onPress={() => {
            router.push({
              pathname: '/(tabs)/search',
              params: {
                planCategories: 'nutrition',
              },
            });
          }}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  nutritionGoalCard: {
    borderWidth: 0,
    borderLeftWidth: 6,
    borderRadius: globalStyles.borders.borderRadius,
    paddingLeft: 12,
  },
  nutritionCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nutritionCardHeaderMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 2,
  },
  nutritionCardTitle: {
    textTransform: 'uppercase',
  },
  nutritionCardHeaderRight: {
    marginLeft: 12,
  },
  recommendedDose: {
    marginBottom: 8,
  },
  commentText: {
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  badgeDetail: {
    marginTop: 4,
  },
  toggleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBadgeIcon: {
    marginLeft: 6,
  },
  addNutritionButtonWrap: {
    marginTop: 4,
    alignItems: 'center',
  },
});