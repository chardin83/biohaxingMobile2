import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Colors } from "@/constants/Colors";
import { useTranslation } from "react-i18next";
import AppBox from "@/components/ui/AppBox";

interface VerdictSelectorProps {
  currentVerdict?: "relevant" | "interesting" | "skeptical";
  onVerdictPress: (verdict: "relevant" | "interesting" | "skeptical") => void;
}

export default function VerdictSelector({ currentVerdict, onVerdictPress }: VerdictSelectorProps) {
  const { t } = useTranslation();

  return (
    <AppBox title={t("common:goalDetails.verdict")}>
      <Pressable 
        style={[
          styles.verdictCard,
          currentVerdict === "relevant" && styles.verdictCardSelected
        ]}
        onPress={() => onVerdictPress("relevant")}
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
        onPress={() => onVerdictPress("interesting")}
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
        onPress={() => onVerdictPress("skeptical")}
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
  );
}

const styles = StyleSheet.create({
  verdictCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.dark.accentVeryWeak,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.accentWeak,
  },
  verdictCardSelected: {
    backgroundColor: Colors.dark.accentWeak,
    borderColor: Colors.dark.accentDefault,
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
