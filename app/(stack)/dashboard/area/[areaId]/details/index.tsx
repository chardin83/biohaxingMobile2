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
import { globalStyles } from '@/app/theme/globalStyles';
import AreaRelevanceSection from '@/components/sections/AreaRelevanceSection';
import DetailsTopSection from '@/components/sections/DetailsTopSection';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';
import AppButton from '@/components/ui/AppButton';
import Container from '@/components/ui/Container';
import { NotFound } from '@/components/ui/NotFound';
import VerdictSelector from '@/components/VerdictSelector';
import { AIPromptKey, AIPrompts } from '@/constants/AIPrompts';
import { XP_FOR_CHAT_QUESTION, XP_FOR_VERDICT, XP_FOR_VIEW } from '@/constants/XP';
import { areas } from '@/locales/areas';
import { metrics, tipMetricLinks } from '@/locales/metrics';
import { useSupplements } from '@/locales/supplements';
import { tips } from '@/locales/tips';
import { PlanCategory } from '@/types/planCategory';
import { POSITIVE_VERDICTS } from '@/types/verdict';

export default function AreaDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { areaId, tipId, expandAreas } = useLocalSearchParams<{
    areaId: string;
    tipId?: string;
    expandAreas?: string;
  }>();
  const shouldExpandAreas = expandAreas === '1';
  const supplements = useSupplements();
  const { addTipView, incrementTipChat, viewedTips, setTipVerdict, plans, setPlans, myLevel, nutritionXpClaims } = useStorage();

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

  const [showAllAreas, setShowAllAreas] = React.useState(shouldExpandAreas);

  React.useEffect(() => {
    setShowAllAreas(shouldExpandAreas);
  }, [areaId, tipId, shouldExpandAreas]);

  let infoText = '';
  if (myLevel < (tip?.level ?? 0)) {
    infoText = t('goalDetails.lockedTipInfo');
  } else if (tip?.level === 1) {
    infoText = t('goalDetails.basicTipInfo');
  } else {
    infoText = t('goalDetails.unlockedTipInfo'); // Lägg till denna översättning!
  }
  
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
        createdBy: 'you',
        editedAt: new Date().toISOString(),
        editedBy: 'you',
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
      let list;
      if (target === 'training') {
        list = trainingPlans;
      } else if (target === 'nutrition') {
        list = nutritionPlans;
      } else {
        list = plans.other;
      }
      return list.some(entry => entry.tipId === effectiveTipId && entry.planCategory === target);
    },
    [effectiveTipId, nutritionPlans, trainingPlans, plans.other]
  );

  const isTipInTrainingPlan = React.useMemo(() => isTipInPlanCategory('training'), [isTipInPlanCategory]);
  const isTipInNutritionPlan = React.useMemo(() => isTipInPlanCategory('nutrition'), [isTipInPlanCategory]);
  const isTipInOtherPlan = React.useMemo(() => isTipInPlanCategory('other'), [isTipInPlanCategory]);

  const currentTip = viewedTips?.find(v => v.tipId === tipId);
  const askedQuestions = currentTip?.askedQuestions || [];
  const educationXpEarned = currentTip?.xpEarned || 0;
  const nutritionXpEarned = React.useMemo(() => {
    if (!tip?.id) return 0;
    const raw = Object.values(nutritionXpClaims ?? {}).reduce((sum, claim) => {
      if (claim.tipId !== tip.id) {
        return sum;
      }
      const xp = Number.isFinite(claim.xp) ? claim.xp : 0;
      return sum + xp;
    }, 0);
    return raw;
  }, [nutritionXpClaims, tip?.id]);
  const totalXpEarned = educationXpEarned + nutritionXpEarned;
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

  const maxEducationXp = XP_FOR_VIEW + XP_FOR_CHAT_QUESTION * 3 + XP_FOR_VERDICT;
  const progress = Math.min(educationXpEarned / maxEducationXp, 1);
  const progressLabel =
    educationXpEarned >= maxEducationXp
      ? `${t('common:goalDetails.fullyExplored')} 🎉`
      : `${educationXpEarned}/${maxEducationXp} XP`;

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
        returnPath: `/dashboard/area/${areaId}/details`,
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
      showBackButton
    >

      <DetailsTopSection
        areaId={areaId}
        colors={colors}
        tip={tip}
        myLevel={myLevel}
        resolvedSupplements={resolvedSupplements}
        titleKey={titleKey}
        isFavorite={isFavorite}
        totalXpEarned={totalXpEarned}
        educationXpEarned={educationXpEarned}
        nutritionXpEarned={nutritionXpEarned}
        infoText={infoText}
        progress={progress}
        progressLabel={progressLabel}
        showTopPlanAction={showTopPlanAction}
        isTipInPlan={isTipInPlan}
        planBadgeLabel={planBadgeLabel}
        addPlanButtonTitle={addPlanButtonTitle}
        handleAddPlanEntry={handleAddTipPlanEntry}
      />

      {descriptionKey && (
        <AppBox title={t('common:goalDetails.information')}>
          <ThemedText type="explainer" style={styles.descriptionText}>
            {t(`tips:${descriptionKey}`)}
          </ThemedText>
        </AppBox>
      )}
          <AreaRelevanceSection
        tip={tip}
        areaId={areaId}
        showAllAreas={showAllAreas}
        setShowAllAreas={setShowAllAreas}
            expandAreas={shouldExpandAreas}
        effectiveTipId={effectiveTipId}
        colors={colors}
      />
      {!!(trainingRelationLabel) && (
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
      {!!(timeRuleLabel) && (
        <AppBox title={t('common:goalDetails.timeRules.title')}>
          <ThemedText type="caption" style={styles.metaText}>{timeRuleLabel}</ThemedText>
        </AppBox>
      )}
      {isNutritionTip && (tip?.fiberTargets?.length || 0) + (tip?.polyphenolTargets?.length || 0) > 0 && (
        <NutritionTargetsSection tip={tip} colors={colors} t={t} />
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
      <AIInsightsSection
        handleAIInsightPress={handleAIInsightPress}
        isQuestionAsked={isQuestionAsked}
        styles={styles}
        colors={colors}
      />
      <MetricsSection tipId={effectiveTipId} />
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
  favoriteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 'auto',
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
}: Readonly<{
  tip: typeof tips[number] | undefined;
  nutritionFoodItems: { key: string; name: string; details: string }[];
  nutritionFoodsTitle: string | null;
  isTipInPlan: boolean;
  planBadgeLabel: string;
  handleAddTipPlanEntry: () => void;
  styles: { [key: string]: any };
  colors: any;
}>) {
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

function NutritionTargetsSection({
  tip,
  colors,
  t,
}: Readonly<{
  tip: any;
  colors: any;
  t: any;
}>) {
  if (!tip?.fiberTargets && !tip?.polyphenolTargets && !tip?.mineralTargets && !tip?.trackingTargets) return null;

  const fiberTargets = tip?.fiberTargets ?? [];
  const polyphenolTargets = tip?.polyphenolTargets ?? [];
  const mineralTargets = tip?.mineralTargets ?? [];
  const trackingTargets = tip?.trackingTargets ?? [];
  const allTargets = [...fiberTargets, ...polyphenolTargets, ...mineralTargets, ...trackingTargets];

  const mineralTags = new Set([
    'minerals_total',
    'sodium',
    'potassium',
    'magnesium',
    'calcium',
    'iron',
    'zinc',
    'selenium',
    'iodine',
    'phosphorus',
    'copper',
    'manganese',
  ]);

  if (!allTargets.length) return null;

  const formatValue = (value: number, unit: 'g' | 'mg' | 'plants' | 'items' | 'count') => {
    if (unit === 'plants' || unit === 'items' || unit === 'count') {
      return `${Math.round(value)} ${unit}`;
    }
    const decimals = unit === 'g' ? 1 : 0;
    return `${value.toFixed(decimals)} ${unit}`;
  };

  return (
    <AppBox title={t('nutritionLogger.nutritionTargetsTitle', { defaultValue: 'Nutrition targets' })}>
      {allTargets.map((target: any) => {
        const trackingKey = 'trackingKey' in target ? target.trackingKey : target.tag;
        const labelGroup = target.unit === 'plants' || target.unit === 'items' || target.unit === 'count'
          ? 'weeklyTrackingLabels'
          : (target.unit === 'g' ? 'fiberLabels' : (mineralTags.has(trackingKey) ? 'mineralLabels' : 'polyphenolLabels'));
        const label = t(`nutritionLogger.${labelGroup}.${trackingKey}`);
        return (
          <View key={`target-${trackingKey}`} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <ThemedText type="default" style={{ flex: 1 }}>
                {label}
              </ThemedText>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {formatValue(target.amount, target.unit)}
              </ThemedText>
            </View>
          </View>
        );
      })}
    </AppBox>
  );
}

function MetricsSection({ tipId }: Readonly<{ tipId: string | null }>) {
  const { colors } = useTheme();
  const { t } = useTranslation(['common', 'metrics']);
  if (!tipId) return null;
  
  const metricLinks = tipMetricLinks[tipId];
  if (!metricLinks || metricLinks.length === 0) return null;

  return (
    <AppBox title={t('common:goalDetails.metricsTitle')}>
      {metricLinks.map(link => {
        const metric = metrics[link.metricId];
        if (!metric) return null;
        return (
          <ThemedText key={link.metricId} type="default">
            {metric.emoji} {t(`metrics:${link.metricId}.name`)}
          </ThemedText>
        );
        })}
        <ThemedText type="explainer" style={[
                    globalStyles.explainer,
                    {  borderTopColor: colors.borderLight }
                  ]}>
          {t('common:goalDetails.metricsExplainer')}
        </ThemedText>
    </AppBox>
  );
}

function AIInsightsSection({
  handleAIInsightPress,
  isQuestionAsked,
  styles,
  colors,
}: Readonly<{
  handleAIInsightPress: (questionKey: AIPromptKey) => void;
  isQuestionAsked: (questionType: string) => boolean;
  styles: { [key: string]: any };
  colors: any;
}>) {
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
