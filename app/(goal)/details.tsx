import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { mainGoals } from "@/locales/mainGoals";
import { Colors } from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSupplements } from "@/locales/supplements";
import { useTranslation } from "react-i18next";
import { useStorage } from "../context/StorageContext";
import { Icon } from "react-native-paper";
import { ThemedModal } from "@/components/ThemedModal";
import { ThemedText } from "@/components/ThemedText";
import AppButton from "@/components/ui/AppButton";
import {
  calculateGoalProgress,
  getEndDate,
  getTimeLeftText,
} from "../utils/goalUtils";
import AppBox from "@/components/ui/AppBox";
import ProgressBarWithLabel from "@/components/ui/ProgressbarWithLabel";
import { goals } from "@/locales/goals";
import AnalysisModal from "@/components/modals/FileAnalysisModal";
import { sendFileToAIAnalysis, sendFileToAISupplementAnalysis } from "@/services/gptServices";

export default function GoalDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mainGoalId, goalId } = useLocalSearchParams<{
    mainGoalId: string;
    goalId: string;
  }>();
  const supplements = useSupplements();
  const { setActiveGoals, activeGoals, setFinishedGoals, setMyXP } =
    useStorage();
  const [showSkipModal, setShowSkipModal] = React.useState(false);
  const [showAnalyzeModal, setShowAnalyzeModal] = React.useState(false);
  const [showStartModal, setShowStartModal] = React.useState(false);

  const mainGoal = mainGoals.find((g) => g.id === mainGoalId);
  const goal = goals.find((l) => l.id === goalId);
  const activeGoal = activeGoals.find((g) => g.mainGoalId === mainGoalId);
  const startDate = activeGoal ? new Date(activeGoal.startedAt) : null;

  // Use first step when available, fall back to older flat structure
  const step: any = goal?.steps?.[0] ?? {};

  const goalIcon = mainGoal?.icon ?? "target";
  const supplementId =
    step?.supplements?.[0]?.id ?? undefined;
  const supplementName = supplements?.find((s) => s.id === supplementId)?.name;

  const duration =
    step?.taskInfo?.duration ?? undefined;
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
  const taskInstructionsKey =
    step?.taskInfo?.instructions;
   const tasks: string[] = step?.taskInfo?.tasks ?? [];
const [checkedTasks, setCheckedTasks] = React.useState<boolean[]>(
  Array(tasks.length).fill(false)
);

// Mark missing (ej kryssade) tasks efter validering
const [missingTasks, setMissingTasks] = React.useState<boolean[]>(
  Array(tasks.length).fill(false)
);

// Reset checkboxes & missing markers whenever the task list or activeGoal changes
React.useEffect(() => {
  setCheckedTasks(Array(tasks.length).fill(false));
  setMissingTasks(Array(tasks.length).fill(false));
}, [tasks.length, activeGoal?.startedAt]);

const toggleTask = (index: number) => {
  // Only allow toggling when the goal is active (started)
  if (!activeGoal) return;
  setCheckedTasks((prev) => {
    const updated = [...prev];
    updated[index] = !updated[index];

    // Clear missing marker for this task as soon as it's checked
    setMissingTasks((mPrev) => {
      const mUpdated = [...mPrev];
      // if task is now checked -> not missing; if unchecked keep as false (user can re-analyze)
      mUpdated[index] = !updated[index] ? mUpdated[index] : false;
      return mUpdated;
    });

    return updated;
  });
};

// Validate tasks when pressing Analyze: highlight missing as red, only open modal if none missing
const handleAnalyzePressed = () => {
  const missing = checkedTasks.map((c) => !c);
  const hasMissing = missing.some(Boolean);
  setMissingTasks(missing);
  if (!hasMissing) {
    setShowAnalyzeModal(true);
  } else {
    // optionally scroll to tasks or show toast — left minimal per request
  }
};

  // När analysen ger godkänt resultat sätter vi detta till true så finish-knappen syns
  const [analysisApproved, setAnalysisApproved] = React.useState(false);

  // Reset analysis approval när aktivt mål ändras
  React.useEffect(() => {
    setAnalysisApproved(false);
  }, [activeGoal?.startedAt, mainGoalId]);

  // ny: flytta analyslogik hit så modalen bara visar resultatet
  const handleAnalyzeFile = async (file: { uri?: string; name?: string; type?: string; file_base64?: string; mime?: string }) => {
    const promptToSend = analyzePromptKey ? t(`goals:${analyzePromptKey}`) : t(`goals:${titleKey}`);
    const resp = await sendFileToAIAnalysis({
      uri: file.uri,
      name: file.name,
      type: file.type,
      prompt: promptToSend,
      supplement: supplementName,
      file_base64: (file as any).file_base64,
      mime: (file as any).mime,
    });

    // normalisera payload (samma mappning som tidigare)
    const payload = resp && typeof resp === "object" && "result" in resp ? resp.result : resp;

    // om model returnerade funktion-arguments inbäddat -> försök använda dem
    if (payload?.is_valid === false && payload?.raw?.message?.function_call?.arguments) {
      try {
        const argsStr = payload.raw.message.function_call.arguments;
        const parsedArgs = typeof argsStr === "string" ? JSON.parse(argsStr) : argsStr;
        if (parsedArgs && typeof parsedArgs === "object") Object.assign(payload, parsedArgs);
      } catch {
        /* ignore */
      }
    }

    // bygg en presentationstext
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
        // Markera att analysen godkände målet — använd state så UI uppdateras korrekt
        setAnalysisApproved(true);
        return { output: out, preview: payload.preview ?? file.uri };
      }
    }

    // fallback: content / text / object
    if (payload?.content) {
      return { output: typeof payload.content === "string" ? payload.content : JSON.stringify(payload.content, null, 2), preview: payload.preview ?? file.uri };
    }
    if (typeof payload === "string") {
      return { output: payload, preview: file.uri };
    }
    return { output: payload ? JSON.stringify(payload, null, 2) : t("common:goalDetails.noAnswer"), preview: file.uri };
  };

  const effectiveIsFinished = isGoalFinished || analysisApproved;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 140, flexGrow: 1 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.goalTitle}>{t(`goals:${mainGoalId}.title`)}</Text>
      <View style={styles.topSection}>
        <View style={styles.iconWrapper}>
          <Icon source={goalIcon} size={50} color={Colors.dark.primary} />
        </View>
        <Text style={styles.subTitle}>
          {supplementName ?? t(`goals:${titleKey}`)}
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
            {information.text ? t(`goals:${information.text}`) : information}
          </Text>
          <Text
            style={{
              color: Colors.dark.textLight,
              fontStyle: "italic",
              fontWeight: "bold",
            }}
          >
            {information.author ? t(`goals:${information.author}`) : ""}
          </Text>
        </AppBox>
      )}

<AppBox title={t(`common:goalDetails.taskInfo`)}>
  <Text style={{ color: Colors.dark.textLight }}>
    {taskInstructionsKey ? t(`goals:${taskInstructionsKey}`) : ""}
    {duration &&
      `\n\n${duration.amount} ${t(
        `common:goalDetails.durationUnits.${duration.unit}`
      )}`}
  </Text>
  {tasks.length > 0 && (
    <View style={{ gap: 12, marginTop: 12 }}>
      {tasks.map((taskKeyStr, i) => {
        const checked = checkedTasks[i];
        const isMissing = missingTasks[i];
        return (
          <Pressable
            key={i}
            onPress={() => toggleTask(i)}
            disabled={!activeGoal}
            style={{
              flexDirection: "row",
              alignItems: "center",
              opacity: !activeGoal ? 0.5 : 1,
            }}
          >
            <Icon
              source={checked ? "checkbox-marked" : "checkbox-blank-outline"}
              size={24}
              color={isMissing ? "#ff3b30" : Colors.dark.primary}
            />
            <Text
              style={{
                marginLeft: 8,
                color: isMissing ? "#ff3b30" : Colors.dark.textLight,
              }}
            >
              {t(`goals:${taskKeyStr}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  )}
</AppBox>

      <AppBox title={t(`common:goalDetails.aiInsights`)}>TBC...</AppBox>

<View>
  <View style={styles.buttonRow}>
    {activeGoal ? (
      // If an analyze prompt exists but analysis is already approved, show Finish.
      analyzePromptKey && !analysisApproved ? (
        <View style={styles.analyzeWrapper}>
          <AppButton
            title={t("common:goalDetails.analyze")}
            onPress={handleAnalyzePressed}
            disabled={!effectiveIsFinished}
            variant="primary"
            glow={true}
            style={!effectiveIsFinished ? { opacity: 0.5 } : undefined}
          />
        </View>
      ) : (
        <View style={styles.analyzeWrapper}>
          <AppButton
            title={t("common:goalDetails.finish")}
            onPress={handleFinishGoal}
            disabled={!effectiveIsFinished}
            variant="primary"
            glow={true}
            style={!effectiveIsFinished ? { opacity: 0.5 } : undefined}
          />
        </View>
      )
    ) : (
      <>
        <AppButton
          title={t("common:goalDetails.start")}
          onPress={() => setShowStartModal(true)}
          variant="primary"
          glow={true}
        />
        <AppButton
          title={t("common:goalDetails.skip")}
          onPress={handleSkipGoal}
          variant="secondary"
        />
      </>
    )}
  </View>

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
         // use analyzePromptKey (translated) as prompt when calling endpoint
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
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.background,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
    paddingTop: 60,
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
});
