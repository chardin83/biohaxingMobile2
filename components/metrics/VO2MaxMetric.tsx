import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface VO2MaxMetricProps {
  vo2max: number | null;
  status?: string;
  trend?: number; // Percentage change
  showDivider?: boolean;
}

export function VO2MaxMetric({ vo2max, status, trend, showDivider = false }: VO2MaxMetricProps) {
  return (
    <View style={[styles.col, showDivider && styles.colWithDivider]}>
      <Text style={styles.label}>VO₂ Max</Text>
      <Text style={styles.value}>{vo2max ?? "—"}</Text>
      {trend !== undefined && (
        <Text style={styles.accent}>
          {trend > 0 ? "+" : ""}{trend}% trend
        </Text>
      )}
      {status && <Text style={styles.muted}>{status}</Text>}
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
  value: {
    color: "white",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 4,
  },
  accent: {
    color: "rgba(120,255,220,0.85)",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
  muted: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 4,
  },
});