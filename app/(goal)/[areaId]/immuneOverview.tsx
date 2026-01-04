import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useWearable } from "@/wearables/wearableProvider";
import { TimeRange, SleepSummary, HRVSummary, EnergySignal } from "@/wearables/types";
import { WearableStatus } from "@/components/WearableStatus";
import { HRVMetric } from "@/components/metrics/HRVMetric";
import { RestingHRMetric } from "@/components/metrics/RestingHRMetric";
import { SleepMetric } from "@/components/metrics/SleepMetric";
import { useTranslation } from "react-i18next";
import { Colors } from "@/constants/Colors";
import TipsList from "@/components/ui/TipsList";

export default function ImmuneScreen({ mainGoalId }: { mainGoalId: string }) {
  const { adapter, status } = useWearable();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sleepData, setSleepData] = useState<SleepSummary[]>([]);
  const [hrvData, setHrvData] = useState<HRVSummary[]>([]);
  const [energyData, setEnergyData] = useState<EnergySignal[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const range: TimeRange = {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        };

        const [sleep, hrv, energy] = await Promise.all([
          adapter.getSleep(range),
          adapter.getHRV(range),
          adapter.getEnergySignal(range),
        ]);

        setSleepData(sleep);
        setHrvData(hrv);
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
          <Text style={styles.loadingText}>Loading immune data...</Text>
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

  // Transform wearable data to immune metrics
  const latestEnergy = energyData[0];

  const immune = {
    stressLevel: (latestEnergy?.bodyBatteryLevel ?? 78) > 70 ? "Low" : "Moderate",
    bodyBattery: latestEnergy?.bodyBatteryLevel ?? 78,
  };

  return (
    <LinearGradient colors={["#071526", "#040B16"]} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Immune Support</Text>
        <Text style={styles.subtitle}>
          Key metrics that influence immune system function and resilience
        </Text>

        <WearableStatus status={status} />

        {/* Overview card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your immune health indicators</Text>

          <View style={styles.row}>
            {/* Sleep */}
            <SleepMetric sleepData={sleepData} showDivider />

            {/* Stress/Body Battery */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Stress level</Text>
              <Text style={styles.valueSmall}>{immune.stressLevel}</Text>
              <Text style={styles.muted}>Battery: {immune.bodyBattery}%</Text>
              {latestEnergy && (
                <Text style={styles.source}>{latestEnergy.source}</Text>
              )}
            </View>

            {/* HRV */}
            <HRVMetric hrvData={hrvData} />
          </View>

          {/* Second row */}
          <View style={[styles.row, { marginTop: 20 }]}>
            {/* Resting Heart Rate */}
            <RestingHRMetric hrvData={hrvData} showDivider />

            {/* Recovery Status */}
            <View style={styles.col}>
              <Text style={styles.label}>Recovery status</Text>
              <Text style={styles.valueSmall}>
                {immune.bodyBattery > 70 ? "Good" : "Moderate"}
              </Text>
              <Text style={styles.muted}>
                {immune.bodyBattery > 70 ? "Ready for activity" : "Need recovery"}
              </Text>
            </View>
          </View>
        </View>

        {/* Information card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Why these metrics matter</Text>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>💤 Sleep</Text>
            <Text style={styles.infoText}>
              Adequate sleep is crucial for immune function. During sleep, the body produces cytokines that help fight infection and inflammation.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>😌 Stress & Body Battery</Text>
            <Text style={styles.infoText}>
              Chronic stress suppresses immune function. Body Battery reflects your energy reserves and recovery status.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>❤️ HRV (Heart Rate Variability)</Text>
            <Text style={styles.infoText}>
              Higher HRV indicates better recovery and resilience. Low HRV may signal stress, fatigue, or illness.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🫀 Resting Heart Rate</Text>
            <Text style={styles.infoText}>
              An elevated resting heart rate can be an early sign of illness, inflammation, or inadequate recovery.
            </Text>
          </View>
        </View>

        {/* Tips card */}
        <TipsList
          areaId={mainGoalId}
          title="tips:immune.levels.optimization.title"
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
    color: Colors.dark.accentStrong,
  },
  subtitle: {
    color: Colors.dark.textTertiary,
    fontSize: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.accentWeak,
  },
  cardTitle: {
    color: Colors.dark.textSecondary,
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
    color: Colors.dark.textTertiary,
    fontSize: 13,
  },
  valueSmall: {
    color: Colors.dark.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  muted: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  source: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  infoText: {
    color: Colors.dark.textTertiary,
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.dark.textTertiary,
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: Colors.dark.warmDefault,
    fontSize: 16,
  },
});
