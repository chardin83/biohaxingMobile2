import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useStorage } from "@/app/context/StorageContext";
import { tips } from "@/locales/tips";
import { Colors } from "@/constants/Colors";
import TipCard from "./TipCard";

interface TipsListProps {
  areaId: string;
  title: string;
}

export default function TipsList({ areaId, title }: <readonly>TipsListProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { viewedTips } = useStorage();
  const [showAllTips, setShowAllTips] = React.useState(false);

  const tipsRaw = tips.filter(tip => tip.goals.some(goal => goal.id === areaId));

  const positiveVerdicts = ["interested", "startNow", "wantMore", "alreadyWorks"] as const;
  const negativeVerdicts = ["notInterested", "noResearch", "testedFailed"] as const;

  // Sortera tips: positiva → neutrala → negativa
  const sortedTips = React.useMemo(() => {
    return [...tipsRaw].sort((a, b) => {
      const aViewed = viewedTips?.find(
        (v) => v.mainGoalId === areaId && v.tipId === a.id
      );
      const bViewed = viewedTips?.find(
        (v) => v.mainGoalId === areaId && v.tipId === b.id
      );

      const aVerdict = aViewed?.verdict;
      const bVerdict = bViewed?.verdict;

      const aScore = aVerdict
        ? positiveVerdicts.includes(aVerdict as any)
          ? 2
          : negativeVerdicts.includes(aVerdict as any)
            ? 0
            : 1
        : 1;
      const bScore = bVerdict
        ? positiveVerdicts.includes(bVerdict as any)
          ? 2
          : negativeVerdicts.includes(bVerdict as any)
            ? 0
            : 1
        : 1;

      return bScore - aScore;
    });
  }, [tipsRaw, viewedTips, areaId]);

  // Filtrera tips: dölj "not interested"-liknande om inte "show all"
  const visibleTips = React.useMemo(() => {
    if (showAllTips) {
      return sortedTips;
    }
    return sortedTips.filter((tip) => {
      const viewedTip = viewedTips?.find(
        (v) => v.mainGoalId === areaId && v.tipId === tip.id
      );
      return viewedTip?.verdict ? !negativeVerdicts.includes(viewedTip.verdict as any) : true;
    });
  }, [sortedTips, showAllTips, viewedTips, areaId]);

  const hiddenTipsCount = sortedTips.length - visibleTips.length;

  const getTipProgress = (tipId: string) => {
    const viewedTip = viewedTips?.find(
      v =>
        v.mainGoalId === areaId &&
        v.tipId === tipId
    );

    if (!viewedTip) {
      return { xp: 0, progress: 0, askedQuestions: 0, verdict: undefined };
    }

    const maxQuestions = 3;
    const progress = Math.min(
      viewedTip.askedQuestions.length / maxQuestions,
      1
    );

    return {
      xp: viewedTip.xpEarned,
      progress,
      askedQuestions: viewedTip.askedQuestions.length,
      verdict: viewedTip.verdict,
    };
  };

  const handleTipPress = (tipIndex: number) => {
    const tip = sortedTips[tipIndex];

    if (tip) {
      router.push({
          pathname: `/(goal)/${areaId}/details` as any,
        params: {
          tipId: tip.id,
        },
      });
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t(title)}</Text>

      {visibleTips.map((tip, index) => {
        const tipProgress = getTipProgress(tip.id);

        return (
          <TipCard
            key={tip.id}
            tip={tip}
            tipProgress={tipProgress}
            onPress={() => handleTipPress(index)}
          />
        );
      })}

      {hiddenTipsCount > 0 && (
        <Pressable
          style={styles.showAllButton}
          onPress={() => setShowAllTips(!showAllTips)}
        >
          <Text style={styles.showAllText}>
            {showAllTips
              ? t("common:tips.hideNotInterested", "Hide not interested")
              : t("common:tips.showAll", { defaultValue: "Show all ({{count}} hidden)", count: hiddenTipsCount })}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.accentVeryWeak,
    marginTop: 16,
  },
  cardTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 14,
  },
  showAllButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.dark.textWeak,
  },
  showAllText: {
    color: Colors.dark.accentDefault,
    fontSize: 14,
    fontWeight: "600",
  },
});
