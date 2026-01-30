import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';

import SupplementList from '@/app/components/SupplementList';
import { useStorage } from '@/app/context/StorageContext';
import { Supplement } from '@/app/domain/Supplement';
import { Colors } from '@/app/theme/Colors';
import AppBox from '@/components/ui/AppBox';
import AppButton from '@/components/ui/AppButton';
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

export default function AreaDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { areaId, tipId } = useLocalSearchParams<{
    areaId: string;
    tipId?: string;
  }>();
  const supplements = useSupplements();
  const { addTipView, incrementTipChat, viewedTips, setTipVerdict, plans, setPlans } = useStorage();

  // Ge XP när tips öppnas (första gången)
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
  // Använd resolvedSupplements (nedan) för att hämta visningsnamn
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
  const effectiveTipId = tipId ?? tip?.id ?? null;

  const getDefaultPlanCategory = React.useCallback(() => {
    if (typeof planCategory === 'string' && (planCategory === 'training' || planCategory === 'nutrition')) {
      return planCategory;
    }

    const fallbackOption = availablePlanCategories.find(option => option === 'training' || option === 'nutrition');

    return fallbackOption;
  }, [planCategory, availablePlanCategories]);

  const isTipInPlanCategory = React.useCallback(
    (target: 'training' | 'nutrition') => {
      if (!effectiveTipId) return false;
      const list = target === 'training' ? trainingPlans : nutritionPlans;
      return list.some(entry => entry.tipId === effectiveTipId);
    },
    [effectiveTipId, nutritionPlans, trainingPlans]
  );

  const isTipInTrainingPlan = React.useMemo(() => isTipInPlanCategory('training'), [isTipInPlanCategory]);
  const isTipInNutritionPlan = React.useMemo(() => isTipInPlanCategory('nutrition'), [isTipInPlanCategory]);

  // Hitta vilka frågor som redan ställts
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

  // Lös upp tip.supplements (id-referenser) till fulla supplement-objekt från översättningarna
  const resolvedSupplements: Supplement[] = React.useMemo(() => {
    if (!tip?.supplements?.length) return [] as any[];
    return tip.supplements.map(ref => supplements?.find(s => s.id === ref.id)).filter(Boolean) as any[];
  }, [tip?.supplements, supplements]);

  const plannedSupplements = React.useMemo(() => {
    const ids = new Set<string>();
    const names = new Set<string>();
    supplementPlans.forEach(plan => {
      plan.supplements?.forEach(supplement => {
        if (supplement.id) ids.add(supplement.id);
        if (supplement.name) names.add(supplement.name);
      });
    });
    return { ids, names };
  }, [supplementPlans]);

  const isTipSupplementScheduled = React.useMemo(() => {
    if (!resolvedSupplements.length) return false;
    return resolvedSupplements.some((supplement: any) => {
      const supplementId = supplement.id;
      const supplementName = supplement.name;
      return (
        (typeof supplementId === 'string' && plannedSupplements.ids.has(supplementId)) ||
        (typeof supplementName === 'string' && plannedSupplements.names.has(supplementName))
      );
    });
  }, [plannedSupplements, resolvedSupplements]);

  const planBadgeLabel = React.useMemo(() => {
    if (isNutritionTip && isTipInNutritionPlan) {
      return t('plan.alreadyInPlanNutrition');
    }

    if (isTrainingTip && isTipInTrainingPlan) {
      return t('plan.alreadyInPlanTraining');
    }

    if (isTipSupplementScheduled) {
      return t('plan.alreadyInPlanSupplement');
    }

    return t('plan.alreadyInPlan');
  }, [isNutritionTip, isTipInNutritionPlan, isTrainingTip, isTipInTrainingPlan, isTipSupplementScheduled, t]);

  const isTipInPlan = React.useMemo(() => {
    if (isTrainingTip && isTipInTrainingPlan) return true;
    if (isNutritionTip && isTipInNutritionPlan) return true;
    if (isTipSupplementScheduled) return true;
    return false;
  }, [isTrainingTip, isNutritionTip, isTipInTrainingPlan, isTipInNutritionPlan, isTipSupplementScheduled]);

  const showTopPlanAction = React.useMemo(() => {
    if (isTrainingTip) return true;
    if (!isNutritionTip && isTipInPlan) return true;
    return false;
  }, [isTrainingTip, isNutritionTip, isTipInPlan]);

  const handleAddTipPlanEntry = () => {
    if (!areaId || !effectiveTipId) return;

    const targetCategory = getDefaultPlanCategory();
    if (!targetCategory) {
      // Future: surface category picker when multiple plan options exist without a default
      return;
    }

    const listKey = targetCategory === 'training' ? 'training' : 'nutrition';

    setPlans(prev => {
      const existingList = prev[listKey];
      const exists = existingList.some(entry => entry.tipId === effectiveTipId && entry.mainGoalId === areaId);

      if (exists) {
        return prev;
      }

      const nextEntry = {
        mainGoalId: areaId,
        tipId: effectiveTipId,
        startedAt: new Date().toISOString(),
        planCategory: targetCategory,
      } as const;

      return {
        ...prev,
        [listKey]: [...existingList, nextEntry],
      } as typeof prev;
    });
  };

  // Hantera verdict-klick
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

  // Beräkna progress baserat på unika frågor
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

    // Använd AIPromptKey för att välja rätt prompt
    if (questionKey === 'insights.studies') {
      fullPrompt = AIPrompts.insights.studies(tipInfo, t);
    } else if (questionKey === 'insights.experts') {
      fullPrompt = AIPrompts.insights.experts(tipInfo, t);
    } else if (questionKey === 'insights.risks') {
      fullPrompt = AIPrompts.insights.risks(tipInfo, t);
    }

    // Ge XP för att chatta om tipset (om det är första gången för denna fråga)
    if (areaId && tipId) {
      const xpGained = incrementTipChat(areaId, tipId, questionKey.split('.')[1]); // Skicka bara "studies", "experts", eller "risks"
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

  // Kolla om en fråga redan är besvarad
  const isQuestionAsked = (questionType: string) => askedQuestions.includes(questionType);

  // Om mål eller tips saknas, rendera ett enkelt fallback-view (hooks ovanför är alltid anropade)
  if (notFound) {
    return (
      <NotFound text="Goal not found." />
    );
  }

  return (
    <Container
      background="gradient"
      gradientLocations={Colors.dark.gradients.sunrise.locations3 as any}
      onBackPress={() => router.replace(`/dashboard/area/${areaId}`)}
      showBackButton
    >
      <View style={styles.topSection}>
        <Text style={styles.goalTitle}>{t(`areas:${areaId}.title`)}</Text>
        <View style={styles.iconWrapper}>
          <Icon source={goalIcon} size={50} color={Colors.dark.primary} />
        </View>
        <Text style={styles.subTitle}>{resolvedSupplements[0]?.name ?? t(`tips:${titleKey}`)}</Text>
        {isFavorite && (
          <View style={styles.favoriteChip}>
            <Text style={styles.favoriteChipText}>★ {t('common:dashboard.favorite', 'Favorite')}</Text>
          </View>
        )}
        <Text style={styles.xpText}>{totalXpEarned} XP earned</Text>
        <ProgressBarWithLabel progress={progress} label={progressLabel} />
        <PlanActionSection
          showTopPlanAction={showTopPlanAction}
          isTipInPlan={isTipInPlan}
          planBadgeLabel={planBadgeLabel}
          isTrainingTip={isTrainingTip}
          handleAddTipPlanEntry={handleAddTipPlanEntry}
          styles={styles}
        />
      </View>
      {descriptionKey && (
        <AppBox title={t('common:goalDetails.information')}>
          <Text style={styles.descriptionText}>{t(`tips:${descriptionKey}`)}</Text>
        </AppBox>
      )}
      {trainingRelationLabel && (
        <AppBox title={t('common:goalDetails.trainingRelation.title')}>
          <Text style={styles.metaText}>{trainingRelationLabel}</Text>
        </AppBox>
      )}
      {preferredDayPartLabels.length > 0 && (
        <AppBox title={t('common:goalDetails.preferredDayParts.title')}>
          {preferredDayPartLabels.map(label => (
            <Text key={label} style={styles.metaText}>
              • {label}
            </Text>
          ))}
        </AppBox>
      )}
      {timeRuleLabel && (
        <AppBox title={t('common:goalDetails.timeRules.title')}>
          <Text style={styles.metaText}>{timeRuleLabel}</Text>
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
      />
      <AreaRelevanceSection
        tip={tip}
        areaId={areaId}
        showAllAreas={showAllAreas}
        setShowAllAreas={setShowAllAreas}
        effectiveTipId={effectiveTipId}
        addTipView={addTipView}
        styles={styles}
      />
      <AIInsightsSection
        handleAIInsightPress={handleAIInsightPress}
        isQuestionAsked={isQuestionAsked}
        styles={styles}
      />
      <VerdictSelector currentVerdict={currentVerdict} onVerdictPress={handleVerdictPress} />
      {resolvedSupplements.length > 0 && (
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
    backgroundColor: Colors.dark.accentVeryWeak,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  planActionAddedText: {
    color: Colors.dark.primary,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 60,
    borderColor: Colors.dark.borderLight,
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
    backgroundColor: Colors.dark.accentWeak,
    borderRadius: 12,
    marginTop: 6,
  },
  favoriteChipText: {
    color: Colors.dark.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  goalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 20,
  },
  subTitle: {
    fontSize: 20,
    color: Colors.dark.primary,
    marginBottom: 10,
  },
  xpText: {
    color: Colors.dark.textLight,
    fontSize: 16,
    marginBottom: 20,
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
    color: Colors.dark.textLight,
    marginTop: 6,
    textAlign: 'center',
  },
  insightButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.dark.accentVeryWeak,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.accentMedium,
  },
  insightButtonAsked: {
    backgroundColor: Colors.dark.accentVeryWeak,
    borderColor: Colors.dark.accentWeak,
    opacity: 0.7,
  },
  insightText: {
    color: Colors.dark.textLight,
    fontSize: 16,
  },
  relevanceHeading: {
    alignSelf: 'flex-start',
    color: Colors.dark.textPrimary,
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
    color: Colors.dark.accentDefault,
    fontSize: 14,
    fontWeight: '600',
  },
  addToCalendarText: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  metaText: {
    color: Colors.dark.textLight,
    fontSize: 16,
    marginBottom: 4,
  },
  nutritionItem: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  nutritionDetailText: {
    color: Colors.dark.textLight,
    opacity: 0.8,
    fontSize: 14,
    marginLeft: 18,
    marginTop: -2,
  },
  descriptionText: {
    color: Colors.dark.textLight,
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
  // eslint-disable-next-line @typescript-eslint/no-shadow
  styles,
}: {
  tip: typeof tips[number] | undefined;
  nutritionFoodItems: { key: string; name: string; details: string }[];
  nutritionFoodsTitle: string | null;
  isTipInPlan: boolean;
  planBadgeLabel: string;
  handleAddTipPlanEntry: () => void;
  styles: { [key: string]: any };
}) {
  const { t } = useTranslation();
  if (!tip?.nutritionFoods?.length || !nutritionFoodsTitle) return null;
  return (
    <AppBox title={nutritionFoodsTitle}>
      {nutritionFoodItems.map(({ key, name, details }) => (
        <View key={key} style={styles.nutritionItem}>
          <Text style={styles.metaText}>• {name}</Text>
          {details ? <Text style={styles.nutritionDetailText}>{details}</Text> : null}
        </View>
      ))}
      <View style={[styles.planActionContainer, styles.nutritionPlanAction]}>
        {isTipInPlan ? (
          <View style={styles.planActionAdded}>
            <Icon source="check" size={18} color={Colors.dark.primary} />
            <Text style={styles.planActionAddedText}>{planBadgeLabel}</Text>
          </View>
        ) : (
          <AppButton
            title={t('plan.addNutritionGoal')}
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
  isTrainingTip: boolean;
  handleAddTipPlanEntry: () => void;
  styles: { [key: string]: any };
};

function PlanActionSection({
  showTopPlanAction,
  isTipInPlan,
  planBadgeLabel,
  isTrainingTip,
  handleAddTipPlanEntry,
  // eslint-disable-next-line @typescript-eslint/no-shadow
  styles,
}: PlanActionSectionProps) {
  const { t } = useTranslation();
  if (!showTopPlanAction) return null;
  return (
    <View style={styles.planActionContainer}>
      {isTipInPlan ? (
        <View style={styles.planActionAdded}>
          <Icon source="check" size={18} color={Colors.dark.primary} />
          <Text style={styles.planActionAddedText}>{planBadgeLabel}</Text>
        </View>
      ) : (
        <AppButton
          title={isTrainingTip ? t('plan.addTrainingGoal') : t('plan.addNutritionGoal')}
          onPress={handleAddTipPlanEntry}
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
};

function AreaRelevanceSection({
  tip,
  areaId,
  showAllAreas,
  setShowAllAreas,
  effectiveTipId,
  addTipView,
  // eslint-disable-next-line @typescript-eslint/no-shadow
  styles,
}: AreaRelevanceSectionProps) {
   const { t } = useTranslation();
  if (!tip?.areas?.length) return null;
  return (
    <>
      <Text style={styles.relevanceHeading}>{t('common:goalDetails.relevance')}</Text>
      {(showAllAreas ? tip.areas : tip.areas.filter(a => a.id === areaId)).map(a => {
        const areaTitle = t(`areas:${a.id}.title`);
        return (
          <AppBox key={a.id} title={areaTitle}>
            <Text style={styles.descriptionText}>{t(`tips:${a.descriptionKey}`)}</Text>
          </AppBox>
        );
      })}
      {tip.areas.length > 1 && (
        <Pressable
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
        >
          <Text style={styles.showAllText}>
            {showAllAreas ? t('common:goalDetails.showLess') : t('common:goalDetails.showAll')}
          </Text>
        </Pressable>
      )}
    </>
  );
}

function AIInsightsSection({
  handleAIInsightPress,
  isQuestionAsked,
  // eslint-disable-next-line @typescript-eslint/no-shadow
  styles,
}: {
  handleAIInsightPress: (questionKey: AIPromptKey) => void;
  isQuestionAsked: (questionType: string) => boolean;
  styles: { [key: string]: any };
}) {
  const { t } = useTranslation();
  return (
    <AppBox title={t(`common:goalDetails.aiInsights`)}>
      <Pressable
        onPress={() => handleAIInsightPress('insights.studies')}
        style={[styles.insightButton, isQuestionAsked('studies') && styles.insightButtonAsked]}
      >
        <Text style={styles.insightText}>
          {isQuestionAsked('studies') ? '✅' : '📚'} {t('common:goalDetails.whatStudiesExist')}
          {!isQuestionAsked('studies') && ' (+5 XP)'}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => handleAIInsightPress('insights.experts')}
        style={[styles.insightButton, isQuestionAsked('experts') && styles.insightButtonAsked]}
      >
        <Text style={styles.insightText}>
          {isQuestionAsked('experts') ? '✅' : '👥'} {t('common:goalDetails.whoAreTheExperts')}
          {!isQuestionAsked('experts') && ' (+5 XP)'}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => handleAIInsightPress('insights.risks')}
        style={[styles.insightButton, isQuestionAsked('risks') && styles.insightButtonAsked]}
      >
        <Text style={styles.insightText}>
          {isQuestionAsked('risks') ? '✅' : '⚠️'} {t('common:goalDetails.whatAreTheRisks')}
          {!isQuestionAsked('risks') && ' (+5 XP)'}
        </Text>
      </Pressable>
    </AppBox>
  );
}
