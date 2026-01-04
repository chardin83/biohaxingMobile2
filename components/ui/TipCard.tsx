import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Colors } from "@/constants/Colors";

interface TipProgress {
  xp: number;
  progress: number;
  askedQuestions: number;
  verdict?: "relevant" | "interesting" | "skeptical";
}

interface TipCardProps {
  tip: {
    id: string;
    title: string;
    taskInfo?: {
      description: string;
    };
  };
  tipProgress: TipProgress;
  onPress: () => void;
}

export default function TipCard({ tip, tipProgress, onPress }: TipCardProps) {
  const { t } = useTranslation();

  const isStarted = tipProgress.xp > 0;
  const isCompleted = tipProgress.progress >= 1;
  const isRelevant = tipProgress.verdict === "relevant";
  const isInteresting = tipProgress.verdict === "interesting";
  const isSkeptical = tipProgress.verdict === "skeptical";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.tipSection,
        pressed && styles.tipPressed,
        isCompleted && styles.tipCompleted,
        isRelevant && styles.tipRelevant,
        isInteresting && styles.tipInteresting,
        isSkeptical && styles.tipSkeptical,
      ]}
      onPress={onPress}
    >
      <View style={styles.tipHeader}>
        <View style={styles.tipHeaderLeft}>
          <Text style={styles.tipTitle}>
            {isRelevant && "⭐ "}
            {isInteresting && "🔍 "}
            {isSkeptical && "🤨 "}
            {isCompleted && "✅ "}
            {t(`tips:${tip.title}`)}
          </Text>
          <Text style={styles.tipDescription}>
            {t(`tips:${tip.taskInfo?.description}`)}
          </Text>
        </View>

        {isStarted && (
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>{tipProgress.xp} XP</Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      {isStarted && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${tipProgress.progress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {tipProgress.askedQuestions}/3 {t("common:goalDetails.questionsExplored")}
          </Text>
        </View>
      )}

      <Text style={styles.tapHint}>
        {isStarted
          ? t("common:goalDetails.continueExploring")
          : t("common:goalDetails.startExploring")}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tipSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.accentVeryWeak,
  },
  tipPressed: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: Colors.dark.accentMedium,
  },
  tipCompleted: {
    borderColor: Colors.dark.accentMedium,
    backgroundColor: Colors.dark.accentVeryWeak,
  },
  tipRelevant: {
    borderColor: Colors.dark.successDefault,
    backgroundColor: Colors.dark.successWeak,
    borderWidth: 2,
  },
  tipInteresting: {
    borderColor: Colors.dark.infoDefault,
    backgroundColor: Colors.dark.infoWeak,
    borderWidth: 2,
  },
  tipSkeptical: {
    borderColor: Colors.dark.warmDefault,
    backgroundColor: Colors.dark.warmWeak,
    opacity: 0.7,
  },
  tipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  tipHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  tipTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  tipDescription: {
    color: Colors.dark.textTertiary,
    fontSize: 14,
    lineHeight: 20,
  },
  xpBadge: {
    backgroundColor: Colors.dark.accentWeak,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.accentMedium,
  },
  xpText: {
    color: Colors.dark.accentStrong,
    fontSize: 12,
    fontWeight: "700",
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.dark.textWeak,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.dark.accentDefault,
  },
  progressText: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  tapHint: {
    color: Colors.dark.accentDefault,
    fontSize: 12,
    marginTop: 6,
    fontStyle: "italic",
  },
});
