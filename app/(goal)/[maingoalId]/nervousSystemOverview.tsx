import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useWearable } from "@/wearables/wearableProvider";
import { WearableStatus } from "@/components/WearableStatus";
import { HRVMetric } from "@/components/metrics/HRVMetric";
import { RestingHRMetric } from "@/components/metrics/RestingHRMetric";
import { calculateHRVMetrics } from "@/utils/hrvCalculations";
import { HRVSummary } from "@/wearables/types";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { tipCategories } from "@/locales/tips";
import { useStorage } from "@/app/context/StorageContext";


function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function getBalanceMessage(stressScore: number): string {
  if (stressScore < 40) {
    return "Your nervous system is currently in a parasympathetic-dominant state, indicating good recovery and relaxation.";
  } else if (stressScore < 70) {
    return "Your nervous system shows balanced activity between sympathetic and parasympathetic states.";
  } else {
    return "Your nervous system shows elevated sympathetic activity. Consider rest and recovery practices.";
  }
}

function getStressLevel(stressScore: number): string {
  if (stressScore < 30) {
    return "Low";
  } else if (stressScore < 60) {
    return "Moderate";
  } else {
    return "High";
  }
}

function getRecoveryStatus(hrv: number | null, sleepHours: number | null): string {
  if (hrv && hrv >= 65 && sleepHours && sleepHours >= 7.5) {
    return "Fully Recovered";
  } else if (hrv && hrv >= 50 && sleepHours && sleepHours >= 6.5) {
    return "Good Recovery";
  } else {
    return "Needs Recovery";
  }
}

export default function NervousSystemScreen({ mainGoalId }: { mainGoalId: string }) {
  const { adapter, status } = useWearable();
  const { t } = useTranslation();
  const router = useRouter();
  const { viewedTips } = useStorage();

  console.log("=== NERVOUS SYSTEM MOUNTED ===");
  console.log("mainGoalId from props:", mainGoalId);

  const [loading, setLoading] = React.useState(true);
  const [hrvData, setHrvData] = React.useState<HRVSummary[]>([]);
  const [hrv, setHrv] = React.useState<number | null>(null);
  const [bodyBattery, setBodyBattery] = React.useState<number | null>(null);
  const [sleepHours, setSleepHours] = React.useState<number | null>(null);
  const [showAllTips, setShowAllTips] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const range = { start: daysAgo(7), end: new Date().toISOString() };

      // Hämta HRV data
      const data = await adapter.getHRV(range);
      setHrvData(data);
      
      const hrvMetrics = calculateHRVMetrics(data);
      setHrv(hrvMetrics.hrv);

      // Hämta Body Battery
      const energyData = await adapter.getEnergySignal(range);
      if (energyData.length > 0) {
        const latest = energyData[energyData.length - 1];
        setBodyBattery(latest.bodyBatteryLevel ?? null);
      }

      // Hämta sleep
      const sleepData = await adapter.getSleep(range);
      if (sleepData.length > 0) {
        const latest = sleepData[sleepData.length - 1];
        setSleepHours(latest.durationMinutes ? latest.durationMinutes / 60 : null);
      }

      setLoading(false);
    })().catch(() => setLoading(false));
  }, [adapter]);

  // Beräkna status baserat på HRV
  const stressScore = hrv ? Math.max(0, Math.min(100, 100 - hrv)) : 50;
  const stressLevel = getStressLevel(stressScore);
  const recoveryStatus = getRecoveryStatus(hrv, sleepHours);

  // Hämta optimization tips från tips.json
  const optimizationCategory = tipCategories.find(
    cat => cat.id === "level_nervousSystem_optimization"
  );
  const optimizationTipsRaw = optimizationCategory?.tips || [];

  // Sortera tips så att "relevant" visas först, sedan "interesting"
  const optimizationTips = React.useMemo(() => {
    return [...optimizationTipsRaw].sort((a, b) => {
      const aViewed = viewedTips?.find(
        v => v.mainGoalId === mainGoalId && 
             v.goalId === "level_nervousSystem_optimization" && 
             v.tipId === a.id
      );
      const bViewed = viewedTips?.find(
        v => v.mainGoalId === mainGoalId && 
             v.goalId === "level_nervousSystem_optimization" && 
             v.tipId === b.id
      );

      const aIsRelevant = aViewed?.verdict === "relevant";
      const bIsRelevant = bViewed?.verdict === "relevant";
      const aIsInteresting = aViewed?.verdict === "interesting";
      const bIsInteresting = bViewed?.verdict === "interesting";

      // Relevant först
      if (aIsRelevant && !bIsRelevant) return -1;
      if (!aIsRelevant && bIsRelevant) return 1;
      
      // Interesting efter relevant
      if (aIsInteresting && !bIsInteresting && !bIsRelevant) return -1;
      if (!aIsInteresting && bIsInteresting && !aIsRelevant) return 1;
      
      return 0;
    });
  }, [optimizationTipsRaw, viewedTips, mainGoalId]);

  // Filtrera tips baserat på verdict och showAllTips
  const visibleTips = React.useMemo(() => {
    if (showAllTips) {
      return optimizationTips;
    }
    // Dölj skeptiska tips om inte "show all" är aktiverat
    return optimizationTips.filter(tip => {
      const viewedTip = viewedTips?.find(
        v => v.mainGoalId === mainGoalId && 
             v.goalId === "level_nervousSystem_optimization" && 
             v.tipId === tip.id
      );
      return viewedTip?.verdict !== "skeptical";
    });
  }, [optimizationTips, showAllTips, viewedTips, mainGoalId]);

  const hiddenTipsCount = optimizationTips.length - visibleTips.length;

  const getTipProgress = (tipId: string) => {
    const viewedTip = viewedTips?.find(
      v => v.mainGoalId === mainGoalId && 
           v.goalId === "level_nervousSystem_optimization" && 
           v.tipId === tipId
    );
    
    if (!viewedTip) {
      return { xp: 0, progress: 0, askedQuestions: 0, verdict: undefined };
    }

    const maxQuestions = 3;
    const progress = Math.min(viewedTip.askedQuestions.length / maxQuestions, 1);
    
    return {
      xp: viewedTip.xpEarned,
      progress,
      askedQuestions: viewedTip.askedQuestions.length,
      verdict: viewedTip.verdict,
    };
  };

  const handleTipPress = (tipIndex: number) => {
    const tip = optimizationTips[tipIndex];
    
    if (tip) {
      console.log("=== NAVIGATION DEBUG ===");
      console.log("mainGoalId:", mainGoalId);
      console.log("Navigating to details with tipId:", tip.id);
      
      router.push({
        pathname: `/(goal)/${mainGoalId}/details` as any,
        params: {
          goalId: "level_nervousSystem_optimization",
          tipId: tip.id,
        }
      });
    }
  };

  return (
    <LinearGradient colors={["#071526", "#040B16"]} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nervous System</Text>
        <Text style={styles.subtitle}>
          Autonomic nervous system balance and recovery metrics
        </Text>

        <WearableStatus status={status} />

        {/* Overview card - Main ANS metrics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Autonomic nervous system</Text>

          {loading ? (
            <Text style={styles.muted}>Loading…</Text>
          ) : (
            <>
              <View style={styles.row}>
                <HRVMetric hrvData={hrvData} showDivider />

                {/* Stress Score */}
                <View style={[styles.col, styles.colWithDivider]}>
                  <Text style={styles.label}>Stress score</Text>
                  <Text style={styles.value}>{Math.round(stressScore)}</Text>
                  <Text style={styles.accent}>{stressLevel}</Text>
                </View>

                {/* Body Battery */}
                <View style={styles.col}>
                  <Text style={styles.label}>Body Battery</Text>
                  <Text style={styles.valueSmall}>{bodyBattery ?? "—"}%</Text>
                </View>
              </View>

              {/* Second row */}
              <View style={[styles.row, { marginTop: 20 }]}>
                <RestingHRMetric hrvData={hrvData} showDivider />

                {/* Recovery Status */}
                <View style={styles.col}>
                  <Text style={styles.label}>Recovery status</Text>
                  <Text style={styles.valueSmall}>{recoveryStatus}</Text>
                  <Text style={styles.muted}>
                    {sleepHours ? `${sleepHours.toFixed(1)}h sleep` : "No sleep data"}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ANS Balance visualization */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Sympathetic vs Parasympathetic</Text>
          
          {loading ? (
            <Text style={styles.muted}>Loading…</Text>
          ) : (
            <>
              <View style={styles.balanceContainer}>
                <View style={styles.balanceBar}>
                  <View style={[styles.sympatheticBar, { flex: stressScore }]} />
                  <View style={[styles.parasympatheticBar, { flex: 100 - stressScore }]} />
                </View>
                
                <View style={styles.balanceLabels}>
                  <Text style={styles.balanceLabel}>⚡ Fight/Flight</Text>
                  <Text style={styles.balanceLabel}>😌 Rest/Digest</Text>
                </View>
              </View>

              <Text style={styles.balanceText}>
                {getBalanceMessage(stressScore)}
              </Text>
            </>
          )}
        </View>

        {/* Information card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Understanding your nervous system</Text>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>❤️ HRV (Heart Rate Variability)</Text>
            <Text style={styles.infoText}>
              HRV measures the variation in time between heartbeats. Higher HRV indicates 
              better autonomic nervous system function, resilience, and recovery capacity. 
              It's influenced by stress, sleep, fitness, and overall health.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>😰 Stress Score</Text>
            <Text style={styles.infoText}>
              Based on HRV, activity, and sleep data. Lower scores (0-25) indicate low stress, 
              while higher scores (75-100) show significant sympathetic nervous system activation. 
              Chronic high stress can lead to burnout and health issues.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🔋 Body Battery</Text>
            <Text style={styles.infoText}>
              Tracks your body's energy reserves throughout the day. Charged during rest and sleep 
              (parasympathetic activity), depleted by stress and activity (sympathetic activity). 
              Optimize recharge by prioritizing sleep and recovery.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>⚖️ ANS Balance</Text>
            <Text style={styles.infoText}>
              The autonomic nervous system has two branches: sympathetic (fight/flight) and 
              parasympathetic (rest/digest). Optimal health requires good balance and the ability 
              to switch between states appropriately.
            </Text>
          </View>
        </View>

        {/* Tips card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>{t("tips:nervousSystem.levels.optimization.title")}</Text>
          
          {visibleTips.map((tip, index) => {
            const tipProgress = getTipProgress(tip.id);
            const isStarted = tipProgress.xp > 0;
            const isCompleted = tipProgress.progress >= 1;
            const isRelevant = tipProgress.verdict === "relevant";
            const isInteresting = tipProgress.verdict === "interesting";
            const isSkeptical = tipProgress.verdict === "skeptical";

            return (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.tipSection,
                  pressed && styles.tipPressed,
                  isCompleted && styles.tipCompleted,
                  isRelevant && styles.tipRelevant,
                  isInteresting && styles.tipInteresting,
                  isSkeptical && styles.tipSkeptical,
                ]}
                onPress={() => handleTipPress(index)}
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
                          { width: `${tipProgress.progress * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {tipProgress.askedQuestions}/3 {t("common:goalDetails.questionsExplored")}
                    </Text>
                  </View>
                )}

                <Text style={styles.tapHint}>
                  {isStarted ? t("common:goalDetails.continueExploring") : t("common:goalDetails.startExploring")}
                </Text>
              </Pressable>
            );
          })}

          {hiddenTipsCount > 0 && (
            <Pressable 
              style={styles.showAllButton}
              onPress={() => setShowAllTips(!showAllTips)}
            >
              <Text style={styles.showAllText}>
                {showAllTips 
                  ? "Hide skeptical tips" 
                  : `Show all (${hiddenTipsCount} hidden)`
                }
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    paddingTop: 20, // Tillbaka till normalt padding
  },
  title: {
    fontSize: 44,
    fontWeight: "700",
    color: "rgba(120,255,220,0.95)",
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(120,255,220,0.18)",
  },
  cardTitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  col: {
    flex: 1,
    paddingHorizontal: 8,
  },
  colWithDivider: {
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.10)",
  },
  label: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
  },
  value: {
    color: "white",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 4,
  },
  valueSmall: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  muted: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 6,
  },
  accent: {
    color: "rgba(120,255,220,0.85)",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
  balanceContainer: {
    marginVertical: 12,
  },
  balanceBar: {
    flexDirection: "row",
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  sympatheticBar: {
    backgroundColor: "rgba(255,100,100,0.5)",
  },
  parasympatheticBar: {
    backgroundColor: "rgba(120,255,220,0.5)",
  },
  balanceLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
  },
  balanceText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  infoText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    lineHeight: 20,
  },
  tipSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(120,255,220,0.1)",
  },
  tipPressed: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(120,255,220,0.3)",
  },
  tipCompleted: {
    borderColor: "rgba(120,255,220,0.4)",
    backgroundColor: "rgba(120,255,220,0.05)",
  },
  tipRelevant: {
    borderColor: "rgba(255,215,0,0.6)",
    backgroundColor: "rgba(255,215,0,0.08)",
    borderWidth: 2,
  },
  tipInteresting: {
    borderColor: "rgba(120,200,255,0.5)",
    backgroundColor: "rgba(120,200,255,0.06)",
    borderWidth: 2,
  },
  tipSkeptical: {
    borderColor: "rgba(255,100,100,0.4)",
    backgroundColor: "rgba(255,100,100,0.05)",
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
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  tipDescription: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    lineHeight: 20,
  },
  xpBadge: {
    backgroundColor: "rgba(120,255,220,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(120,255,220,0.4)",
  },
  xpText: {
    color: "rgba(120,255,220,0.95)",
    fontSize: 12,
    fontWeight: "700",
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "rgba(120,255,220,0.6)",
  },
  progressText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    marginTop: 4,
  },
  tapHint: {
    color: "rgba(120,255,220,0.6)",
    fontSize: 12,
    marginTop: 6,
    fontStyle: "italic",
  },
  showAllButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  showAllText: {
    color: "rgba(120,255,220,0.8)",
    fontSize: 14,
    fontWeight: "600",
  },
});
