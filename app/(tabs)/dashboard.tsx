import React from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import Smart from "@/assets/images/smart.png";
import { Colors } from "@/constants/Colors";
import { useStorage } from "../context/StorageContext";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSupplements } from "@/locales/supplements";
import AppCard from "@/components/ui/AppCard";
import ProgressBarWithLabel from "@/components/ui/ProgressbarWithLabel";
import { levels } from "@/locales/levels";
import { TipCategory, tipCategories } from "@/locales/tips";
import { mainGoals } from "@/locales/mainGoals";

export default function BiohackerDashboard() {
  const { t } = useTranslation(["common", "goals", "levels"]);
  const { myGoals, activeGoals, myXP, myLevel, finishedGoals } = useStorage();
  const router = useRouter();
  const supplements = useSupplements();

  const nextLevel = levels.find((l) => l.level === myLevel + 1);
  const xpMax =
    nextLevel?.requiredXP ??
    levels.find((l) => l.level === myLevel)?.requiredXP ??
    0;
  const progressText = `${myXP} / ${xpMax} XP`;
  const levelTitle = levels.find((o) => o.level === myLevel)?.titleKey;

  // Hantera nya steps-strukturen: visa tillskott från första steget (om finns),
  // annars visa översatt titel för steget/goal
  const getSupplementsText = (goal: TipCategory) => {
    if (!goal) return "";
    const step = goal.tips?.[0];
    if (!step) return t(`tips:${goal.title}`);
    if (!step.supplements || step.supplements.length === 0)
      return t(`tips:${step.title}`);
    return step.supplements
      .map((s) => supplements.find((ss) => ss.id === s.id)?.name ?? s.id)
      .join(", ");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.appTitle}>BIOHAXING</Text>

      <View style={styles.imageWrapper}>
        <Image source={Smart} style={styles.image} resizeMode="cover" />
        <Text style={styles.levelOverlay}>LEVEL {myLevel}</Text>
      </View>

      <Text style={styles.title}>{t(`levels:${levelTitle}`)}</Text>
      <ProgressBarWithLabel progress={myXP / xpMax} label={progressText} />

      {mainGoals
        .filter((item) => myGoals.includes(item.id))
        .filter((item) => {
          const relatedGoals = tipCategories.filter((g) =>
            g.mainGoalIds.includes(item.id)
          );
          const finishedForMainGoal = finishedGoals.filter(
            (f) => f.mainGoalId === item.id
          );
          // Visa endast om det finns några kvar att göra
          return finishedForMainGoal.length < relatedGoals.length;
        })
        .map((item) => {
          const mainGoalId = item.id;
          const goalLevels = tipCategories
            .filter(
              (lvl) =>
                lvl.mainGoalIds.includes(mainGoalId) &&
                lvl.level <= myLevel &&
                !finishedGoals.some(
                  (f) => f.goalId === lvl.id && f.mainGoalId === mainGoalId
                )
            )
            .sort((a, b) => a.level - b.level);

          const activeGoal = activeGoals.find(
            (g) => g.mainGoalId === mainGoalId
          );
          const goalId = activeGoal?.goalId;
          const goal = tipCategories.find((lvl) => lvl.id === goalId);

          const isActive = Boolean(activeGoal);
          const hasSelected = Boolean(goal);

          let description = "";

          if (hasSelected && goal) {
            description = getSupplementsText(goal);
          } else {
            description = goalLevels
              .map((lvl) => getSupplementsText(lvl))
              .filter(Boolean)
              .join("\n");
          }

          return (
            <AppCard
              key={mainGoalId}
              icon={item.icon}
              title={t(`tips:${mainGoalId}.title`)}
              description={description}
              isActive={isActive}
              onPress={() =>
                hasSelected
                  ? router.push({
                      pathname: "/(goal)/details",
                      params: { mainGoalId, goalId },
                    })
                  : router.push({
                      pathname: "/(goal)/[mainGoalId]"
                      params: { mainGoalId },
                    })
              }
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
    alignItems: "center",
    padding: 10,
    paddingBottom: 150,
    paddingTop: 40,
  },
  appTitle: {
    fontSize: 24,
    color: Colors.dark.primary,
    marginVertical: 10,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 300,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  levelOverlay: {
    position: "absolute",
    bottom: 22,
    color: Colors.dark.textWhite,
    fontSize: 25,
    fontWeight: "bold",
    paddingHorizontal: 12,
    borderRadius: 6,
    textShadowOffset: { width: 1, height: 1 },
    textShadowColor: Colors.dark.primary,
    textShadowRadius: 6,
  },
  title: {
    fontSize: 20,
    color: Colors.dark.primary,
    fontWeight: "bold",
    marginBottom: 10,
    textTransform: "uppercase",
  },
});
