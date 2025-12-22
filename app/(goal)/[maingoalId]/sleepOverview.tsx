import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function SleepScreen() {
  const router = useRouter();

  // 🔹 Här hämtar du data från store / hook / context
  const sleep = {
    durationMinutes: 430,
    durationDeltaPct: -5,
    consistency: "Moderate",
    consistencyDelta: 47,
    quality: 6.6,
    qualitySubtitle: "76% recovery",
  };

  return (
    <LinearGradient colors={["#071526", "#040B16"]} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */
        /*<Text style={styles.back} onPress={() => router.back()}>
          ‹ Back
        </Text>*/}

        <Text style={styles.title}>Sleep</Text>
        <Text style={styles.subtitle}>
          Metrics related to sleep duration, quality, and consistency
        </Text>

        {/* Overview card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your sleep overview</Text>

          <View style={styles.row}>
            {/* Duration */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Sleep duration</Text>
              <Text style={styles.value}>7h 10m</Text>
              <Text style={styles.muted}>−5% vs avg</Text>
            </View>

            {/* Consistency */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Sleep consistency</Text>
              <Text style={styles.valueSmall}>{sleep.consistency}</Text>
              <Text style={styles.muted}>± {sleep.consistencyDelta} min</Text>
            </View>

            {/* Quality */}
            <View style={styles.col}>
              <Text style={styles.label}>Sleep quality</Text>
              <Text style={styles.valueSmall}>{sleep.quality}</Text>
              <Text style={styles.accent}>{sleep.qualitySubtitle}</Text>
            </View>
          </View>
        </View>

        {/* 👇 Här fortsätter din befintliga kod */}
        {/* How to improve your sleep */}
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
});
