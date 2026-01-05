import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { areas } from "@/locales/areas";
import { Colors } from "@/constants/Colors";
import { useSupplements } from "@/locales/supplements";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";
import AppBox from "@/components/ui/AppBox";
import ProgressBarWithLabel from "@/components/ui/ProgressbarWithLabel";
import { tips } from "@/locales/tips";
import { useStorage } from "@/app/context/StorageContext";
import BackButton from "@/components/BackButton";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AIPrompts } from "@/constants/AIPrompts";
import VerdictSelector from "@/components/VerdictSelector";

export default function AreaDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { areaId, tipId } = useLocalSearchParams<{
    areaId: string;
    tipId?: string;
  }>();
  const supplements = useSupplements();
  const { addTipView, incrementTipChat, viewedTips, setTipVerdict } = useStorage();

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

  const goalIcon = mainArea?.icon ?? "target";
  const supplementId = tip?.supplements?.[0]?.id ?? undefined;
  const supplementName = supplements?.find((s) => s.id === supplementId)?.name;

  if (!mainArea || !tip) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Goal not found.</Text>
      </View>
    );
  }

  const descriptionKey = tip?.descriptionKey;
  const titleKey = tip?.title;



  // Hitta vilka frågor som redan ställts
  const currentTip = viewedTips?.find(
    (v) => v.mainGoalId === areaId && v.tipId === tipId
  );
  const askedQuestions = currentTip?.askedQuestions || [];
  const totalXpEarned = currentTip?.xpEarned || 0;
  const currentVerdict = currentTip?.verdict;
  const positiveVerdicts = ["interested", "startNow", "wantMore", "alreadyWorks"] as const;
  const isFavorite = currentVerdict ? positiveVerdicts.includes(currentVerdict as any) : false;

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

  const handleAIInsightPress = (question: string, questionType: string) => {
    const tipTranslation = t(`tips:${titleKey}`);
    const informationTranslation = t(`tips:${information}`) || '';
    const tipInfo = `Tip: ${tipTranslation}\nInformation: ${informationTranslation}`;
    
    let fullPrompt = '';
    
    if (question.includes("What studies exist")) {
      fullPrompt = AIPrompts.insights.studies(tipInfo);
    } else if (question.includes("Which people are talking")) {
      fullPrompt = AIPrompts.insights.experts(tipInfo);
    } else if (question.includes("What risks")) {
      fullPrompt = AIPrompts.insights.risks(tipInfo);
    } else {
      fullPrompt = `${question}\n\n${tipInfo}`;
    }
    
    // Ge XP för att chatta om tipset (om det är första gången för denna fråga)
    if (areaId && tipId) {
      const xpGained = incrementTipChat(areaId, tipId, questionType);
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
      }
    });
  };

  // Kolla om en fråga redan är besvarad
  const isQuestionAsked = (questionType: string) => askedQuestions.includes(questionType);

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
              {supplementName ?? t(`tips:${titleKey}`)}
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
          </View>

          {descriptionKey && (
            <AppBox title={t("common:goalDetails.information")}>
              <Text style={{ color: Colors.dark.textLight, marginBottom: 8 }}>
                {t(`tips:${descriptionKey}`)}
              </Text>
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
              onPress={() => handleAIInsightPress("What studies exist?", "studies")}
              style={[
                styles.insightButton,
                isQuestionAsked("studies") && styles.insightButtonAsked
              ]}
            >
              <Text style={styles.insightText}>
                {isQuestionAsked("studies") ? "✅" : "📚"} What studies exist? 
                {!isQuestionAsked("studies") && " (+5 XP)"}
              </Text>
            </Pressable>
            
            <Pressable 
              onPress={() => handleAIInsightPress("Which people are talking about this subject?", "experts")}
              style={[
                styles.insightButton,
                isQuestionAsked("experts") && styles.insightButtonAsked
              ]}
            >
              <Text style={styles.insightText}>
                {isQuestionAsked("experts") ? "✅" : "👥"} Who are the experts? 
                {!isQuestionAsked("experts") && " (+5 XP)"}
              </Text>
            </Pressable>
            
            <Pressable 
              onPress={() => handleAIInsightPress("What risks are associated with this?", "risks")}
              style={[
                styles.insightButton,
                isQuestionAsked("risks") && styles.insightButtonAsked
              ]}
            >
              <Text style={styles.insightText}>
                {isQuestionAsked("risks") ? "✅" : "⚠️"} What are the risks? 
                {!isQuestionAsked("risks") && " (+5 XP)"}
              </Text>
            </Pressable>
          </AppBox>

          <VerdictSelector 
            currentVerdict={currentVerdict}
            onVerdictPress={handleVerdictPress}
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
});

