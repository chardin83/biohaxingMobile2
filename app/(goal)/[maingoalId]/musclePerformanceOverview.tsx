import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function MusclePerformanceScreen() {
  const router = useRouter();

  // 🔹 Här hämtar du data från store / hook / context
  const performance = {
    trainingReadiness: 82,
    readinessStatus: "Optimal",
    recoveryTime: 12,
    trainingLoad: {
      current: 245,
      optimal: "220-280",
      status: "Balanced",
    },
    anaerobicLoad: 68,
    strengthSessions: 4,
    lastStrengthWorkout: "2h ago",
    sleepQuality: 88,
    sleepHours: 8.2,
    bodyBattery: 78,
    hrv: 68,
    restingHR: 52,
    proteinWindow: "Active (45min remaining)",
  };

  return (
    <LinearGradient colors={["#071526", "#040B16"]} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Muscle Performance</Text>
        <Text style={styles.subtitle}>
          Strength training readiness and recovery metrics
        </Text>

        {/* Training Readiness Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Training Readiness</Text>

          <View style={styles.centerMetric}>
            <Text style={styles.bigValue}>{performance.trainingReadiness}</Text>
            <Text style={styles.bigLabel}>Readiness Score</Text>
            <Text style={styles.statusGood}>{performance.readinessStatus}</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Recovery time</Text>
              <Text style={styles.value}>{performance.recoveryTime}h</Text>
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Last workout</Text>
              <Text style={styles.valueSmall}>{performance.lastStrengthWorkout}</Text>
            </View>
          </View>
        </View>

        {/* Training Load Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Training Load Management</Text>

          <View style={styles.row}>
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>7-day load</Text>
              <Text style={styles.value}>{performance.trainingLoad.current}</Text>
              <Text style={styles.accent}>{performance.trainingLoad.status}</Text>
            </View>

            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Optimal range</Text>
              <Text style={styles.valueSmall}>{performance.trainingLoad.optimal}</Text>
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Anaerobic load</Text>
              <Text style={styles.value}>{performance.anaerobicLoad}</Text>
              <Text style={styles.muted}>High intensity</Text>
            </View>
          </View>

          <View style={styles.loadBar}>
            <View style={[styles.loadFill, { width: `${(performance.trainingLoad.current / 350) * 100}%` }]} />
          </View>
          <Text style={styles.loadText}>
            Your training load is well-balanced. Continue with current intensity.
          </Text>
        </View>

        {/* Recovery Factors Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Recovery Factors</Text>

          <View style={styles.row}>
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Sleep quality</Text>
              <Text style={styles.value}>{performance.sleepQuality}%</Text>
              <Text style={styles.accent}>{performance.sleepHours}h</Text>
            </View>

            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Body Battery</Text>
              <Text style={styles.value}>{performance.bodyBattery}%</Text>
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>HRV</Text>
              <Text style={styles.value}>{performance.hrv}</Text>
              <Text style={styles.muted}>ms</Text>
            </View>
          </View>

          <Text style={styles.recoveryText}>
            🛌 Sleep and HRV are primary drivers of muscle recovery and protein synthesis. 
            Deep sleep stages trigger growth hormone release for muscle repair.
          </Text>
        </View>

        {/* Protein Timing Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Anabolic Window</Text>
          
          <View style={styles.proteinSection}>
            <Text style={styles.proteinStatus}>⏰ {performance.proteinWindow}</Text>
            <Text style={styles.proteinText}>
              Post-workout protein intake is most effective within 2-3 hours after training. 
              Muscle protein synthesis remains elevated for 24-48 hours after resistance training.
            </Text>
          </View>

          <View style={styles.proteinTips}>
            <Text style={styles.tipLabel}>Recommended:</Text>
            <Text style={styles.tipText}>• 20-40g protein within 2h post-workout</Text>
            <Text style={styles.tipText}>• 1.6-2.2g/kg body weight daily total</Text>
            <Text style={styles.tipText}>• Leucine-rich sources (whey, eggs, meat)</Text>
            <Text style={styles.tipText}>• Distribute protein across 3-5 meals</Text>
          </View>
        </View>

        {/* Information Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Understanding muscle performance</Text>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>💪 Training Readiness</Text>
            <Text style={styles.infoText}>
              Combines HRV, sleep quality, recovery time, and recent training load to predict 
              your body's preparedness for high-intensity strength training. Scores above 75 
              indicate optimal conditions for progressive overload.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>📊 Training Load</Text>
            <Text style={styles.infoText}>
              Quantifies training stress from the past 7 days. Anaerobic load specifically 
              measures high-intensity work (heavy lifting, HIIT). Maintaining load within 
              your optimal range prevents overtraining while ensuring progression.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>⏱️ Recovery Time</Text>
            <Text style={styles.infoText}>
              Estimated hours until full muscular and CNS recovery. Heavy compound lifts 
              (squats, deadlifts) require 48-72h for complete recovery. Training the same 
              muscle groups before recovery is complete impairs adaptation.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🛌 Sleep & Muscle Growth</Text>
            <Text style={styles.infoText}>
              80% of growth hormone is released during deep sleep. Sleep deprivation reduces 
              protein synthesis by ~20% and increases cortisol (catabolic). Aim for 7-9 hours 
              with sleep quality above 80% for optimal hypertrophy.
            </Text>
          </View>
        </View>

        {/* Optimization Tips Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Optimize strength gains</Text>
          
          <Text style={styles.tipText}>
            💪 Progressive overload: Increase weight by 2.5-5% when hitting rep targets
          </Text>
          <Text style={styles.tipText}>
            📈 Track volume: Monitor sets × reps × weight for each muscle group weekly
          </Text>
          <Text style={styles.tipText}>
            🔄 Deload weeks: Reduce volume by 40-50% every 4-6 weeks for supercompensation
          </Text>
          <Text style={styles.tipText}>
            🍖 Protein timing: Front-load protein in first meal (30-40g) to maximize MPS
          </Text>
          <Text style={styles.tipText}>
            💊 Creatine: 5g daily improves strength output by 5-15% (most researched supplement)
          </Text>
          <Text style={styles.tipText}>
            🧊 Post-workout cold therapy: Wait 4+ hours to not blunt hypertrophy response
          </Text>
          <Text style={styles.tipText}>
            😴 Prioritize deep sleep: Use sleep tracking to optimize recovery quality
          </Text>
          <Text style={styles.tipText}>
            📊 Listen to HRV: Skip heavy lifts when HRV is 20%+ below baseline
          </Text>
          <Text style={styles.tipText}>
            🎯 Mind-muscle connection: Slower eccentrics (3-4s) increase time under tension
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
    color: "rgba(255,120,100,0.95)",
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
    borderColor: "rgba(255,120,100,0.18)",
  },
  cardTitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 14,
  },
  centerMetric: {
    alignItems: "center",
    marginBottom: 20,
  },
  bigValue: {
    fontSize: 56,
    fontWeight: "800",
    color: "rgba(255,120,100,0.95)",
  },
  bigLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 15,
    marginTop: 4,
  },
  statusGood: {
    color: "rgba(100,255,150,0.9)",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
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
    color: "rgba(255,120,100,0.85)",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
  loadBar: {
    height: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 6,
    marginTop: 12,
    overflow: "hidden",
  },
  loadFill: {
    height: "100%",
    backgroundColor: "rgba(255,120,100,0.7)",
  },
  loadText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginTop: 8,
    fontStyle: "italic",
  },
  recoveryText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  proteinSection: {
    marginBottom: 16,
  },
  proteinStatus: {
    color: "rgba(255,200,100,0.95)",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  proteinText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    lineHeight: 20,
  },
  proteinTips: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  tipLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
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
});
