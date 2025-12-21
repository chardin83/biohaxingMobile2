import React from "react";
import { Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { goals, GoalStep } from "@/locales/goals";
import { useSupplements } from "@/locales/supplements";
import { Colors } from "@/constants/Colors";
import AppCard from "@/components/ui/AppCard";
import { useStorage } from "../context/StorageContext";

export default function SelectLevelScreen() {
  const { mainGoalId } = useLocalSearchParams<{ mainGoalId: string }>();
  const { myLevel } = useStorage();
  const { t } = useTranslation(["goals", "levels"]);
  const supplements = useSupplements();
  const router = useRouter();
  const { finishedGoals } = useStorage();

  const finishedGoalsForMainGoal = finishedGoals.filter((goal) => goal.mainGoalId);
  const finishedGoalIds = finishedGoalsForMainGoal.map((goal) => goal.goalId);
  const newGoals = goals
    .filter((goal) => goal.mainGoalIds.includes(mainGoalId) && goal.level <= myLevel)
    .filter((goal) => !finishedGoalIds.includes(goal.id))
    .sort((a, b) => a.level - b.level);

const getSupplementNames = (goal: GoalStep) => {
  if (!goal?.supplements || !Array.isArray(goal.supplements)) return "";

  return goal.supplements
    .map((s) => supplements?.find((ss) => ss.id === s.id)?.name ?? s.id)
    .join(", ");
};


const handleSelectLevel = (goalId: string) => {
  router.push({
    pathname: "/(goal)/details",
    params: { mainGoalId, goalId },
  });
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{t(`goals:${mainGoalId}.title`)}</Text>
      <Text style={styles.subHeader}>{t("common:selectGoal.description")}</Text>

      {newGoals.map((goal) => {
        const supplementsText = goal.steps ? getSupplementNames(goal.steps[0]) : "";
        const title = t(`goals:${goal.title}`);
        const instructions = goal.steps && goal.steps[0].taskInfo ? t(goal.steps[0].taskInfo.instructions) : "";

        return (
          <AppCard
            key={goal.id}
            title={`Nivå ${goal.level}: ${title}`}
            description={`${instructions}\n\n${supplementsText}`}
            onPress={() => handleSelectLevel(goal.id)}
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
