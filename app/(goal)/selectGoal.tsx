import React from "react";
import { Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Tip, tipCategories } from "@/locales/tips";
import { useSupplements } from "@/locales/supplements";
import { Colors } from "@/constants/Colors";
import AppCard from "@/components/ui/AppCard";
import { useStorage } from "../context/StorageContext";

export default function SelectLevelScreen() {
  const { mainGoalId } = useLocalSearchParams<{ mainGoalId: string }>();
  const { myLevel } = useStorage();
  const { t } = useTranslation(["tips", "levels"]);
  const supplements = useSupplements();
  const router = useRouter();
  const { finishedGoals } = useStorage();

  const finishedGoalsForMainGoal = finishedGoals.filter((tip) => tip.mainGoalId);
  const finishedTipIds = finishedGoalsForMainGoal.map((tipCategory) => tipCategory.goalId);
  const newTips = tipCategories
    .filter((tip) => tip.mainGoalIds.includes(mainGoalId) && tip.level <= myLevel)
    .filter((tip) => !finishedTipIds.includes(tip.id))
    .sort((a, b) => a.level - b.level);

const getSupplementNames = (tip: Tip) => {
  if (!tip?.supplements || !Array.isArray(tip.supplements)) return "";

  return tip.supplements
    .map((s) => supplements?.find((ss) => ss.id === s.id)?.name ?? s.id)
    .join(", ");
};


const handleSelectLevel = (tipId: string) => {
  router.push({
    pathname: "/(goal)/details",
    params: { mainGoalId, goalId: tipId },
  });
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{t(`tips:${mainGoalId}.title`)}</Text>
      <Text style={styles.subHeader}>{t("common:selectGoal.description")}</Text>

      {newTips.map((tip) => {
        const supplementsText = tip.tips ? getSupplementNames(tip.tips[0]) : "";
        const title = t(`tips:${tip.title}`);
        const description = tip.tips && tip.tips[0].taskInfo ? t(tip.tips[0].taskInfo.description) : "";

        return (
          <AppCard
            key={tip.id}
            title={`Nivå ${tip.level}: ${title}`}
            description={`${description}\n\n${supplementsText}`}
            onPress={() => handleSelectLevel(tip.id)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.background,
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
    paddingTop: 80,
  },
  header: {
    fontSize: 24,
    color: Colors.dark.primary,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subHeader: {
    fontSize: 16,
    color: Colors.dark.textLight,
    marginBottom: 20,
    textAlign: "center",
  },
});
