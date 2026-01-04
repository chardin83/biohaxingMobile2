import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useWearable } from "@/wearables/wearableProvider";
import { TimeRange, SleepSummary, DailyActivity, EnergySignal } from "@/wearables/types";
import { WearableStatus } from "@/components/WearableStatus";
import TipsList from "@/components/ui/TipsList";

export default function DigestiveScreen({ mainGoalId }: { mainGoalId: string }) {
  const { adapter, status } = useWearable();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sleepData, setSleepData] = useState<SleepSummary[]>([]);
  const [activityData, setActivityData] = useState<DailyActivity[]>([]);
  const [energyData, setEnergyData] = useState<EnergySignal[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const range: TimeRange = {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        };

        const [sleep, activity, energy] = await Promise.all([
          adapter.getSleep(range),
          adapter.getDailyActivity(range),
          adapter.getEnergySignal(range),
        ]);

        setSleepData(sleep);
        setActivityData(activity);
        setEnergyData(energy);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [adapter]);

  if (loading) {
    return (
      <LinearGradient colors={["#071526", "#040B16"]} style={styles.bg}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="rgba(120,255,220,0.95)" />
          <Text style={styles.loadingText}>Loading digestive data...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#071526", "#040B16"]} style={styles.bg}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </LinearGradient>
    );
  }

  // Transform wearable data to digestive metrics
  const latestSleep = sleepData[0];
  const latestActivity = activityData[0];
  const latestEnergy = energyData[0];

   const getSleepQuality = (): string => {
    if (!latestSleep || latestSleep.efficiencyPct === undefined) {
      return "Good";
    }
    return latestSleep.efficiencyPct > 80 ? "Good" : "Fair";
  };

  const digestive = {
    stressLevel: (latestEnergy?.bodyBatteryLevel ?? 82) > 70 ? "Low" : "Moderate",
    bodyBattery: latestEnergy?.bodyBatteryLevel ?? 82,
    sleepHours: latestSleep ? latestSleep.durationMinutes / 60 : 7.8,
    sleepQuality: getSleepQuality(),
    activityMinutes: latestActivity?.activeMinutes ?? 145,
    stepCount: latestActivity?.steps ?? 9500,
    hydration: 2.1, // Would need manual logging
    lastMealLogged: "3h ago", // Would need manual logging
    symptomsToday: 0, // Would need manual logging
  };

  return (
    <LinearGradient colors={["#071526", "#040B16"]} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Digestion</Text>
        <Text style={styles.subtitle}>
          Factors influencing digestive health and gut function
        </Text>

        <WearableStatus status={status} />

        {/* Overview card - Indirect metrics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gut health influencers</Text>

          <View style={styles.row}>
            {/* Stress */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Stress level</Text>
              <Text style={styles.valueSmall}>{digestive.stressLevel}</Text>
              <Text style={styles.muted}>Battery: {digestive.bodyBattery}%</Text>
              {latestEnergy && (
                <Text style={styles.source}>{latestEnergy.source}</Text>
              )}
            </View>

            {/* Sleep */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Sleep</Text>
              <Text style={styles.value}>{digestive.sleepHours.toFixed(1)}h</Text>
              <Text style={styles.accent}>{digestive.sleepQuality}</Text>
              {latestSleep && (
                <Text style={styles.source}>{latestSleep.source}</Text>
              )}
            </View>

            {/* Activity */}
            <View style={styles.col}>
              <Text style={styles.label}>Activity</Text>
              <Text style={styles.valueSmall}>{digestive.activityMinutes}m</Text>
              <Text style={styles.muted}>{digestive.stepCount.toLocaleString()} steps</Text>
              {latestActivity && (
                <Text style={styles.source}>{latestActivity.source}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Manual tracking card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Your tracking</Text>

          <View style={styles.row}>
            {/* Hydration */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Hydration today</Text>
              <Text style={styles.value}>{digestive.hydration}L</Text>
              <Text style={styles.muted}>Target: 2.5L</Text>
            </View>

            {/* Last meal */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Last meal</Text>
              <Text style={styles.valueSmall}>{digestive.lastMealLogged}</Text>
              <Text style={styles.muted}>Log your meals</Text>
            </View>

            {/* Symptoms */}
            <View style={styles.col}>
              <Text style={styles.label}>Symptoms today</Text>
              <Text style={styles.value}>{digestive.symptomsToday}</Text>
              <Text style={styles.accent}>Feeling good!</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <Text style={styles.actionButton}>+ Log meal</Text>
            <Text style={styles.actionButton}>+ Log symptom</Text>
            <Text style={styles.actionButton}>+ Log water</Text>
          </View>
        </View>

        {/* Information card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>The gut-health connection</Text>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>😌 Stress & Gut-Brain Axis</Text>
            <Text style={styles.infoText}>
              The gut and brain communicate constantly through the vagus nerve. 
              Chronic stress can disrupt gut motility, alter microbiome composition, and increase inflammation.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>💤 Sleep Quality</Text>
            <Text style={styles.infoText}>
              Poor sleep affects gut bacteria diversity and can lead to digestive issues. 
              The gut microbiome follows circadian rhythms and needs consistent sleep patterns.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🚶 Physical Activity</Text>
            <Text style={styles.infoText}>
              Regular movement stimulates intestinal contractions and promotes healthy gut motility. 
              Exercise also increases beneficial gut bacteria diversity.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>💧 Hydration</Text>
            <Text style={styles.infoText}>
              Adequate water intake is crucial for digestive function, nutrient absorption, 
              and preventing constipation. Aim for 2-3 liters daily.
            </Text>
          </View>
        </View>

        {/* Tips card */}
        <TipsList
          mainGoalId={mainGoalId}
          categoryId="digestiveHealth_optimization"
          title="tips:digestive.levels.optimization.title"
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    paddingTop: 80,
    paddingHorizontal: 18,
    paddingBottom: 32,
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
  source: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },
  actionButton: {
    color: "rgba(120,255,220,0.95)",
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(120,255,220,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(120,255,220,0.25)",
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
  tipText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "rgba(255,100,100,0.9)",
    fontSize: 16,
  },
});
