/* eslint-disable @typescript-eslint/no-shadow */
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import SupplementList from '@/app/components/SupplementList';
import { useStorage } from '@/app/context/StorageContext';
import { Supplement } from '@/app/domain/Supplement';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';
import AppButton from '@/components/ui/AppButton';
import Badge from '@/components/ui/Badge';
import Container from '@/components/ui/Container';
import { NotFound } from '@/components/ui/NotFound';
import ProgressBarWithLabel from '@/components/ui/ProgressbarWithLabel';
import VerdictSelector from '@/components/VerdictSelector';
import { AIPromptKey, AIPrompts } from '@/constants/AIPrompts';
import { areas } from '@/locales/areas';
import { useSupplements } from '@/locales/supplements';
import { tips } from '@/locales/tips';
import { PlanCategory } from '@/types/planCategory';
import { POSITIVE_VERDICTS } from '@/types/verdict';

import ShowAllButton from './ShowAllButton';


  function getAreaIconColor(areaId: string, colors: any) {
  switch (areaId) {
    case 'energy':
      return colors.area.energy;
    case 'mind':
      return colors.area.mind;
    case 'sleepQuality':
      return colors.area.sleep;
    case 'nervousSystem':
      return colors.area.nervousSystem;
    case 'strength':
      return colors.area.strength;
    case 'digestiveHealth':
      return colors.area.digestiveHealth;
    case 'cardioFitness':
      return colors.area.cardio;
    case 'immuneSystem':
      return colors.area.immuneSystem;
    // Lägg till fler områden vid behov
    default:
      return colors.primary;
  }
}

export default function AreaDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { areaId, tipId } = useLocalSearchParams<{
    areaId: string;
    tipId?: string;
  }>();
  const supplements = useSupplements();
  const { addTipView, incrementTipChat, viewedTips, setTipVerdict, plans, setPlans, myLevel } = useStorage();

  React.useEffect(() => {
    if (areaId && tipId) {
      const xpGained = addTipView(areaId, tipId);
      if (xpGained > 0) {
        console.log(`🎉 You gained ${xpGained} XP for viewing this tip!`);
      }
    }
  }, [addTipView, areaId, tipId]);

  const mainArea = areas.find(g => g.id === areaId);
  const findTip = (localTipId: string | undefined, searchAreaId: string) => {
    return localTipId
      ? tips.find(tipItem => tipItem.id === localTipId)
      : tips.find(tipItem => tipItem.areas.some(a => a.id === searchAreaId));
  };

  const tip = findTip(tipId, areaId);

  const [showAllAreas, setShowAllAreas] = React.useState(false);

  const goalIcon = mainArea?.icon ?? 'target';
  const notFound = !mainArea || !tip;

  const descriptionKey = tip?.descriptionKey;
  const titleKey = tip?.title;

  const planCategory = tip?.planCategory;
  const getPlanCategories = (category: PlanCategory | PlanCategory[] | undefined): PlanCategory[] => {
    if (Array.isArray(category)) {
      return category;
    }
    if (category) {
      return [category];
    }
    return [];
  };

  const planCategories: PlanCategory[] = React.useMemo(
    () => getPlanCategories(tip?.planCategory),
    [tip?.planCategory]
  );

  const supplementPlans = React.useMemo(() => plans.supplements ?? [], [plans.supplements]);
  const trainingPlans = plans.training;
  const nutritionPlans = plans.nutrition;
  const availablePlanCategories = React.useMemo(() => {
    const options = planCategories;
    return options;
  }, [planCategories]);

  const isTrainingTip = availablePlanCategories.includes('training');
  const isNutritionTip = availablePlanCategories.includes('nutrition');
  const isOtherTip = availablePlanCategories.includes('other');
  const effectiveTipId = tipId ?? tip?.id ?? null;

    const handleAddTipPlanEntry = () => {
  if (!effectiveTipId) return;
  const targetCategory = getDefaultPlanCategory();
  if (!targetCategory) return;
  let listKey: keyof typeof plans;
  if (targetCategory === 'training') listKey = 'training';
  else if (targetCategory === 'nutrition') listKey = 'nutrition';
  else if (targetCategory === 'other') listKey = 'other';
  else return;
  setPlans(prev => {
    const existingList = prev[listKey] as any[];
    const exists = existingList.some(entry => entry.tipId === effectiveTipId && entry.planCategory === targetCategory);
    if (exists) return prev;
    const nextEntry = {
      tipId: effectiveTipId,
      startedAt: new Date().toISOString(),
      planCategory: targetCategory,
    };
    return {
      ...prev,
      [listKey]: [...existingList, nextEntry],
    };
  });
};

 
  let addPlanButtonTitle = '';
  if (isTrainingTip) {
    addPlanButtonTitle = t('goalDetails.addTrainingGoal');
  } else if (isNutritionTip) {
    addPlanButtonTitle = t('goalDetails.addNutritionGoal');
  } else if (isOtherTip) {
    addPlanButtonTitle = t('goalDetails.addOtherGoal'); // Lägg till denna översättning!
  }

  const getDefaultPlanCategory = React.useCallback(() => {
    if (typeof planCategory === 'string' && (planCategory === 'training' || planCategory === 'nutrition' || planCategory === 'other')) {
      return planCategory;
    }
    const fallbackOption = availablePlanCategories.find(option =>
      option === 'training' || option === 'nutrition' || option === 'other'
    );
    return fallbackOption;
  }, [planCategory, availablePlanCategories]);

  const isTipInPlanCategory = React.useCallback(
    (target: 'training' | 'nutrition' | 'other') => {
      if (!effectiveTipId) return false;
      const list = target === 'training' ? trainingPlans : target === 'nutrition' ? nutritionPlans : plans.other;
      return list.some(entry => entry.tipId === effectiveTipId && entry.planCategory === target);
    },
    [effectiveTipId, nutritionPlans, trainingPlans, plans.other]
  );

  const isTipInTrainingPlan = React.useMemo(() => isTipInPlanCategory('training'), [isTipInPlanCategory]);
  const isTipInNutritionPlan = React.useMemo(() => isTipInPlanCategory('nutrition'), [isTipInPlanCategory]);
  const isTipInOtherPlan = React.useMemo(() => isTipInPlanCategory('other'), [isTipInPlanCategory]);

  const currentTip = viewedTips?.find(v => v.mainGoalId === areaId && v.tipId === tipId);
  const askedQuestions = currentTip?.askedQuestions || [];
  const totalXpEarned = currentTip?.xpEarned || 0;
  const currentVerdict = currentTip?.verdict;
  const positiveVerdicts = React.useMemo(() => new Set(POSITIVE_VERDICTS), []);
  const isFavorite = React.useMemo(() => {
    if (!currentVerdict) return false;
    return positiveVerdicts.has(currentVerdict as any);
  }, [currentVerdict, positiveVerdicts]);

  const trainingRelationLabel = tip?.trainingRelation
    ? t(`common:goalDetails.trainingRelation.${tip.trainingRelation}`)
    : null;
  const preferredDayPartLabels = React.useMemo(() => {
    if (!tip?.preferredDayParts?.length) return [] as string[];
    return tip.preferredDayParts.map(part => t(`common:goalDetails.preferredDayParts.${part}`));
  }, [tip?.preferredDayParts, t]);
  const timeRuleLabel = tip?.timeRule ? t(`common:goalDetails.timeRules.${tip.timeRule}`) : null;
  const nutritionFoodsTitle = React.useMemo(() => {
    if (!tip?.id || !tip.nutritionFoods?.length) return null;
    return t(`tips:${tip.id}.nutritionFoods.title`, {
      defaultValue: t('plan.nutritionHeader'),
    });
  }, [tip?.id, tip?.nutritionFoods, t]);

  const nutritionFoodItems = React.useMemo(() => {
    if (!tip?.nutritionFoods?.length || !tip.id) return [] as { key: string; name: string; details: string }[];
    return tip.nutritionFoods.map(food => {
      const itemKey = food.key;
      const detailKey = food.detailsKey ?? itemKey;
      const name = t(`tips:${tip.id}.nutritionFoods.items.${itemKey}.name`, {
        defaultValue: itemKey,
      });
      const details = t(`tips:${tip.id}.nutritionFoods.items.${detailKey}.details`, {
        defaultValue: '',
      });
      return {
        key: `${itemKey}:${detailKey}`,
        name,
        details,
      };
    });
  }, [tip?.nutritionFoods, tip?.id, t]);

  const resolvedSupplements: Supplement[] = React.useMemo(() => {
    if (!tip?.supplements?.length) return [] as any[];
    return tip.supplements.map(ref => supplements?.find(s => s.id === ref.id)).filter(Boolean) as any[];
  }, [tip?.supplements, supplements]);

  const plannedSupplements = React.useMemo(() => {
    const ids = new Set<string>();
    const names = new Set<string>();
    (supplementPlans || []).forEach(plan => {
      if (Array.isArray(plan?.supplements)) {
        plan.supplements.forEach(entry => {
          const sup = entry?.supplement;
          if (sup?.id) ids.add(sup.id);
          if (sup?.name) names.add(sup.name);
        });
      }
    });
    return { ids, names };
  }, [supplementPlans]);

  const isTipSupplementScheduled = React.useMemo(() => {
    const refs = tip?.supplements || [];
    if (!refs.length) return false;
    return refs.some(ref => ref?.id && plannedSupplements.ids.has(ref.id));
  }, [tip?.supplements, plannedSupplements.ids]);

  const isTipInPlan = React.useMemo(() => {
    if (isTrainingTip && isTipInTrainingPlan) return true;
    if (isNutritionTip && isTipInNutritionPlan) return true;
    if (isOtherTip && isTipInOtherPlan) return true;
    if (isTipSupplementScheduled) return true;
    return false;
  }, [isTrainingTip, isNutritionTip, isTipInTrainingPlan, isTipInNutritionPlan, isOtherTip, isTipInOtherPlan, isTipSupplementScheduled]);


  const planBadgeLabel = React.useMemo(() => {
    if (isNutritionTip && isTipInNutritionPlan) {
      return t('goalDetails.alreadyInPlanNutrition');
    }
    if (isTrainingTip && isTipInTrainingPlan) {
      return t('goalDetails.alreadyInPlanTraining');
    }
    if (isOtherTip && isTipInOtherPlan) {
      return t('goalDetails.alreadyInPlanOther');
    }
    if (isTipSupplementScheduled) {
      return t('goalDetails.alreadyInPlanSupplement');
    }
    return t('goalDetails.alreadyInPlan');
  }, [isNutritionTip, isTipInNutritionPlan, isTrainingTip, isTipInTrainingPlan, isOtherTip, isTipInOtherPlan, isTipSupplementScheduled, t]);

  const showTopPlanAction = React.useMemo(() => {
    if (isTrainingTip) return true;
    if (isNutritionTip) return true;
    if (isOtherTip) return true;
    if (isTipInPlan) return true;
    return false;
  }, [isTrainingTip, isNutritionTip, isOtherTip, isTipInPlan]);

  const handleVerdictPress = (
    verdict: 'interested' | 'startNow' | 'wantMore' | 'alreadyWorks' | 'notInterested' | 'noResearch' | 'testedFailed'
  ) => {
    if (areaId && tipId) {
      const xpGained = setTipVerdict(areaId, tipId, verdict as any);
      if (xpGained > 0) {
        console.log(`🎉 You gained ${xpGained} XP for your verdict!`);
      }
    }
  };

  const maxChats = 3;
  const progress = Math.min(askedQuestions.length / maxChats, 1);
  const progressLabel =
    askedQuestions.length >= maxChats
      ? t('common:goalDetails.fullyExplored') || 'Fully Explored! 🎉'
      : `${askedQuestions.length}/${maxChats} questions explored`;

  const handleAIInsightPress = (questionKey: AIPromptKey) => {
    const tipTranslation = t(`tips:${titleKey}`);
    const informationTranslation = t(`tips:${descriptionKey}`) || '';
    const tipInfo = `Tip: ${tipTranslation}\nInformation: ${informationTranslation}`;
    let fullPrompt = '';
    if (questionKey === 'insights.studies') {
      fullPrompt = AIPrompts.insights.studies(tipInfo, t);
    } else if (questionKey === 'insights.experts') {
      fullPrompt = AIPrompts.insights.experts(tipInfo, t);
    } else if (questionKey === 'insights.risks') {
      fullPrompt = AIPrompts.insights.risks(tipInfo, t);
    }
    if (areaId && tipId) {
      const xpGained = incrementTipChat(areaId, tipId, questionKey.split('.')[1]);
      if (xpGained > 0) {
        console.log(`🎉 You gained ${xpGained} XP for exploring this question!`);
      } else {
        console.log(`ℹ️ You've already explored this question`);
      }
    }
    router.push({
      pathname: '/(tabs)/chat',
      params: {
        initialPrompt: fullPrompt,
        returnPath: `(tabs)/dashboard/area/${areaId}/details`,
        returnParams: JSON.stringify({ areaId, tipId }),
      },
    });
  };

  const isQuestionAsked = (questionType: string) => askedQuestions.includes(questionType);

  if (notFound) {
    return (
      <NotFound text="Goal not found." />
    );
  }

  return (
    <Container
      background="gradient"
      gradientLocations={colors.gradients?.sunrise?.locations3 as any}
      onBackPress={() => router.replace(`/dashboard/area/${areaId}`)}
      showBackButton
    >
      <View style={styles.topSection}>
        <ThemedText type="title" style={{ color: colors.primary }}>
          {t(`areas:${areaId}.title`)}
        </ThemedText>
        <View style={[styles.iconWrapper, { borderColor: colors.borderLight }]}>
          <Icon source={goalIcon} size={50} color={getAreaIconColor(areaId, colors)} />
          {tip?.level && (
            <Badge
              style={[
                styles.levelBadge,
                myLevel < tip.level ? styles.levelBadgeLocked : styles.levelBadgeUnlocked,
                { backgroundColor: colors.modalBackground }
              ]}
            >
              <ThemedText type="title3" style={{ color: colors.textLight }} uppercase numberOfLines={1}>
                {myLevel < tip.level ? '🔒 ' : ''}
                {t('general.level')} {tip.level}
              </ThemedText>
          </Badge>
          )}
        </View>
        <ThemedText type="subtitle" style={{ color: colors.primary }}>
          {resolvedSupplements[0]?.name ?? t(`tips:${titleKey}`)}
        </ThemedText>
        {isFavorite && (
          <View style={[styles.favoriteChip, { backgroundColor: colors.accentWeak }]}>
            <ThemedText type="caption" style={[styles.favoriteText, { color: colors.primary }]}>
              ★ {t('common:dashboard.favorite', 'Favorite')}
            </ThemedText>
          </View>
        )}
        <ThemedText type="caption">
          {totalXpEarned} XP earned
        </ThemedText>
        <ProgressBarWithLabel progress={progress} label={progressLabel} />
        <PlanActionSection
          showTopPlanAction={showTopPlanAction}
          isTipInPlan={isTipInPlan}
          planBadgeLabel={planBadgeLabel}
          addPlanButtonTitle={addPlanButtonTitle}
          handleAddPlanEntry={handleAddTipPlanEntry}
          styles={styles}
          colors={colors}
        />
      </View>
      {descriptionKey && (
        <AppBox title={t('common:goalDetails.information')}>
          <ThemedText type="explainer" style={styles.descriptionText}>
            {t(`tips:${descriptionKey}`)}
          </ThemedText>
        </AppBox>
      )}
      {trainingRelationLabel && (
        <AppBox title={t('common:goalDetails.trainingRelation.title')}>
          <ThemedText type="caption" style={styles.metaText}>{trainingRelationLabel}</ThemedText>
        </AppBox>
      )}
      {preferredDayPartLabels.length > 0 && (
        <AppBox title={t('common:goalDetails.preferredDayParts.title')}>
          {preferredDayPartLabels.map(label => (
            <ThemedText key={label} type="caption" style={styles.metaText}>
              • {label}
            </ThemedText>
          ))}
        </AppBox>
      )}
      {timeRuleLabel && (
        <AppBox title={t('common:goalDetails.timeRules.title')}>
          <ThemedText type="caption" style={styles.metaText}>{timeRuleLabel}</ThemedText>
        </AppBox>
      )}
      <NutritionFoodsSection
        tip={tip}
        nutritionFoodItems={nutritionFoodItems}
        nutritionFoodsTitle={nutritionFoodsTitle}
        isTipInPlan={isTipInPlan}
        planBadgeLabel={planBadgeLabel}
        handleAddTipPlanEntry={handleAddTipPlanEntry}
        styles={styles}
        colors={colors}
      />
      <AreaRelevanceSection
        tip={tip}
        areaId={areaId}
        showAllAreas={showAllAreas}
        setShowAllAreas={setShowAllAreas}
        effectiveTipId={effectiveTipId}
        addTipView={addTipView}
        styles={styles}
        colors={colors}
      />
      <AIInsightsSection
        handleAIInsightPress={handleAIInsightPress}
        isQuestionAsked={isQuestionAsked}
        styles={styles}
        colors={colors}
      />
      <VerdictSelector currentVerdict={currentVerdict} onVerdictPress={handleVerdictPress} />
      {(
        resolvedSupplements.length > 0 ||
        (supplementPlans?.some(p => Array.isArray(p.supplements) && p.supplements.length > 0))
      ) && (
        <AppBox title={t('common:goalDetails.supplements')}>
          <SupplementList
            supplements={resolvedSupplements}
            plannedSupplements={plannedSupplements}
            supplementPlans={supplementPlans}
          />
        </AppBox>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  topSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
  position: 'absolute',
  bottom: -20,
  zIndex: 2,
  },
  levelBadgeLocked: {
    minWidth: 120, // bredare för lås
    right: -88,
  },
  levelBadgeUnlocked: {
    minWidth: 90, // smalare utan lås
    right: -55,
  },
  planActionContainer: {
    width: '100%',
    marginTop: 16,
    alignSelf: 'stretch',
  },
  nutritionPlanAction: {
    marginTop: 12,
  },
  planActionButton: {
    alignSelf: 'stretch',
  },
  planActionAdded: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  planActionAddedText: {
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  favoriteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 6,
  },
  favoriteText: {
    fontWeight: '700',
  },
  goalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 20,
  },
  subTitle: {
    fontSize: 20,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 'auto',
  },
  analyzeWrapper: {
    alignItems: 'center',
    flexDirection: 'column',
    maxWidth: 180,
  },
  disabledHint: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  insightButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  insightButtonAsked: {
    opacity: 0.7,
  },
  insightText: {
    fontSize: 16,
  },
  relevanceHeading: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  showAllButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    marginTop: -10,
    marginBottom: 40,
  },
  showAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addToCalendarText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  metaText: {
    fontSize: 16,
    marginBottom: 4,
  },
  nutritionItem: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  nutritionDetailText: {
    opacity: 0.8,
    fontSize: 14,
    marginLeft: 18,
    marginTop: -2,
  },
  descriptionText: {
    marginBottom: 8,
  },
});

function NutritionFoodsSection({
  tip,
  nutritionFoodItems,
  nutritionFoodsTitle,
  isTipInPlan,
  planBadgeLabel,
  handleAddTipPlanEntry,
  styles,
  colors,
}: {
  tip: typeof tips[number] | undefined;
  nutritionFoodItems: { key: string; name: string; details: string }[];
  nutritionFoodsTitle: string | null;
  isTipInPlan: boolean;
  planBadgeLabel: string;
  handleAddTipPlanEntry: () => void;
  styles: { [key: string]: any };
  colors: any;
}) {
  const { t } = useTranslation();
  if (!tip?.nutritionFoods?.length || !nutritionFoodsTitle) return null;
  return (
    <AppBox title={nutritionFoodsTitle}>
      {nutritionFoodItems.map(({ key, name, details }) => (
        <View key={key} style={styles.nutritionItem}>
          <ThemedText type="caption" style={styles.metaText}>• {name}</ThemedText>
          {details ? <ThemedText type="caption" style={styles.nutritionDetailText}>{details}</ThemedText> : null}
        </View>
      ))}
      <View style={[styles.planActionContainer, styles.nutritionPlanAction]}>
        {isTipInPlan ? (
          <View style={[styles.planActionAdded, { backgroundColor: colors.accentVeryWeak }]}>
            <Icon source="check" size={18} color={colors.primary} />
            <ThemedText type="caption" style={[styles.planActionAddedText, { color: colors.primary }]}>
              {planBadgeLabel}
            </ThemedText>
          </View>
        ) : (
          <AppButton
            title={t('goalDetails.addNutritionGoal')}
            onPress={handleAddTipPlanEntry}
            variant="primary"
            style={styles.planActionButton}
          />
        )}
      </View>
    </AppBox>
  );
}

type PlanActionSectionProps = {
  showTopPlanAction: boolean;
  isTipInPlan: boolean;
  planBadgeLabel: string;
  addPlanButtonTitle: string;
  handleAddPlanEntry: () => void;
  styles: { [key: string]: any };
  colors: any;
};

function PlanActionSection({
  showTopPlanAction,
  isTipInPlan,
  planBadgeLabel,
  addPlanButtonTitle,
  handleAddPlanEntry,
  styles,
  colors,
}: PlanActionSectionProps) {
  if (!showTopPlanAction) return null;
  return (
    <View style={styles.planActionContainer}>
      {isTipInPlan ? (
        <View style={[styles.planActionAdded, { backgroundColor: colors.accentVeryWeak }]}>
          <Icon source="check" size={18} color={colors.primary} />
          <ThemedText type="caption" style={[styles.planActionAddedText, { color: colors.primary }]}>
            {planBadgeLabel}
          </ThemedText>
        </View>
      ) : (
        <AppButton
          title={addPlanButtonTitle}
          onPress={handleAddPlanEntry}
          variant="primary"
          style={styles.planActionButton}
        />
      )}
    </View>
  );
}

type AreaRelevanceSectionProps = {
  tip: typeof tips[number] | undefined;
  areaId: string;
  showAllAreas: boolean;
  setShowAllAreas: React.Dispatch<React.SetStateAction<boolean>>;
  effectiveTipId: string | null;
  addTipView: (areaId: string, tipId: string) => number;
  styles: { [key: string]: any };
  colors: any;
};

function AreaRelevanceSection({
  tip,
  areaId,
  showAllAreas,
  setShowAllAreas,
  effectiveTipId,
  addTipView,
  styles,
  colors,
}: AreaRelevanceSectionProps) {
  const { t } = useTranslation();
  if (!tip?.areas?.length) return null;
  return (
    <>
      <ThemedText type="subtitle" style={[styles.relevanceHeading, { color: colors.textPrimary }]}>
        {t('common:goalDetails.relevance')}
      </ThemedText>
      {(showAllAreas ? tip.areas : tip.areas.filter(a => a.id === areaId)).map(a => {
        const areaTitle = t(`areas:${a.id}.title`);
        return (
          <AppBox key={a.id} title={areaTitle}>
            <ThemedText type="explainer" style={styles.descriptionText}>
              {t(`tips:${a.descriptionKey}`)}
            </ThemedText>
          </AppBox>
        );
      })}
      {tip.areas.length > 1 && (
        <ShowAllButton
          showAll={showAllAreas}
          onPress={() => {
            setShowAllAreas(v => {
              const next = !v;
              if (next && effectiveTipId && tip?.areas?.length) {
                tip.areas.forEach(a => {
                  if (a.id !== areaId) {
                    const xpGained = addTipView(a.id, effectiveTipId);
                    if (xpGained > 0) {
                      console.log(`🎉 You gained ${xpGained} XP for viewing tip in area ${a.id} via Show All`);
                    }
                  }
                });
              }
              return next;
            });
          }}
          style={styles.showAllButton}
          textStyle={styles.showAllText}
          accentColor={colors.accentDefault}
        />
      )}
    </>
  );
}

function AIInsightsSection({
  handleAIInsightPress,
  isQuestionAsked,
  styles,
  colors,
}: {
  handleAIInsightPress: (questionKey: AIPromptKey) => void;
  isQuestionAsked: (questionType: string) => boolean;
  styles: { [key: string]: any };
  colors: any;
}) {
  const { t } = useTranslation();
  return (
    <AppBox title={t(`common:goalDetails.aiInsights`)}>
      <Pressable
        onPress={() => handleAIInsightPress('insights.studies')}
        style={[
          styles.insightButton,
          { backgroundColor: colors.accentVeryWeak, borderColor: colors.accentMedium },
          isQuestionAsked('studies') && [styles.insightButtonAsked, { backgroundColor: colors.accentWeak }],
        ]}
      >
        <ThemedText type="caption" style={[styles.insightText, { color: colors.textLight }]}>
          {isQuestionAsked('studies') ? '✅' : '📚'} {t('common:goalDetails.whatStudiesExist')}
          {!isQuestionAsked('studies') && ' (+5 XP)'}
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={() => handleAIInsightPress('insights.experts')}
        style={[
          styles.insightButton,
          { backgroundColor: colors.accentVeryWeak, borderColor: colors.accentMedium },
          isQuestionAsked('experts') && [styles.insightButtonAsked, { backgroundColor: colors.accentWeak }],
        ]}
      >
        <ThemedText type="caption" style={[styles.insightText, { color: colors.textLight }]}>
          {isQuestionAsked('experts') ? '✅' : '👥'} {t('common:goalDetails.whoAreTheExperts')}
          {!isQuestionAsked('experts') && ' (+5 XP)'}
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={() => handleAIInsightPress('insights.risks')}
        style={[
          styles.insightButton,
          { backgroundColor: colors.accentVeryWeak, borderColor: colors.accentMedium },
          isQuestionAsked('risks') && [styles.insightButtonAsked, { backgroundColor: colors.accentWeak }],
        ]}
      >
        <ThemedText type="caption" style={[styles.insightText, { color: colors.textLight }]}>
          {isQuestionAsked('risks') ? '✅' : '⚠️'} {t('common:goalDetails.whatAreTheRisks')}
          {!isQuestionAsked('risks') && ' (+5 XP)'}
        </ThemedText>
      </Pressable>
    </AppBox>
  );
}
