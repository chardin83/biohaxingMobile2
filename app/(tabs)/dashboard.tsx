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
  const { myGoals, activeGoals, myXP, myLevel, finishedGoals, viewedTips } = useStorage();
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

  // Hitta favorit-markerade tips för ett specifikt mainGoal
  const getFavoriteTipsForMainGoal = (mainGoalId: string) => {
    return viewedTips
      ?.filter(tip => tip.mainGoalId === mainGoalId && tip.verdict === "relevant")
      .map(tip => {
        const goalCategory = tipCategories.find(c => c.id === tip.goalId);
        const tipDetails = goalCategory?.tips?.find(t => t.id === tip.tipId);
        return tipDetails ? t(`tips:${tipDetails.title}`) : null;
      })
      .filter(Boolean) || [];
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.appTitle}>{t("common:dashboard.appTitle")}</Text>

      <View style={styles.imageWrapper}>
        <Image source={Smart} style={styles.image} resizeMode="cover" />
        <Text style={styles.levelOverlay}>{t("common:dashboard.level")} {myLevel}</Text>
      </View>

      <Text style={styles.title}>{t(`levels:${levelTitle}`)}</Text>
      <ProgressBarWithLabel progress={myXP / xpMax} label={progressText} />

      {mainGoals
        .filter((item) => myGoals.includes(item.id))
        .map((item) => {
          const mainGoalId = item.id;
          const favoriteTipsList = getFavoriteTipsForMainGoal(mainGoalId);
          
          // Om det finns favoriter, visa dem, annars visa en standard-text
          const description = favoriteTipsList.length > 0 
            ? `${favoriteTipsList.join("\n")}`
            : t("common:dashboard.noFavorites");

          return (
            <AppCard
              key={mainGoalId}
              icon={item.icon}
              title={t(`tips:${mainGoalId}.title`)}
              description={description}
              isActive={favoriteTipsList.length > 0}
              onPress={() =>
                router.push({
                  pathname: "/(goal)/[mainGoalId]",
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
  sectionTitle: {
    fontSize: 18,
    color: Colors.dark.primary,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textTransform: "uppercase",
  },
});
