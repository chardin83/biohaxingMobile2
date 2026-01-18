import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Smart from "@/assets/images/level1_small.png";
import { Colors } from "@/constants/Colors";
import { useStorage } from "../context/StorageContext";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AppCard from "@/components/ui/AppCard";
import ProgressBarWithLabel from "@/components/ui/ProgressbarWithLabel";
import { levels } from "@/constants/XP";
import { tips } from "@/locales/tips";
import { areas } from "@/locales/areas";
import { VerdictValue, POSITIVE_VERDICTS } from "@/types/verdict";

export default function BiohackerDashboard() {
  const { t } = useTranslation(["common", "areas", "levels"]);
  const { myGoals, myXP, myLevel, viewedTips, plans } = useStorage();
  const router = useRouter();

  const nextLevel = levels.find((l) => l.level === myLevel + 1);
  const xpMax =
    nextLevel?.requiredXP ??
    levels.find((l) => l.level === myLevel)?.requiredXP ??
    0;
  const progressText = `${myXP} / ${xpMax} XP`;
  const levelTitle = levels.find((o) => o.level === myLevel)?.titleKey;

  const positiveVerdictsSet = React.useMemo(
    () => new Set(POSITIVE_VERDICTS),
    []
  );

  // Hitta favorit-markerade tips för ett specifikt område
  const getFavoriteTipsForArea = (areaId: string) => {
    return viewedTips
      ?.filter(
        (tip) =>
          tip.mainGoalId === areaId &&
          tip.verdict &&
          positiveVerdictsSet.has(tip.verdict as VerdictValue)
      )
      .map(tip => {
        const tipDetails = tips.find(t => t.id === tip.tipId);
        return tipDetails ? t(`tips:${tipDetails.title}`) : null;
      })
      .filter(Boolean) || [];
  };

  return (
    <LinearGradient
      colors={Colors.dark.gradients.sunrise.colors as any}
      locations={Colors.dark.gradients.sunrise.locations as any}
      start={Colors.dark.gradients.sunrise.start}
      end={Colors.dark.gradients.sunrise.end}
      style={styles.gradient}
    >
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

            // Calculate total XP for this area from viewedTips
            const areaXP = viewedTips
              ?.filter((tip) => tip.mainGoalId === areaId)
              .reduce((sum, tip) => sum + (tip.xpEarned || 0), 0) || 0;


            // Visa bock om man har något tip i arean i sin AKTIVA plan
            const hasAnyTipInArea = [
              ...plans.training,
              ...plans.nutrition,
            ].some((entry) => entry.mainGoalId === areaId);

            return (
              <AppCard
                key={areaId}
                icon={item.icon}
                title={t(`areas:${item.id}.title`)}
                description={description}
                isActive={hasAnyTipInArea}
                xp={areaXP}
                onPress={() =>
                  router.push({
                    pathname: "/(goal)/[areaId]",
                    params: { areaId },
                  })
                }
              />
            );
          })}

        <View style={styles.editLinkRow}>
          <TouchableOpacity onPress={() => router.push("/(manage)/areas")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.editButtonText}>{t("common:dashboard.editAreas")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    backgroundColor: "transparent",
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
  editLinkRow: {
    width: "100%",
    alignItems: "flex-end",
    paddingRight: 20,
    marginTop: 12,
    marginBottom: 24,
  },
  editButtonText: {
    color: Colors.dark.accentStrong,
    fontSize: 14,
    fontWeight: "600",
  },
});
