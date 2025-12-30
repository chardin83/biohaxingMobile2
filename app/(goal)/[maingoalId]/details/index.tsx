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
    tipId?: string;  // Lägg till tipId
  }>();
  const supplements = useSupplements();
  const { setActiveGoals, activeGoals, setFinishedGoals, setMyXP } =
    useStorage();
  const [showSkipModal, setShowSkipModal] = React.useState(false);
  const [showAnalyzeModal, setShowAnalyzeModal] = React.useState(false);
  const [showStartModal, setShowStartModal] = React.useState(false);

  const mainGoal = mainGoals.find((g) => g.id === mainGoalId);
  const goal = tipCategories.find((l) => l.id === goalId);
  const activeGoal = activeGoals.find((g) => g.mainGoalId === mainGoalId);
  const startDate = activeGoal ? new Date(activeGoal.startedAt) : null;

  // Hitta rätt tip baserat på tipId, annars använd första
  const step: any = tipId 
    ? goal?.tips?.find((tip) => tip.id === tipId) ?? {}
    : goal?.tips?.[0] ?? {};

  const goalIcon = mainGoal?.icon ?? "target";
  const supplementId = step?.supplements?.[0]?.id ?? undefined;
  const supplementName = supplements?.find((s) => s.id === supplementId)?.name;

  const duration = step?.taskInfo?.duration ?? undefined;
  const endDate =
    startDate && duration
      ? getEndDate(startDate, duration.amount, duration.unit)
      : null;

  const now = new Date();
  let progress = null;
  let timeLeftText = "";
  let isGoalFinished = false;

  if (startDate && duration && endDate) {
    progress = calculateGoalProgress(startDate, duration);
    timeLeftText = getTimeLeftText(t, endDate, duration.unit);
    isGoalFinished = now >= endDate;
  }

  if (!mainGoal || !goal) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Goal not found.</Text>
      </View>
    );
  }

  const confirmStartGoal = () => {
    setActiveGoals((prev) => [
      ...prev.filter((g) => g.mainGoalId !== mainGoalId),
      {
        mainGoalId,
        goalId: goalId,
        startedAt: new Date().toISOString(),
      },
    ]);
    if (tasks.length > 0) { /* empty */ } else {
      router.replace("/(tabs)/dashboard");
    }
  };
  
  const handleFinishGoal = () => {
    setFinishedGoals((prev) => [
      ...prev,
      { mainGoalId, finished: new Date().toISOString(), goalId: goalId },
    ]);

    setActiveGoals((prev) =>
      prev.filter((g) => g.mainGoalId !== mainGoalId)
    );
    setMyXP((prev) => prev + (goal.xp ?? 0));
    router.replace("/(tabs)/dashboard");
  };

  const handleSkipGoal = () => {
    if (activeGoal && !isGoalFinished) {
      setShowSkipModal(true);
    } else {
      actuallySkipGoal();
    }
  };

  const actuallySkipGoal = () => {
    setActiveGoals((prev) => prev.filter((g) => g.mainGoalId !== mainGoalId));
    router.back();
  };

  const information = step?.information;
  const startPromptKey = step?.startPrompt;
  const analyzePromptKey = step?.analyzePrompt;
  const titleKey = step?.title;
  const taskInstructionsKey = step?.taskInfo?.instructions;
  const tasks: string[] = step?.taskInfo?.tasks ?? [];
  const [checkedTasks, setCheckedTasks] = React.useState<boolean[]>(
    Array(tasks.length).fill(false)
  );

  const [missingTasks, setMissingTasks] = React.useState<boolean[]>(
    Array(tasks.length).fill(false)
  );

  React.useEffect(() => {
    setCheckedTasks(Array(tasks.length).fill(false));
    setMissingTasks(Array(tasks.length).fill(false));
  }, [tasks.length, activeGoal?.startedAt]);

  const toggleTask = (index: number) => {
    if (!activeGoal) return;
    setCheckedTasks((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];

      setMissingTasks((mPrev) => {
        const mUpdated = [...mPrev];
        mUpdated[index] = !updated[index] ? mUpdated[index] : false;
        return mUpdated;
      });

      return updated;
    });
  };

  const handleAnalyzePressed = () => {
    const missing = checkedTasks.map((c) => !c);
    const hasMissing = missing.some(Boolean);
    setMissingTasks(missing);
    if (!hasMissing) {
      setShowAnalyzeModal(true);
    }
  };

  const [analysisApproved, setAnalysisApproved] = React.useState(false);

  React.useEffect(() => {
    setAnalysisApproved(false);
  }, [activeGoal?.startedAt, mainGoalId]);

  const handleAnalyzeFile = async (file: { uri?: string; name?: string; type?: string; file_base64?: string; mime?: string }) => {
    const promptToSend = analyzePromptKey ? t(`tips:${analyzePromptKey}`) : t(`tips:${titleKey}`);
    const resp = await sendFileToAIAnalysis({
      uri: file.uri,
      name: file.name,
      type: file.type,
      prompt: promptToSend,
      supplement: supplementName,
      file_base64: (file as any).file_base64,
      mime: (file as any).mime,
    });

    const payload = resp && typeof resp === "object" && "result" in resp ? resp.result : resp;

    if (payload?.is_valid === false && payload?.raw?.message?.function_call?.arguments) {
      try {
        const argsStr = payload.raw.message.function_call.arguments;
        const parsedArgs = typeof argsStr === "string" ? JSON.parse(argsStr) : argsStr;
        if (parsedArgs && typeof parsedArgs === "object") Object.assign(payload, parsedArgs);
      } catch {
        /* ignore */
      }
    }

    if (typeof payload?.is_valid === "boolean") {
      const conf = Math.round((payload.confidence || 0) * 100);
      if (!payload.is_valid) {
        const reason = payload.reason ?? payload.reason_text ?? t("common:goalDetails.analysisNoMatchReason");
        return { output: `${t("common:goalDetails.analysisInvalid")} (${conf}%)\n\n${reason}`, preview: payload.preview ?? file.uri };
      } else {
        const parts: string[] = [];
        if (payload.analysis_text) parts.push(payload.analysis_text);
        if (payload.analysis_object) {
          try { parts.push("```\n" + JSON.stringify(payload.analysis_object, null, 2) + "\n```"); } catch { parts.push(String(payload.analysis_object)); }
        }
        if (payload.preview) parts.unshift(`![preview](${payload.preview})`);
        const out = parts.length > 0 ? parts.join("\n\n") : (payload.analysis_text ?? t("common:goalDetails.noAnswer"));
        setAnalysisApproved(true);
        return { output: out, preview: payload.preview ?? file.uri };
      }
    }

    if (payload?.content) {
      return { output: typeof payload.content === "string" ? payload.content : JSON.stringify(payload.content, null, 2), preview: payload.preview ?? file.uri };
    }
    if (typeof payload === "string") {
      return { output: payload, preview: file.uri };
    }
    return { output: payload ? JSON.stringify(payload, null, 2) : t("common:goalDetails.noAnswer"), preview: file.uri };
  };

  const effectiveIsFinished = isGoalFinished || analysisApproved;

  const handleAIInsightPress = (question: string) => {
    //const tipInfo = `Tip: ${t(`tips:${titleKey}`)}\nDescription: ${t(`tips:${step?.taskInfo?.description}`) || ''}\nInformation: ${t(`tips:${information?.text}`) || ''}`;
    const tipInfo = `Tip: ${t(`tips:${titleKey}`)}\nDescription: ${t(`tips:${step?.taskInfo?.description}`) || ''} \nInformation: ${t(`tips:${information.text}`)  || ''}`;
    
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
    
    router.push({
      pathname: "/(tabs)/chat",
      params: {
        initialPrompt: fullPrompt,
        returnPath: `/(goal)/${mainGoalId}/details`,
        returnParams: JSON.stringify({ mainGoalId, goalId, tipId }),
      }
    });
  };

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
            <Text style={styles.xpText}>{goal.xp ?? 0} XP</Text>
            {startDate && endDate && progress && (
              <ProgressBarWithLabel
                progress={progress.progress}
                label={timeLeftText}
              />
            )}
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
              onPress={() => handleAIInsightPress("What studies exists?")}
              style={styles.insightButton}
            >
              <Text style={styles.insightText}>What studies exists?</Text>
            </Pressable>
            
            <Pressable 
              onPress={() => handleAIInsightPress("Which people are talking about this subject?")}
              style={styles.insightButton}
            >
              <Text style={styles.insightText}>Which people are talking about this subject?</Text>
            </Pressable>
            
            <Pressable 
              onPress={() => handleAIInsightPress("What risks are associated with this?")}
              style={styles.insightButton}
            >
              <Text style={styles.insightText}>What risks are associated with this?</Text>
            </Pressable>
          </AppBox>

          <View>
           
            {activeGoal && !isGoalFinished && (
              <Text style={styles.disabledHint}>
                {t("common:goalDetails.analyzeHint")}
              </Text>
            )}
          </View>

          <ThemedModal
            visible={showSkipModal}
            title={t("common:general.areYouSure")}
            onClose={() => setShowSkipModal(false)}
            onSave={() => {
              setShowSkipModal(false);
              actuallySkipGoal();
            }}
            okLabel={t("common:goalDetails.skipConfirmYes")}
          >
            <ThemedText
              style={{ textAlign: "center", color: Colors.dark.textLight }}
            >
              {t("common:goalDetails.skipConfirmBody")}
            </ThemedText>
          </ThemedModal>

          <AnalysisModal
            visible={showAnalyzeModal}
            onClose={() => setShowAnalyzeModal(false)}
            t={t}
            prompt={analyzePromptKey ? t(`goals:${analyzePromptKey}`) : t(`goals:${titleKey}`)}
            analyzeFn={handleAnalyzeFile}
          />

          <AnalysisModal
            visible={showStartModal}
            onClose={() => setShowStartModal(false)}
            t={t}
            prompt={startPromptKey ?? ""}
            onConfirm={() => {
              setShowStartModal(false);
              confirmStartGoal();
            }}
            description="Vänligen ta ett foto av kosttillskottets burk med namnet synligt för att starta denna nivå."
            supplement={supplementName}
            analyzeFn={async (file) => {
              const promptToSend = analyzePromptKey ? t(`goals:${analyzePromptKey}`) : t(`goals:${titleKey}`);
              return await sendFileToAISupplementAnalysis({
                uri: file.uri,
                name: file.name,
                type: file.type,
                prompt: promptToSend,
                supplement: supplementName,
                file_base64: (file as any).file_base64,
                mime: (file as any).mime,
              });
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
  insightText: {
    color: Colors.dark.textLight,
    fontSize: 16,
  },
});
