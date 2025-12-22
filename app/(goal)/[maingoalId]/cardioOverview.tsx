import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function CardioScreen() {
  const router = useRouter();

  // 🔹 Här hämtar du data från store / hook / context
  const cardio = {
    vo2max: 48,
    vo2maxDelta: 3,
    restingHR: 52,
    restingHRDelta: -4,
    trainingLoad: 285,
    trainingLoadStatus: "Optimal",
    recoveryTime: 18,
    fitnessAge: 32,
    actualAge: 38,
  };

  return (
    <LinearGradient colors={["#071526", "#040B16"]} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Cardio Fitness</Text>
        <Text style={styles.subtitle}>
          Cardiovascular endurance metrics and training insights
        </Text>

        {/* Overview card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your cardio performance</Text>

          <View style={styles.row}>
            {/* VO2 Max */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>VO₂ Max</Text>
              <Text style={styles.value}>{cardio.vo2max}</Text>
              <Text style={styles.accent}>+{cardio.vo2maxDelta}% trend</Text>
            </View>

            {/* Resting HR */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Resting HR</Text>
              <Text style={styles.value}>{cardio.restingHR}</Text>
              <Text style={styles.accent}>{cardio.restingHRDelta} bpm</Text>
            </View>

            {/* Training Load */}
            <View style={styles.col}>
              <Text style={styles.label}>Training Load</Text>
              <Text style={styles.valueSmall}>{cardio.trainingLoad}</Text>
              <Text style={styles.muted}>{cardio.trainingLoadStatus}</Text>
            </View>
          </View>

          {/* Second row */}
          <View style={[styles.row, { marginTop: 20 }]}>
            {/* Recovery Time */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Recovery time</Text>
              <Text style={styles.value}>{cardio.recoveryTime}h</Text>
              <Text style={styles.muted}>Until next hard effort</Text>
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
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>💪 Training Load</Text>
            <Text style={styles.infoText}>
              Training Load tracks the cumulative intensity and volume of your workouts over 7 days. 
              Optimal load means you're training effectively without overtraining.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>⏱️ Recovery Time</Text>
            <Text style={styles.infoText}>
              Time needed before your body is ready for another hard training session. 
              Respecting recovery prevents injury and improves performance.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🎂 Fitness Age</Text>
            <Text style={styles.infoText}>
              Based on your VO₂ max, resting heart rate, and other factors. 
              A lower fitness age indicates superior cardiovascular health.
            </Text>
          </View>
        </View>

        {/* Training zones card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Optimize your training</Text>
          
          <Text style={styles.tipText}>
            • Zone 2 training (60-70% max HR) builds aerobic base
          </Text>
          <Text style={styles.tipText}>
            • HIIT workouts (2x/week) improve VO₂ max effectively
          </Text>
          <Text style={styles.tipText}>
            • Progressive overload: gradually increase distance or intensity
          </Text>
          <Text style={styles.tipText}>
            • Mix intensities: 80% easy, 20% hard (80/20 rule)
          </Text>
          <Text style={styles.tipText}>
            • Monitor HRV to optimize training timing
          </Text>
          <Text style={styles.tipText}>
            • Adequate sleep and nutrition are crucial for adaptation
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
