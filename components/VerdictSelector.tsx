import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Colors } from "@/constants/Colors";
import { useTranslation } from "react-i18next";
import AppBox from "@/components/ui/AppBox";

type VerdictValue = "interested" | "startNow" | "wantMore" | "alreadyWorks" | "notInterested" | "noResearch" | "testedFailed";

interface VerdictSelectorProps {
  currentVerdict?: VerdictValue;
  onVerdictPress: (verdict: VerdictValue) => void;
}

const getMainCategory = (verdict: VerdictValue): "interested" | "notInterested" | null => {
  if (["startNow", "wantMore", "alreadyWorks"].includes(verdict)) return "interested";
  if (["noResearch", "testedFailed"].includes(verdict)) return "notInterested";
  return null;
};

const getSubOptionLabel = (verdict: VerdictValue, t: any): string => {
  const labels: Record<VerdictValue, string> = {
    interested: "",
    notInterested: "",
    startNow: t("common:goalDetails.verdictStartNow"),
    wantMore: t("common:goalDetails.verdictWantMore"),
    alreadyWorks: t("common:goalDetails.verdictAlreadyWorks"),
    noResearch: t("common:goalDetails.verdictNoResearch"),
    testedFailed: t("common:goalDetails.verdictTestedFailed"),
  };
  return labels[verdict] || "";
};

export default function VerdictSelector({ currentVerdict, onVerdictPress }: VerdictSelectorProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<"interested" | "notInterested" | null>(null);

  const mainCategory = currentVerdict ? getMainCategory(currentVerdict) : null;
  const showMainCategory = selectedCategory || mainCategory;

  const isSelectedInCategory = (verdict: VerdictValue) => currentVerdict === verdict;

  // För sub-alternativ: anropa callback och stäng vyn
  const getSubOption = (icon: string, titleKey: string, verdictValue: VerdictValue, xp = true) => (
    <Pressable 
      style={[
        styles.verdictCard,
        isSelectedInCategory(verdictValue) && styles.verdictCardSelected
      ]}
      onPress={() => {
        onVerdictPress(verdictValue);
        setSelectedCategory(null);
      }}
    >
      <View style={styles.verdictCardContent}>
        <Text style={styles.verdictCardIcon}>{icon}</Text>
        <View style={styles.verdictCardText}>
          <Text style={styles.verdictCardTitle}>{t(`common:goalDetails.${titleKey}`)}</Text>
        </View>
      </View>
      <Text style={styles.verdictCardXP}>
        {isSelectedInCategory(verdictValue) ? "✓" : xp ? "+5 XP" : ""}
      </Text>
    </Pressable>
  );

  // For displaying category button with sub-option label
  const getCategoryButtonWithLabel = (icon: string, titleKey: string, category: "interested" | "notInterested") => {
    const isThisCategory = mainCategory === category;
    const subLabel = isThisCategory && currentVerdict ? getSubOptionLabel(currentVerdict, t) : null;

    return (
      <Pressable 
        style={[
          styles.verdictCard,
          showMainCategory === category && styles.verdictCardSelected
        ]}
        onPress={() => selectedCategory ? setSelectedCategory(null) : setSelectedCategory(category)}
      >
        <View style={styles.verdictCardContent}>
          <Text style={styles.verdictCardIcon}>{icon}</Text>
          <View style={styles.verdictCardText}>
            <Text style={styles.verdictCardTitle}>{t(`common:goalDetails.${titleKey}`)}</Text>
            {subLabel && (
              <Text style={styles.subOptionLabel}>{subLabel}</Text>
            )}
          </View>
        </View>
        <Text style={styles.verdictCardXP}>
          {showMainCategory === category && currentVerdict ? "✓" : "+5 XP"}
        </Text>
      </Pressable>
    );
  };

  // Initial state: show two main options, optionally with selected sub-option
  if (!selectedCategory) {
    return (
      <AppBox title={t("common:goalDetails.verdict")}>
        {getCategoryButtonWithLabel("⭐", "verdictInterested", "interested")}
        {getCategoryButtonWithLabel("🚫", "verdictNotInterested", "notInterested")}
      </AppBox>
    );
  }

  // Interested path: 3 options
  if (selectedCategory === "interested") {
    return (
      <AppBox title={t("common:goalDetails.verdict")}>
        <Pressable 
          style={styles.backButton}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={styles.backButtonText}>{t("back")}</Text>
        </Pressable>
        {getSubOption("▶️", "verdictStartNow", "startNow")}
        {getSubOption("🔍", "verdictWantMore", "wantMore")}
        {getSubOption("✅", "verdictAlreadyWorks", "alreadyWorks")}
      </AppBox>
    );
  }

  // Not interested path: 2 options
  if (selectedCategory === "notInterested") {
    return (
      <AppBox title={t("common:goalDetails.verdict")}>
        <Pressable 
          style={styles.backButton}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={styles.backButtonText}>{t("back")}</Text>
        </Pressable>
        {getSubOption("🤨", "verdictNoResearch", "noResearch")}
        {getSubOption("❌", "verdictTestedFailed", "testedFailed")}
      </AppBox>
    );
  }

  return null;
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
  verdictCardXP: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.dark.accentVeryWeak,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.accentWeak,
  },
  backButtonText: {
    color: Colors.dark.accentStrong,
    fontSize: 14,
    fontWeight: "600",
  },
  selectedLabel: {
    color: Colors.dark.accentStrong,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.dark.accentVeryWeak,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.accentStrong,
  },
  subOptionLabel: {
    color: Colors.dark.textLight,
    fontSize: 13,
    fontStyle: "italic",
    marginLeft: 16,
    marginTop: -8,
    marginBottom: 12,
  },
});
