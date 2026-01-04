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
import { tips } from "@/locales/tips";
import { areas } from "@/locales/areas";

export default function BiohackerDashboard() {
  const { t } = useTranslation(["common", "areas", "levels"]);
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

  // Hitta favorit-markerade tips för ett specifikt område
  const getFavoriteTipsForArea = (areaId: string) => {
    return viewedTips
      ?.filter(tip => tip.mainGoalId === areaId && tip.verdict === "relevant")
      .map(tip => {
        const tipDetails = tips.find(t => t.id === tip.tipId);
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

      {areas
        .filter((item) => myGoals.includes(item.id))
        .map((item) => {
          const areaId = item.id;
          const favoriteTipsList = getFavoriteTipsForArea(areaId);
          
          // Om det finns favoriter, visa dem, annars visa en standard-text
          const description = favoriteTipsList.length > 0 
            ? `${favoriteTipsList.join("\n")}`
            : t("common:dashboard.noFavorites");

          return (
            <AppCard
              key={areaId}
              icon={item.icon}
              title={t(`areas:${item.id}.title`)}
              description={description}
              isActive={favoriteTipsList.length > 0}
              onPress={() =>
                router.push({
                  pathname: "/(goal)/[areaId]",
                  params: { areaId },
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
    color: Colors.dark.accentStrong,
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
    textShadowColor: Colors.dark.accentStrong,
    textShadowRadius: 6,
  },
  title: {
    fontSize: 20,
    color: Colors.dark.accentStrong,
    fontWeight: "bold",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 18,
    color: Colors.dark.accentStrong,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textTransform: "uppercase",
  },
});
