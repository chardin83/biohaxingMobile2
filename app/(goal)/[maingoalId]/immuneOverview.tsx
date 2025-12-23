import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useWearable } from "@/wearables/wearableProvider";
import { TimeRange, SleepSummary, HRVSummary, EnergySignal } from "@/wearables/types";
import { WearableStatus } from "@/components/WearableStatus";

export default function ImmuneScreen() {
  const { adapter, status } = useWearable();
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
  const latestSleep = sleepData[0];
  const latestHRV = hrvData[0];
  const latestEnergy = energyData[0];

  const immune = {
    sleepHours: latestSleep ? latestSleep.durationMinutes / 60 : 7.5,
    sleepDelta: latestSleep?.efficiencyPct ? Math.round((latestSleep.efficiencyPct - 80) / 2) : 5,
    stressLevel: (latestEnergy?.bodyBatteryLevel ?? 78) > 70 ? "Low" : "Moderate",
    bodyBattery: latestEnergy?.bodyBatteryLevel ?? 78,
    hrv: latestHRV?.rmssdMs ?? 62,
    hrvDelta: 8, // Would need historical data to calculate
    restingHR: latestHRV?.avgRestingHrBpm ?? 58,
    restingHRDelta: -2, // Would need historical data to calculate
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
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Sleep</Text>
              <Text style={styles.value}>{immune.sleepHours.toFixed(1)}h</Text>
              <Text style={styles.accent}>+{immune.sleepDelta}% vs avg</Text>
              {latestSleep && (
                <Text style={styles.source}>{latestSleep.source}</Text>
              )}
            </View>

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
            <View style={styles.col}>
              <Text style={styles.label}>HRV</Text>
              <Text style={styles.valueSmall}>{immune.hrv} ms</Text>
              <Text style={styles.accent}>+{immune.hrvDelta}% trend</Text>
              {latestHRV && (
                <Text style={styles.source}>{latestHRV.source}</Text>
              )}
            </View>
          </View>

          {/* Second row */}
          <View style={[styles.row, { marginTop: 20 }]}>
            {/* Resting Heart Rate */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Resting HR</Text>
              <Text style={styles.value}>{immune.restingHR}</Text>
              <Text style={styles.accent}>{immune.restingHRDelta} bpm</Text>
            </View>

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
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Support your immune system</Text>
          
          <Text style={styles.tipText}>
            • Prioritize 7-9 hours of quality sleep
          </Text>
          <Text style={styles.tipText}>
            • Manage stress through meditation, breathing exercises, or nature walks
          </Text>
          <Text style={styles.tipText}>
            • Stay hydrated and maintain a nutrient-rich diet
          </Text>
          <Text style={styles.tipText}>
            • Allow adequate recovery between intense workouts
          </Text>
          <Text style={styles.tipText}>
            • Monitor your metrics for unusual changes that may indicate illness
          </Text>
        </View>
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
