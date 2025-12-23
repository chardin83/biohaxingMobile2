import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SleepSummary } from "@/wearables/types";

interface SleepMetricProps {
  sleepData: SleepSummary[];
  showDivider?: boolean;
}

export function SleepMetric({ sleepData, showDivider = false }: Readonly<SleepMetricProps>) {
  const latestSleep = sleepData[0];
  const sleepMinutes = latestSleep?.durationMinutes ?? null;
  const sleepHours = sleepMinutes ? Math.floor(sleepMinutes / 60) : null;
  const sleepMins = sleepMinutes ? sleepMinutes % 60 : null;
  const efficiency = latestSleep?.efficiencyPct ?? null;

  return (
    <View style={[styles.col, showDivider && styles.colWithDivider]}>
      <Text style={styles.label}>Sleep duration</Text>
      <View style={styles.valueContainer}>
        {sleepMinutes === null ? (
          <Text style={styles.value}>—</Text>
        ) : (
          <>
            <Text style={styles.value}>{sleepHours}</Text>
            <Text style={styles.unit}>h </Text>
            <Text style={styles.value}>{String(sleepMins).padStart(2, "0")}</Text>
            <Text style={styles.unit}>m</Text>
          </>
        )}
      </View>
      {efficiency !== null && (
        <Text style={styles.accent}>{efficiency}% efficiency</Text>
      )}
      {latestSleep && (
        <Text style={styles.source}>{latestSleep.source}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  value: {
    color: "white",
    fontSize: 26,
    fontWeight: "700",
  },
  unit: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 2,
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
});