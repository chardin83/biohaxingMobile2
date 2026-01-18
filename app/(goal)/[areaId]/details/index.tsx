import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { areas } from "@/locales/areas";
import { Colors } from "@/constants/Colors";
import { useSupplements } from "@/locales/supplements";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";
import AppBox from "@/components/ui/AppBox";
import AppButton from "@/components/ui/AppButton";
import ProgressBarWithLabel from "@/components/ui/ProgressbarWithLabel";
import { tips } from "@/locales/tips";
import { useStorage } from "@/app/context/StorageContext";
import BackButton from "@/components/BackButton";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AIPrompts, AIPromptKey } from "@/constants/AIPrompts";
import VerdictSelector from "@/components/VerdictSelector";
import { POSITIVE_VERDICTS } from "@/types/verdict";
import { ThemedModal } from "@/components/ThemedModal";
import { useSupplementSaver } from "@/hooks/useSupplementSaver";
import CreateTimeSlotModal, { CreatePlanData } from "@/components/modals/CreateTimeSlotModal";

export default function AreaDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { areaId, tipId } = useLocalSearchParams<{
    areaId: string;
    tipId?: string;
  }>();
  const supplements = useSupplements();
  const {
    addTipView,
    incrementTipChat,
    viewedTips,
    setTipVerdict,
    plans,
    setPlans,
  } = useStorage();
  const { saveSupplementToPlan } = useSupplementSaver();

    // Ge XP när tips öppnas (första gången)
  React.useEffect(() => {
    if (areaId && tipId) {
      const xpGained = addTipView(areaId, tipId);
      if (xpGained > 0) {
        console.log(`🎉 You gained ${xpGained} XP for viewing this tip!`);
      }
    }
  }, [areaId, tipId]);
  
  const mainArea = areas.find((g) => g.id === areaId);
  const findTip = (tipId: string | undefined, areaId: string) => {
    return tipId
      ? tips.find((t) => t.id === tipId)
      : tips.find((t) => t.areas.some((a) => a.id === areaId));
  };

  const tip = findTip(tipId, areaId);

  const [showAllAreas, setShowAllAreas] = React.useState(false);
  const [addToPlanVisible, setAddToPlanVisible] = React.useState(false);
  const [pendingSupplement, setPendingSupplement] = React.useState<any | null>(null);
  const [createPlanVisible, setCreatePlanVisible] = React.useState(false);
  const [expandedSupplements, setExpandedSupplements] = React.useState<string[]>([]);

  const goalIcon = mainArea?.icon ?? "target";
  // Använd resolvedSupplements (nedan) för att hämta visningsnamn
  const notFound = !mainArea || !tip;

  const descriptionKey = tip?.descriptionKey;
  const titleKey = tip?.title;

  const planCategory = tip?.planCategory;
  const supplementPlans = plans.supplements ?? [];
  const trainingPlans = plans.training;
  const nutritionPlans = plans.nutrition;
  const availablePlanCategories = React.useMemo(() => {
    const options = tip?.planCategoryOptions ?? [];
    if (planCategory && !options.includes(planCategory)) {
      return [planCategory, ...options];
    }
    return options;
  }, [planCategory, tip?.planCategoryOptions]);

  const isTrainingTip = availablePlanCategories.includes("training");
  const isNutritionTip = availablePlanCategories.includes("nutrition");
  const effectiveTipId = tipId ?? tip?.id ?? null;

  const getDefaultPlanCategory = React.useCallback(() => {
    if (planCategory === "training" || planCategory === "nutrition") {
      return planCategory;
    }

    const fallbackOption = availablePlanCategories.find((option) =>
      option === "training" || option === "nutrition"
    );

    return fallbackOption;
  }, [planCategory, availablePlanCategories]);

  const isTipInPlanCategory = React.useCallback(
    (target: "training" | "nutrition") => {
      if (!effectiveTipId) return false;
      const list = target === "training" ? trainingPlans : nutritionPlans;
      return list.some((entry) => entry.tipId === effectiveTipId);
    },
    [effectiveTipId, nutritionPlans, trainingPlans]
  );

  const isTipInTrainingPlan = React.useMemo(
    () => isTipInPlanCategory("training"),
    [isTipInPlanCategory]
  );
  const isTipInNutritionPlan = React.useMemo(
    () => isTipInPlanCategory("nutrition"),
    [isTipInPlanCategory]
  );

  // Hitta vilka frågor som redan ställts
  const currentTip = viewedTips?.find(
    (v) => v.mainGoalId === areaId && v.tipId === tipId
  );
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
    return tip.preferredDayParts.map((part) =>
      t(`common:goalDetails.preferredDayParts.${part}`)
    );
  }, [tip?.preferredDayParts, t]);
  const timeRuleLabel = tip?.timeRule
    ? t(`common:goalDetails.timeRules.${tip.timeRule}`)
    : null;
  const nutritionFoodsTitle = React.useMemo(() => {
    if (!tip?.id || !tip.nutritionFoods?.length) return null;
    return t(`tips:${tip.id}.nutritionFoods.title`, {
      defaultValue: t("plan.nutritionHeader"),
    });
  }, [tip?.id, tip?.nutritionFoods, t]);

  const nutritionFoodItems = React.useMemo(() => {
    if (!tip?.nutritionFoods?.length || !tip.id) return [] as { key: string; name: string; details: string }[];
    return tip.nutritionFoods.map((food) => {
      const itemKey = food.key;
      const detailKey = food.detailsKey ?? itemKey;
      const name = t(`tips:${tip.id}.nutritionFoods.items.${itemKey}.name`, {
        defaultValue: itemKey,
      });
      const details = t(`tips:${tip.id}.nutritionFoods.items.${detailKey}.details`, {
        defaultValue: "",
      });
      return {
        key: `${itemKey}:${detailKey}`,
        name,
        details,
      };
    });
  }, [tip?.nutritionFoods, tip?.id, t]);

  // Lös upp tip.supplements (id-referenser) till fulla supplement-objekt från översättningarna
  const resolvedSupplements = React.useMemo(() => {
    if (!tip?.supplements?.length) return [] as any[];
    return (tip.supplements
      .map((ref) => supplements?.find((s) => s.id === ref.id))
      .filter(Boolean) as any[]);
  }, [tip?.supplements, supplements]);

  const plannedSupplements = React.useMemo(() => {
    const ids = new Set<string>();
    const names = new Set<string>();
    supplementPlans.forEach((plan) => {
      plan.supplements?.forEach((supplement) => {
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
        (typeof supplementId === "string" && plannedSupplements.ids.has(supplementId)) ||
        (typeof supplementName === "string" && plannedSupplements.names.has(supplementName))
      );
    });
  }, [plannedSupplements, resolvedSupplements]);

  const planBadgeLabel = React.useMemo(() => {
    if (isNutritionTip && isTipInNutritionPlan) {
      return t("plan.alreadyInPlanNutrition");
    }

    if (isTrainingTip && isTipInTrainingPlan) {
      return t("plan.alreadyInPlanTraining");
    }

    if (isTipSupplementScheduled) {
      return t("plan.alreadyInPlanSupplement");
    }

    return t("plan.alreadyInPlan");
  }, [
    isNutritionTip,
    isTipInNutritionPlan,
    isTrainingTip,
    isTipInTrainingPlan,
    isTipSupplementScheduled,
    t,
  ]);

  const isTipInPlan = React.useMemo(() => {
    if (isTrainingTip && isTipInTrainingPlan) return true;
    if (isNutritionTip && isTipInNutritionPlan) return true;
    if (isTipSupplementScheduled) return true;
    return false;
  }, [
    isTrainingTip,
    isNutritionTip,
    isTipInTrainingPlan,
    isTipInNutritionPlan,
    isTipSupplementScheduled,
  ]);

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

    const listKey = targetCategory === "training" ? "training" : "nutrition";

    setPlans((prev) => {
      const existingList = prev[listKey];
      const exists = existingList.some(
        (entry) => entry.tipId === effectiveTipId && entry.mainGoalId === areaId
      );

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
  const handleVerdictPress = (verdict: "interested" | "startNow" | "wantMore" | "alreadyWorks" | "notInterested" | "noResearch" | "testedFailed") => {
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
  const progressLabel = askedQuestions.length >= maxChats 
    ? t("common:goalDetails.fullyExplored") || "Fully Explored! 🎉"
    : `${askedQuestions.length}/${maxChats} questions explored`;

  const handleAIInsightPress = (questionKey: AIPromptKey) => {
    const tipTranslation = t(`tips:${titleKey}`);
    const informationTranslation = t(`tips:${descriptionKey}`) || '';
    const tipInfo = `Tip: ${tipTranslation}\nInformation: ${informationTranslation}`;
    
    let fullPrompt = '';

    // Använd AIPromptKey för att välja rätt prompt
    if (questionKey === "insights.studies") {
      fullPrompt = AIPrompts.insights.studies(tipInfo, t);
    } else if (questionKey === "insights.experts") {
      fullPrompt = AIPrompts.insights.experts(tipInfo, t);
    } else if (questionKey === "insights.risks") {
      fullPrompt = AIPrompts.insights.risks(tipInfo, t);
    }

    // Ge XP för att chatta om tipset (om det är första gången för denna fråga)
    if (areaId && tipId) {
      const xpGained = incrementTipChat(areaId, tipId, questionKey.split(".")[1]); // Skicka bara "studies", "experts", eller "risks"
      if (xpGained > 0) {
        console.log(`🎉 You gained ${xpGained} XP for exploring this question!`);
      } else {
        console.log(`ℹ️ You've already explored this question`);
      }
    }

    router.push({
      pathname: "/(tabs)/chat",
      params: {
        initialPrompt: fullPrompt,
        returnPath: `/(goal)/${areaId}/details`,
        returnParams: JSON.stringify({ areaId, tipId }),
      },
    });
  };

  // Kolla om en fråga redan är besvarad
  const isQuestionAsked = (questionType: string) => askedQuestions.includes(questionType);

  const handleOpenAddToPlan = (supp: any) => {
    setPendingSupplement(supp);
    setAddToPlanVisible(true);
  };

  const handleAddSupplementToPlan = (plan: any) => {
    if (!pendingSupplement) return;
    // Använd nuvarande plan och supplement för att spara via hooken
    saveSupplementToPlan(
      { name: plan.name, prefferedTime: plan.prefferedTime, supplements: plan.supplements ?? [], notify: plan.notify },
      pendingSupplement,
      false
    );
    setAddToPlanVisible(false);
    setPendingSupplement(null);
  };

  const toggleSupplementInfo = (supplementId: string) => {
    setExpandedSupplements((prev) =>
      prev.includes(supplementId)
        ? prev.filter((id) => id !== supplementId)
        : [...prev, supplementId]
    );
  };

  // Om mål eller tips saknas, rendera ett enkelt fallback-view (hooks ovanför är alltid anropade)
  if (notFound) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Goal not found.</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#071526", "#040B16"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <BackButton onPress={() => router.replace(`/(goal)/${areaId}`)} />
        
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 140, flexGrow: 1 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.goalTitle}>{t(`areas:${areaId}.title`)}</Text>
          <View style={styles.topSection}>
            <View style={styles.iconWrapper}>
              <Icon source={goalIcon} size={50} color={Colors.dark.primary} />
            </View>
            <Text style={styles.subTitle}>
              {resolvedSupplements[0]?.name ?? t(`tips:${titleKey}`)}
            </Text>
            {isFavorite && (
              <View style={styles.favoriteChip}>
                <Text style={styles.favoriteChipText}>★ {t("common:dashboard.favorite", "Favorite")}</Text>
              </View>
            )}
            <Text style={styles.xpText}>
              {totalXpEarned} XP earned
            </Text>
            
            {/* Progress bar baserad på chat count */}
            <ProgressBarWithLabel
              progress={progress}
              label={progressLabel}
            />

            {showTopPlanAction && (
              <View style={styles.planActionContainer}>
                {isTipInPlan ? (
                  <View style={styles.planActionAdded}>
                    <Icon source="check" size={18} color={Colors.dark.primary} />
                    <Text style={styles.planActionAddedText}>
                      {planBadgeLabel}
                    </Text>
                  </View>
                ) : (
                  <AppButton
                    title={
                      isTrainingTip
                        ? t("plan.addTrainingGoal")
                        : t("plan.addNutritionGoal")
                    }
                    onPress={handleAddTipPlanEntry}
                    variant="primary"
                    style={styles.planActionButton}
                  />
                )}
              </View>
            )}
          </View>

          {descriptionKey && (
            <AppBox title={t("common:goalDetails.information")}>
              <Text style={{ color: Colors.dark.textLight, marginBottom: 8 }}>
                {t(`tips:${descriptionKey}`)}
              </Text>
            </AppBox>
          )}

          {trainingRelationLabel && (
            <AppBox title={t("common:goalDetails.trainingRelation.title")}>
              <Text style={styles.metaText}>{trainingRelationLabel}</Text>
            </AppBox>
          )}

          {preferredDayPartLabels.length > 0 && (
            <AppBox title={t("common:goalDetails.preferredDayParts.title")}>
              {preferredDayPartLabels.map((label) => (
                <Text key={label} style={styles.metaText}>
                  • {label}
                </Text>
              ))}
            </AppBox>
          )}

          {timeRuleLabel && (
            <AppBox title={t("common:goalDetails.timeRules.title")}>
              <Text style={styles.metaText}>{timeRuleLabel}</Text>
            </AppBox>
          )}

          {isNutritionTip && nutritionFoodItems.length > 0 && nutritionFoodsTitle && (
            <AppBox title={nutritionFoodsTitle}>
              {nutritionFoodItems.map(({ key, name, details }) => (
                <View key={key} style={styles.nutritionItem}>
                  <Text style={styles.metaText}>• {name}</Text>
                  {details ? (
                    <Text style={styles.nutritionDetailText}>{details}</Text>
                  ) : null}
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
                    title={t("plan.addNutritionGoal")}
                    onPress={handleAddTipPlanEntry}
                    variant="primary"
                    style={styles.planActionButton}
                  />
                )}
              </View>
            </AppBox>
          )}

          {tip?.areas.length ? (
            <>
              <Text style={styles.relevanceHeading}>
                {t("common:goalDetails.relevance")}
              </Text>

             

              {(showAllAreas ? tip.areas : tip.areas.filter((a) => a.id === areaId)).map((a) => {
                const areaTitle = t(`areas:${a.id}.title`);
                return (
                  <AppBox
                    key={a.id}
                    title={areaTitle}
                  >
                    <Text style={{ color: Colors.dark.textLight, marginBottom: 8 }}>
                      {t(`tips:${a.descriptionKey}`)}
                    </Text>
                  </AppBox>
                );
              })}
            </>
          ) : null}

           {tip.areas.length > 1 && (
                <Pressable
                  onPress={() => setShowAllAreas((v) => !v)}
                  style={styles.showAllButton}
                >
                  <Text style={styles.showAllText}>
                    {showAllAreas ? t("common:goalDetails.showLess") : t("common:goalDetails.showAll")}
                  </Text>
                </Pressable>
              )}

          <AppBox title={t(`common:goalDetails.aiInsights`)}>
            <Pressable 
              onPress={() => handleAIInsightPress("insights.studies")}
              style={[
                styles.insightButton,
                isQuestionAsked("studies") && styles.insightButtonAsked
              ]}
            >
              <Text style={styles.insightText}>
                {isQuestionAsked("studies") ? "✅" : "📚"} {t("common:goalDetails.whatStudiesExist")}
                {!isQuestionAsked("studies") && " (+5 XP)"}
              </Text>
            </Pressable>
            
            <Pressable 
              onPress={() => handleAIInsightPress("insights.experts")}
              style={[
                styles.insightButton,
                isQuestionAsked("experts") && styles.insightButtonAsked
              ]}
            >
              <Text style={styles.insightText}>
                {isQuestionAsked("experts") ? "✅" : "👥"} {t("common:goalDetails.whoAreTheExperts")}
                {!isQuestionAsked("experts") && " (+5 XP)"}
              </Text>
            </Pressable>
            
            <Pressable 
              onPress={() => handleAIInsightPress("insights.risks")}
              style={[
                styles.insightButton,
                isQuestionAsked("risks") && styles.insightButtonAsked
              ]}
            >
              <Text style={styles.insightText}>
                {isQuestionAsked("risks") ? "✅" : "⚠️"} {t("common:goalDetails.whatAreTheRisks")}
                {!isQuestionAsked("risks") && " (+5 XP)"}
              </Text>
            </Pressable>
          </AppBox>

          <VerdictSelector 
            currentVerdict={currentVerdict}
            onVerdictPress={handleVerdictPress}
          />

          {/* Visa kosttillskott och knapp om det finns referenser */}
          {resolvedSupplements.length > 0 && (
            <AppBox title={t("common:goalDetails.supplements")}>
              {resolvedSupplements.map((supplement: any) => {
                const supplementId = supplement.id || supplement.name;
                const alreadyPlanned =
                  plannedSupplements.ids.has(supplement.id) ||
                  plannedSupplements.names.has(supplement.name);
                const isExpanded =
                  !!supplement.description && expandedSupplements.includes(supplementId);

                return (
                  <View key={supplementId} style={styles.supplementContainer}>
                    <View style={styles.supplementRow}>
                      <View style={styles.supplementNameColumn}>
                        <Text
                          style={styles.supplementText}
                          numberOfLines={isExpanded ? undefined : 1}
                          ellipsizeMode="tail"
                        >
                          {supplement.name}
                        </Text>
                        {supplement.description ? (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => toggleSupplementInfo(supplementId)}
                            style={styles.supplementInfoRow}
                          >
                            <Icon
                              source={isExpanded ? "information" : "information-outline"}
                              size={14}
                              color={Colors.dark.primary}
                            />
                            <Text style={styles.supplementInfoText}>
                              {isExpanded
                                ? t("common:goalDetails.lessInfo")
                                : t("common:goalDetails.moreInfo")}
                            </Text>
                          </Pressable>
                        ) : null}
                        </View>
                      {alreadyPlanned ? (
                        <View style={styles.supplementCheck}>
                          <Icon source="check" size={22} color={Colors.dark.primary} />
                        </View>
                      ) : (
                        <AppButton
                          title="+"
                          accessibilityLabel={t("common:goalDetails.addToPlan")}
                          onPress={() => handleOpenAddToPlan(supplement)}
                          variant="primary"
                        />
                      )}
                    </View>
                    {supplement.description && isExpanded && (
                      <Text style={styles.supplementDescription}>{supplement.description}</Text>
                    )}
                  </View>
                );
              })}
            </AppBox>
          )}
          {/* Modal: välj tidpunkt + lista planer */}
          <ThemedModal
            visible={addToPlanVisible}
            title={t("plan.addSupplement")}
            onClose={() => { setAddToPlanVisible(false); setPendingSupplement(null); }}
            showCancelButton
          >
            <View style={{ width: "100%" }}>
              <Text style={{ color: Colors.dark.textLight, marginBottom: 10 }}>
                {t("dayEdit.chooseTime")}
              </Text>
              {supplementPlans.map((p) => (
                <View key={p.name} style={{ marginBottom: 8 }}>
                  <AppButton
                    title={`${p.name} (${p.prefferedTime})`}
                    onPress={() => handleAddSupplementToPlan(p)}
                    variant="primary"
                  />
                </View>
              ))}
              <View style={{ marginTop: 12 }}>
                <AppButton
                  title={t("plan.addTimeSlot")}
                  onPress={() => {
                    // Stäng denna modal innan vi öppnar skapa-plan modal
                    setAddToPlanVisible(false);
                    setCreatePlanVisible(true);
                  }}
                  variant="secondary"
                />
              </View>
            </View>
          </ThemedModal>

          {/* Modal: skapa ny plan inline */}
          <CreateTimeSlotModal
            visible={createPlanVisible}
            onClose={() => {
              // Återöppna AddToPlan även vid Avbryt
              setCreatePlanVisible(false);
              setAddToPlanVisible(true);
            }}
            onCreate={(newPlan: CreatePlanData) => {
              if (pendingSupplement) {
                saveSupplementToPlan(
                  { name: newPlan.name, prefferedTime: newPlan.prefferedTime, supplements: [], notify: newPlan.notify },
                  pendingSupplement,
                  false
                );
              }
              // Stäng skapa-plan och öppna AddToPlan igen så användaren ser listan
              setCreatePlanVisible(false);
              setAddToPlanVisible(true);
              // Behåll pendingSupplement så man kan lägga till i fler planer om man vill
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.background,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
    paddingTop: 10,
  },
  topSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  planActionContainer: {
    width: "100%",
    marginTop: 16,
    alignSelf: "stretch",
  },
  nutritionPlanAction: {
    marginTop: 12,
  },
  planActionButton: {
    alignSelf: "stretch",
  },
  planActionAdded: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    backgroundColor: Colors.dark.accentVeryWeak,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  planActionAddedText: {
    color: Colors.dark.primary,
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 60,
    borderColor: Colors.dark.borderLight,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  favoriteChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.dark.accentWeak,
    borderRadius: 12,
    marginTop: 6,
  },
  favoriteChipText: {
    color: Colors.dark.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  notFound: {
    fontSize: 18,
    color: "white",
    textAlign: "center",
    marginTop: 20,
  },
  goalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.dark.primary,
    textTransform: "uppercase",
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
    flexDirection: "row",
    gap: 16,
    marginTop: "auto",
  },
  analyzeWrapper: {
    alignItems: "center",
    flexDirection: "column",
    maxWidth: 180,
  },
  disabledHint: {
    fontSize: 12,
    color: Colors.dark.textLight,
    marginTop: 6,
    textAlign: "center",
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
    alignSelf: "flex-start",
    color: Colors.dark.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  showAllButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    marginTop: -10,
    marginBottom: 40,
  },
  showAllText: {
    color: Colors.dark.accentDefault,
    fontSize: 14,
    fontWeight: "600",
  },
  supplementContainer: {
    width: "100%",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  supplementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  supplementNameColumn: {
    flex: 1,
    marginRight: 12,
  },
  supplementText: {
    color: Colors.dark.textLight,
    fontSize: 16,
  },
  addToCalendarText: {
    color: Colors.dark.primary,
    fontWeight: "bold",
    fontSize: 14,
  },
  metaText: {
    color: Colors.dark.textLight,
    fontSize: 16,
    marginBottom: 4,
  },
  nutritionItem: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  nutritionDetailText: {
    color: Colors.dark.textLight,
    opacity: 0.8,
    fontSize: 14,
    marginLeft: 18,
    marginTop: -2,
  },
  supplementCheck: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  supplementInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  supplementInfoText: {
    color: Colors.dark.primary,
    fontSize: 12,
    marginLeft: 4,
  },
  supplementDescription: {
    color: Colors.dark.textLight,
    fontSize: 14,
    marginTop: 6,
  },
});

