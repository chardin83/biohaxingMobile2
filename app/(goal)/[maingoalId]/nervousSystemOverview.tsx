import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function NervousSystemScreen() {
  const router = useRouter();

  // 🔹 Här hämtar du data från store / hook / context
  const nervousSystem = {
    hrv: 65,
    hrvStatus: "Balanced",
    hrvDelta: 12,
    stressScore: 28,
    stressLevel: "Low",
    bodyBattery: 85,
    bodyBatteryChange: "+15",
    restingHR: 54,
    restingHRDelta: -2,
    sleepHours: 7.8,
    recoveryStatus: "Fully Recovered",
  };

  return (
    <LinearGradient colors={["#071526", "#040B16"]} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nervous System</Text>
        <Text style={styles.subtitle}>
          Autonomic nervous system balance and recovery metrics
        </Text>

        {/* Overview card - Main ANS metrics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Autonomic nervous system</Text>

          <View style={styles.row}>
            {/* HRV */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>HRV</Text>
              <Text style={styles.value}>{nervousSystem.hrv}</Text>
              <Text style={styles.accent}>+{nervousSystem.hrvDelta}% 7d avg</Text>
            </View>

            {/* Stress Score */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Stress score</Text>
              <Text style={styles.value}>{nervousSystem.stressScore}</Text>
              <Text style={styles.accent}>{nervousSystem.stressLevel}</Text>
            </View>

            {/* Body Battery */}
            <View style={styles.col}>
              <Text style={styles.label}>Body Battery</Text>
              <Text style={styles.valueSmall}>{nervousSystem.bodyBattery}%</Text>
              <Text style={styles.accent}>{nervousSystem.bodyBatteryChange}</Text>
            </View>
          </View>

          {/* Second row */}
          <View style={[styles.row, { marginTop: 20 }]}>
            {/* Resting HR */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Resting HR</Text>
              <Text style={styles.value}>{nervousSystem.restingHR}</Text>
              <Text style={styles.accent}>{nervousSystem.restingHRDelta} bpm</Text>
            </View>

            {/* Recovery Status */}
            <View style={styles.col}>
              <Text style={styles.label}>Recovery status</Text>
              <Text style={styles.valueSmall}>{nervousSystem.recoveryStatus}</Text>
              <Text style={styles.muted}>{nervousSystem.sleepHours}h sleep</Text>
            </View>
          </View>
        </View>

        {/* ANS Balance visualization */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Sympathetic vs Parasympathetic</Text>
          
          <View style={styles.balanceContainer}>
            <View style={styles.balanceBar}>
              <View style={[styles.sympatheticBar, { flex: 35 }]} />
              <View style={[styles.parasympatheticBar, { flex: 65 }]} />
            </View>
            
            <View style={styles.balanceLabels}>
              <Text style={styles.balanceLabel}>⚡ Fight/Flight</Text>
              <Text style={styles.balanceLabel}>😌 Rest/Digest</Text>
            </View>
          </View>

          <Text style={styles.balanceText}>
            Your nervous system is currently in a parasympathetic-dominant state, 
            indicating good recovery and relaxation.
          </Text>
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
          <Text style={styles.cardTitle}>Optimize your nervous system</Text>
          
          <Text style={styles.tipText}>
            • Practice daily breathwork (4-7-8 breathing, box breathing)
          </Text>
          <Text style={styles.tipText}>
            • Prioritize 7-9 hours of quality sleep
          </Text>
          <Text style={styles.tipText}>
            • Morning sunlight exposure regulates circadian rhythm
          </Text>
          <Text style={styles.tipText}>
            • Cold exposure (showers, ice baths) trains ANS resilience
          </Text>
          <Text style={styles.tipText}>
            • Meditation and mindfulness reduce sympathetic activation
          </Text>
          <Text style={styles.tipText}>
            • Time in nature activates parasympathetic nervous system
          </Text>
          <Text style={styles.tipText}>
            • Avoid overtraining - monitor HRV for recovery status
          </Text>
          <Text style={styles.tipText}>
            • Social connection and laughter boost vagal tone
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
  tipText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 4,
  },
});
