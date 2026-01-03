import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { mainGoals } from "@/locales/mainGoals";
import { Colors } from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSupplements } from "@/locales/supplements";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";
import { ThemedModal } from "@/components/ThemedModal";
import { ThemedText } from "@/components/ThemedText";
import AppButton from "@/components/ui/AppButton";
import {
  calculateGoalProgress,
  getEndDate,
  getTimeLeftText,
} from "@/app/utils/goalUtils";
import AppBox from "@/components/ui/AppBox";
import ProgressBarWithLabel from "@/components/ui/ProgressbarWithLabel";
import { tipCategories } from "@/locales/tips";
import AnalysisModal from "@/components/modals/FileAnalysisModal";
import { sendFileToAIAnalysis, sendFileToAISupplementAnalysis } from "@/services/gptServices";
import { useStorage } from "@/app/context/StorageContext";
import BackButton from "@/components/BackButton";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { AIPrompts } from "@/constants/AIPrompts";

export default function GoalDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mainGoalId, goalId, tipId } = useLocalSearchParams<{
    mainGoalId: string;
    goalId: string;
    tipId?: string;
  }>();
  const supplements = useSupplements();
  const { addTipView, incrementTipChat, viewedTips, setTipVerdict } = useStorage();
  
  const mainGoal = mainGoals.find((g) => g.id === mainGoalId);
  const goal = tipCategories.find((l) => l.id === goalId);

  // Hitta rätt tip baserat på tipId
  const step: any = tipId 
    ? goal?.tips?.find((tip) => tip.id === tipId) ?? {}
    : goal?.tips?.[0] ?? {};

  const goalIcon = mainGoal?.icon ?? "target";
  const supplementId = step?.supplements?.[0]?.id ?? undefined;
  const supplementName = supplements?.find((s) => s.id === supplementId)?.name;

  if (!mainGoal || !goal) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Goal not found.</Text>
      </View>
    );
  }

  const information = step?.information;
  const titleKey = step?.title;

  // Ge XP när tips öppnas (första gången)
  React.useEffect(() => {
    if (mainGoalId && goalId && tipId) {
      const xpGained = addTipView(mainGoalId, goalId, tipId);
      if (xpGained > 0) {
        console.log(`🎉 You gained ${xpGained} XP for viewing this tip!`);
      }
    }
  }, [mainGoalId, goalId, tipId]);

  // Hitta vilka frågor som redan ställts
  const currentTip = viewedTips?.find(
    (v) => v.mainGoalId === mainGoalId && v.goalId === goalId && v.tipId === tipId
  );
  const askedQuestions = currentTip?.askedQuestions || [];
  const totalXpEarned = currentTip?.xpEarned || 0;
  const currentVerdict = currentTip?.verdict;

  // Hantera verdict-klick
  const handleVerdictPress = (verdict: "relevant" | "interesting" | "skeptical") => {
    if (mainGoalId && goalId && tipId) {
      const xpGained = setTipVerdict(mainGoalId, goalId, tipId, verdict);
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
    const tipInfo = `Tip: ${t(`tips:${titleKey}`)}\nDescription: ${t(`tips:${step?.taskInfo?.description}`) || ''}\nInformation: ${t(`tips:${information?.text}`) || ''}`;
    
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
    if (mainGoalId && goalId && tipId) {
      const xpGained = incrementTipChat(mainGoalId, goalId, tipId, questionType);
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
        returnPath: `/(goal)/${mainGoalId}/details`,
        returnParams: JSON.stringify({ mainGoalId, goalId, tipId }),
      }
    });
  };

  // Kolla om en fråga redan är besvarad
  const isQuestionAsked = (questionType: string) => askedQuestions.includes(questionType);

  return (
    <LinearGradient colors={["#071526", "#040B16"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <BackButton onPress={() => router.replace(`/(goal)/${mainGoalId}`)} />
        
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 140, flexGrow: 1 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.goalTitle}>{t(`tips:${mainGoalId}.title`)}</Text>
          <View style={styles.topSection}>
            <View style={styles.iconWrapper}>
              <Icon source={goalIcon} size={50} color={Colors.dark.primary} />
            </View>
            <Text style={styles.subTitle}>
              {supplementName ?? t(`tips:${titleKey}`)}
            </Text>
            <Text style={styles.xpText}>
              {totalXpEarned} XP earned
            </Text>
            
            {/* Progress bar baserad på chat count */}
            <ProgressBarWithLabel
              progress={progress}
              label={progressLabel}
            />
          </View>

          {information && (
            <AppBox title={t("common:goalDetails.information")}>
              <Text style={{ color: Colors.dark.textLight, marginBottom: 8 }}>
                {information.text ? t(`tips:${information.text}`) : information}
              </Text>
              <Text
                style={{
                  color: Colors.dark.textLight,
                  fontStyle: "italic",
                  fontWeight: "bold",
                }}
              >
                {information.author ? t(`tips:${information.author}`) : ""}
              </Text>
            </AppBox>
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

          <AppBox title={t("common:goalDetails.verdict")}>
            <Pressable 
              style={[
                styles.verdictCard,
                currentVerdict === "relevant" && styles.verdictCardSelected
              ]}
              onPress={() => handleVerdictPress("relevant")}
            >
              <View style={styles.verdictCardContent}>
                <Text style={styles.verdictCardIcon}>⭐</Text>
                <View style={styles.verdictCardText}>
                  <Text style={styles.verdictCardTitle}>{t("common:goalDetails.verdictRelevant")}</Text>
                  <Text style={styles.verdictCardSubtitle}>{t("common:goalDetails.verdictRelevantDesc")}</Text>
                </View>
              </View>
              <Text style={styles.verdictCardXP}>
                {currentVerdict === "relevant" ? "✓" : currentVerdict ? "" : "+5 XP"}
              </Text>
            </Pressable>

            <Pressable 
              style={[
                styles.verdictCard,
                currentVerdict === "interesting" && styles.verdictCardSelected
              ]}
              onPress={() => handleVerdictPress("interesting")}
            >
              <View style={styles.verdictCardContent}>
                <Text style={styles.verdictCardIcon}>🔍</Text>
                <View style={styles.verdictCardText}>
                  <Text style={styles.verdictCardTitle}>{t("common:goalDetails.verdictFollowResearch")}</Text>
                  <Text style={styles.verdictCardSubtitle}>{t("common:goalDetails.verdictFollowResearchDesc")}</Text>
                </View>
              </View>
              <Text style={styles.verdictCardXP}>
                {currentVerdict === "interesting" ? "✓" : currentVerdict ? "" : "+5 XP"}
              </Text>
            </Pressable>

            <Pressable 
              style={[
                styles.verdictCard,
                currentVerdict === "skeptical" && styles.verdictCardSelected
              ]}
              onPress={() => handleVerdictPress("skeptical")}
            >
              <View style={styles.verdictCardContent}>
                <Text style={styles.verdictCardIcon}>🤨</Text>
                <View style={styles.verdictCardText}>
                  <Text style={styles.verdictCardTitle}>{t("common:goalDetails.verdictSkeptical")}</Text>
                  <Text style={styles.verdictCardSubtitle}>{t("common:goalDetails.verdictSkepticalDesc")}</Text>
                </View>
              </View>
              <Text style={styles.verdictCardXP}>
                {currentVerdict === "skeptical" ? "✓" : currentVerdict ? "" : "+5 XP"}
              </Text>
            </Pressable>
          </AppBox>
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
    backgroundColor: "rgba(120,255,220,0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(120,255,220,0.3)",
  },
  insightButtonAsked: {
    backgroundColor: "rgba(120,255,220,0.05)",
    borderColor: "rgba(120,255,220,0.15)",
    opacity: 0.7,
  },
  insightText: {
    color: Colors.dark.textLight,
    fontSize: 16,
  },
  verdictCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "rgba(120, 255, 220, 0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(120, 255, 220, 0.2)",
  },
  verdictCardSelected: {
    backgroundColor: "rgba(120, 255, 220, 0.2)",
    borderColor: "rgba(120, 255, 220, 0.6)",
    borderWidth: 2,
  },
  verdictCardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  verdictCardIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  verdictCardText: {
    flex: 1,
  },
  verdictCardTitle: {
    color: Colors.dark.primary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  verdictCardSubtitle: {
    color: Colors.dark.textLight,
    fontSize: 13,
  },
  verdictCardXP: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
  },
});
