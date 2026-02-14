import React, { useCallback,useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Portal } from 'react-native-paper';

import { PlanTipEntry, useStorage } from '@/app/context/StorageContext';
import NutritionSettingsModal from '@/components/modals/NutritionSettingsModal';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';
import Badge from '@/components/ui/Badge';
import PlanEditActions from '@/components/ui/PlanEditActions';
import { useSupplementMap } from '@/locales/supplements';
import { Tip,tips } from '@/locales/tips';

import { IconSymbol } from './ui/IconSymbol';

type Props = {
  colors: any;
  styles: any;
  formatDate: (isoDate: string) => string;
  PlanMeta: React.FC<any>;
};

export const NutritionPlanSection: React.FC<Props> = ({ colors, styles, formatDate, PlanMeta }) => {
  const { t } = useTranslation(['common', 'areas', 'tips']);
  const { plans, setPlans } = useStorage();
  const supplementMap = useSupplementMap();

  const nutritionPlans = plans.nutrition;

  const [expandedNutritionTips, setExpandedNutritionTips] = useState<Record<string, boolean>>({});
  const [nutritionSettingsVisible, setNutritionSettingsVisible] = useState(false);
  const [nutritionSettingsTitle, setNutritionSettingsTitle] = useState<string | null>(null);
  const [nutritionCommentInput, setNutritionCommentInput] = useState('');
  const [nutritionEditTipId, setNutritionEditTipId] = useState<string | null>(null);

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

  const openNutritionSettingsModal = (tipId: string, nutritionTitle?: string | null) => {
    setNutritionEditTipId(tipId);
    setNutritionSettingsTitle(nutritionTitle ?? null);
    const plan = nutritionPlans.find(g => g.tipId === tipId);
    setNutritionCommentInput(plan?.comment ?? '');
    setNutritionSettingsVisible(true);
  };

  const closeNutritionSettingsModal = () => {
    setNutritionSettingsVisible(false);
    setNutritionSettingsTitle(null);
    setNutritionCommentInput('');
    setNutritionEditTipId(null);
  };

  const handleSaveNutritionSettings = () => {
    if (!nutritionEditTipId) {
      closeNutritionSettingsModal();
      return;
    }
    setPlans(prev => ({
      ...prev,
      nutrition: prev.nutrition.map(plan =>
        plan.tipId === nutritionEditTipId
          ? { ...plan, comment: nutritionCommentInput, editedAt: new Date().toISOString(), editedBy: 'you' }
          : plan
      ),
    }));
    closeNutritionSettingsModal();
  };

  const handleDeleteNutrition = () => {
    if (!nutritionEditTipId) {
      closeNutritionSettingsModal();
      return;
    }
    setPlans(prev => ({
      ...prev,
      nutrition: prev.nutrition.filter(plan => plan.tipId !== nutritionEditTipId),
    }));
    closeNutritionSettingsModal();
  };

  if (!nutritionGroups.length) {
    return (
      <ThemedText type="default">
        {t('nutritionPlanSection.noActiveNutrition')}
      </ThemedText>
    );
  }

  function handleEditNutrition(plan: PlanTipEntry | undefined, tipId: string, title?: string | null): void {
    openNutritionSettingsModal(tipId, title ?? plan?.tipId ?? null);
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
            defaultValue: itemKey,
          });
          const details = t(`tips:${tipId}.nutritionFoods.items.${detailKey}.details`, {
            defaultValue: '',
          });
          return {
            key: `${tipId}-${itemKey}-${detailKey}`,
            name,
            details,
          };
        });
        const maxVisibleFoods = 2;
        const isExpanded = !!expandedNutritionTips[tipId];
        const visibleFoodItems = isExpanded ? foodItems : foodItems.slice(0, maxVisibleFoods);
        const hiddenCount = Math.max(foodItems.length - maxVisibleFoods, 0);
        const hasExtraFoods = hiddenCount > 0;
        const arrowRotation = isExpanded ? '-90deg' : '0deg';

        const editAction = (
          <PlanEditActions
            onEdit={() => handleEditNutrition(plan, tipId, tipTitle)}
            editLabel={t('nutritionPlanSection.editNutritionSettings')}
            style={styles.planHeaderActions}
          />
        );

        return (
          <AppBox key={tipId} title={tipTitle} headerRight={editAction}>
            {plan?.startedAt && <PlanMeta startedAt={plan.startedAt} t={t} formatDate={formatDate} />}
            {recommendedDoseLabel && (
              <ThemedText type="default" style={styles.recommendedDose}>
                {recommendedDoseLabel}
              </ThemedText>
            )}
            {/* Visa kommentar om den finns */}
            {plan?.comment ? (
              <ThemedText type="default" style={{ marginBottom: 8 }}>
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
          </AppBox>
        );
      })}
      <Portal>
        <NutritionSettingsModal
          visible={nutritionSettingsVisible}
          title={t('nutritionPlanSection.nutritionSettingsTitle')}
          nutritionTitle={nutritionSettingsTitle}
          commentPlaceholder={t('nutritionPlanSection.nutritionCommentPlaceholder')}
          commentLabel={t('nutritionPlanSection.nutritionCommentLabel')}
          commentValue={nutritionCommentInput}
          onChangeComment={setNutritionCommentInput}
          onSave={handleSaveNutritionSettings}
          onClose={closeNutritionSettingsModal}
          onDelete={handleDeleteNutrition}
          saveLabel={t('general.save')}
          cancelLabel={t('general.cancel')}
          deleteLabel={t('general.delete')}
        />
      </Portal>
    </>
  );
};