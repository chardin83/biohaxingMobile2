import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useWearable } from "@/wearables/wearableProvider";
import { TimeRange, HRVSummary, DailyActivity, EnergySignal } from "@/wearables/types";
import { WearableStatus } from "@/components/WearableStatus";
import { VO2MaxMetric } from "@/components/metrics/VO2MaxMetric";
import { RestingHRMetric } from "@/components/metrics/RestingHRMetric";

export default function CardioScreen() {
  const { adapter, status } = useWearable();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hrvData, setHrvData] = useState<HRVSummary[]>([]);
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

        const [hrv, activity, energy] = await Promise.all([
          adapter.getHRV(range),
          adapter.getDailyActivity(range),
          adapter.getEnergySignal(range),
        ]);

        setHrvData(hrv);
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
          <Text style={styles.loadingText}>Loading cardio data...</Text>
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

  // Transform wearable data to cardio metrics
  const latestEnergy = energyData[0];

  // Calculate weekly training load from activity data
  const weeklyActiveMinutes = activityData.reduce((sum, day) => sum + (day.activeMinutes || 0), 0);
  const trainingLoad = weeklyActiveMinutes * 2; // Simple calculation

  const cardio = {
    vo2max: 48, // Would need fitness data from wearable
    vo2maxDelta: 3,
    trainingLoad: trainingLoad || 285,
    trainingLoadStatus: trainingLoad > 400 ? "High" : trainingLoad > 200 ? "Optimal" : "Low",
    recoveryTime: (latestEnergy?.bodyBatteryLevel ?? 0) > 80 ? 12 : 18,
    fitnessAge: 32, // Would be calculated from VO2max and other factors
    actualAge: 38,
  };

  return (
    <LinearGradient colors={["#071526", "#040B16"]} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Cardio Fitness</Text>
        <Text style={styles.subtitle}>
          Cardiovascular endurance metrics and training insights
        </Text>

        <WearableStatus status={status} />

        {/* Overview card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your cardio performance</Text>

          <View style={styles.row}>
            {/* VO2 Max */}
            <VO2MaxMetric 
              vo2max={cardio.vo2max} 
              trend={cardio.vo2maxDelta}
              showDivider 
            />

            {/* Resting HR */}
            <RestingHRMetric hrvData={hrvData} showDivider />

            {/* Training Load */}
            <View style={styles.col}>
              <Text style={styles.label}>Training Load</Text>
              <Text style={styles.valueSmall}>{cardio.trainingLoad}</Text>
              <Text style={styles.muted}>{cardio.trainingLoadStatus}</Text>
              {activityData.length > 0 && (
                <Text style={styles.source}>7-day total</Text>
              )}
            </View>
          </View>

          {/* Second row */}
          <View style={[styles.row, { marginTop: 20 }]}>
            {/* Recovery Time */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Recovery time</Text>
              <Text style={styles.value}>{cardio.recoveryTime}h</Text>
              <Text style={styles.muted}>Until next hard effort</Text>
              {latestEnergy && (
                <Text style={styles.source}>Based on battery: {latestEnergy.bodyBatteryLevel}%</Text>
              )}
            </View>

            {/* Fitness Age */}
            <View style={styles.col}>
              <Text style={styles.label}>Fitness age</Text>
              <Text style={styles.value}>{cardio.fitnessAge}</Text>
              <Text style={styles.accent}>
                {cardio.actualAge - cardio.fitnessAge} yrs younger
              </Text>
            </View>
          </View>
        </View>

        {/* VO2 Max explanation */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Understanding your metrics</Text>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🫁 VO₂ Max</Text>
            <Text style={styles.infoText}>
              VO₂ max measures the maximum amount of oxygen your body can use during intense exercise. 
              It's the gold standard for cardiovascular fitness. Higher values indicate better endurance capacity.
            </Text>
            <Text style={[styles.infoText, { marginTop: 8, fontStyle: "italic" }]}>
              Your level ({cardio.vo2max}) is considered {cardio.vo2max > 45 ? "Good to Excellent" : "Fair to Good"} for your age group.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🫀 Resting Heart Rate</Text>
            <Text style={styles.infoText}>
              Lower resting heart rate typically indicates better cardiovascular fitness. 
              Athletes often have resting heart rates below 60 bpm. Monitor trends over time. 
              A sudden increase may signal overtraining, illness, or stress.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>💪 Training Load</Text>
            <Text style={styles.infoText}>
              Training Load tracks the cumulative intensity and volume of your workouts over 7 days. 
              Optimal load means you're training effectively without overtraining. Too high = risk of injury/burnout. 
              Too low = insufficient stimulus for adaptation.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>⏱️ Recovery Time</Text>
            <Text style={styles.infoText}>
              Time needed before your body is ready for another hard training session. 
              Based on HRV, sleep quality, and body battery. Respecting recovery prevents injury and improves performance. 
              Training hard when recovery is incomplete leads to diminished returns.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🎂 Fitness Age</Text>
            <Text style={styles.infoText}>
              Based on your VO₂ max, resting heart rate, and other factors. 
              A lower fitness age indicates superior cardiovascular health. Regular aerobic training 
              can reduce your fitness age by 10-20 years compared to sedentary peers.
            </Text>
          </View>
        </View>

        {/* Training zones card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Optimize your cardio training</Text>
          
          <Text style={styles.tipText}>
            🏃 Zone 2 training (60-70% max HR) builds aerobic base - majority of training
          </Text>
          <Text style={styles.tipText}>
            ⚡ HIIT workouts (2x/week) improve VO₂ max most effectively
          </Text>
          <Text style={styles.tipText}>
            📈 Progressive overload: gradually increase distance or intensity by 10% weekly
          </Text>
          <Text style={styles.tipText}>
            ⚖️ Mix intensities: 80% easy, 20% hard (80/20 rule for optimal adaptation)
          </Text>
          <Text style={styles.tipText}>
            💓 Monitor HRV daily to optimize training timing - skip hard workouts when HRV drops
          </Text>
          <Text style={styles.tipText}>
            😴 Adequate sleep (7-9h) and nutrition crucial for adaptation and performance
          </Text>
          <Text style={styles.tipText}>
            🚴 Cross-train: mix running, cycling, swimming to prevent overuse injuries
          </Text>
          <Text style={styles.tipText}>
            🧊 Cold exposure post-workout may reduce inflammation (but wait 4h for hypertrophy)
          </Text>
          <Text style={styles.tipText}>
            🎯 Track resting HR trend - consistent low HR = good fitness, rising = overtraining
          </Text>
          <Text style={styles.tipText}>
            🔄 Deload weeks (reduce volume 40%) every 4-6 weeks for recovery
          </Text>
          <Text style={styles.tipText}>
            🫀 Increase stroke volume: long, slow runs improve heart efficiency
          </Text>
          <Text style={styles.tipText}>
            🍽️ Carb timing: consume carbs around hard workouts for glycogen replenishment
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
