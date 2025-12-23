import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useWearable } from "@/wearables/wearableProvider";
import { WearableStatus } from "@/components/WearableStatus";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export default function SleepScreen() {
  const { adapter, status } = useWearable();

  const [loading, setLoading] = React.useState(true);
  const [sleepMinutes, setSleepMinutes] = React.useState<number | null>(null);
  const [consistencyLabel, setConsistencyLabel] = React.useState<"High"|"Moderate"|"Low">("Moderate");
  const [qualityScore, setQualityScore] = React.useState<number>(6.6);
  const [deepSleepMinutes, setDeepSleepMinutes] = React.useState<number | null>(null);
  const [remSleepMinutes, setRemSleepMinutes] = React.useState<number | null>(null);
  const [efficiency, setEfficiency] = React.useState<number | null>(null);
  const [source, setSource] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const range = { start: daysAgo(7), end: new Date().toISOString() };

      const sleeps = await adapter.getSleep(range);

      // V1: visa senaste nattens duration
      const latest = sleeps[sleeps.length - 1];
      setSleepMinutes(latest?.durationMinutes ?? null);
      setDeepSleepMinutes(latest?.stages?.deepMinutes ?? null);
      setRemSleepMinutes(latest?.stages?.remMinutes ?? null);
      setEfficiency(latest?.efficiencyPct ?? null);
      setSource(latest?.source ?? null);

      // "consistency" i V1 kan vara väldigt enkel:
      // här bara en placeholder som du kan byta senare
      setConsistencyLabel(sleeps.length >= 6 ? "Moderate" : "Low");

      // "quality" kan också vara placeholder i V1
      setQualityScore(latest?.efficiencyPct ? Math.round((latest.efficiencyPct / 100) * 10 * 10) / 10 : 6.6);

      setLoading(false);
    })().catch(() => setLoading(false));
  }, [adapter]);

  const sleepHours = sleepMinutes ? Math.floor(sleepMinutes / 60) : null;
  const sleepMins = sleepMinutes ? sleepMinutes % 60 : null;

  return (
    <LinearGradient colors={["#071526", "#040B16"]} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>

        <Text style={styles.title}>Sleep</Text>
        <Text style={styles.subtitle}>
          Recovery, restoration, and circadian health
        </Text>
        <WearableStatus status={status} />

        {/* Overview card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your sleep overview</Text>

          {loading ? (
            <Text style={styles.muted}>Loading…</Text>
          ) : (
            <>
              <View style={styles.row}>
                <View style={[styles.col, styles.colWithDivider]}>
                  <Text style={styles.label}>Sleep duration</Text>
                  <Text style={styles.value}>
                    {sleepMinutes == null ? "—" : `${sleepHours}h ${String(sleepMins).padStart(2,"0")}m`}
                  </Text>
                  <Text style={styles.accent}>
                    {efficiency ? `${efficiency}% efficiency` : ""}
                  </Text>
                </View>

                <View style={[styles.col, styles.colWithDivider]}>
                  <Text style={styles.label}>Sleep consistency</Text>
                  <Text style={styles.valueSmall}>{consistencyLabel}</Text>
                  <Text style={styles.muted}>7 day pattern</Text>
                </View>

                <View style={styles.col}>
                  <Text style={styles.label}>Sleep quality</Text>
                  <Text style={styles.valueSmall}>{qualityScore.toFixed(1)}</Text>
                  <Text style={styles.muted}>out of 10</Text>
                </View>
              </View>

              {source && (
                <Text style={styles.source}>Source: {source}</Text>
              )}
            </>
          )}
        </View>

        {/* Sleep stages card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Sleep architecture</Text>

          {loading ? (
            <Text style={styles.muted}>Loading…</Text>
          ) : (
            <>
              <View style={styles.row}>
                <View style={[styles.col, styles.colWithDivider]}>
                  <Text style={styles.label}>Deep sleep</Text>
                  <Text style={styles.value}>
                    {deepSleepMinutes ?? "—"}
                  </Text>
                  <Text style={styles.muted}>minutes</Text>
                </View>

                <View style={styles.col}>
                  <Text style={styles.label}>REM sleep</Text>
                  <Text style={styles.value}>
                    {remSleepMinutes ?? "—"}
                  </Text>
                  <Text style={styles.muted}>minutes</Text>
                </View>
              </View>

              <Text style={styles.stageText}>
                💤 Deep sleep is crucial for physical recovery and immune function. 
                REM sleep supports memory consolidation and emotional regulation.
              </Text>
            </>
          )}
        </View>

        {/* Information card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Understanding sleep</Text>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🌙 Sleep Stages</Text>
            <Text style={styles.infoText}>
              Sleep cycles through 4 stages: Light (N1, N2), Deep (N3), and REM. 
              Each stage has unique benefits. Adults need 7-9 hours with balanced stage distribution 
              for optimal recovery.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🧠 Deep Sleep</Text>
            <Text style={styles.infoText}>
              Deep sleep (slow-wave sleep) is when your body repairs tissues, builds muscle, 
              strengthens immune system, and consolidates memories. Growth hormone peaks during 
              this stage. Aim for 15-25% of total sleep time.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>💭 REM Sleep</Text>
            <Text style={styles.infoText}>
              REM (Rapid Eye Movement) sleep processes emotions, consolidates learning, 
              and supports creativity. Most vivid dreams occur here. REM should be 20-25% 
              of total sleep and increases in later cycles.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>⏰ Circadian Rhythm</Text>
            <Text style={styles.infoText}>
              Your internal 24-hour clock regulates sleep-wake cycles, hormone release, 
              and body temperature. Consistent sleep/wake times strengthen circadian rhythm 
              and improve sleep quality.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>💡 Light & Melatonin</Text>
            <Text style={styles.infoText}>
              Blue light (450-480nm) from screens and bright overhead lights suppresses melatonin 
              production for 2-3 hours. After sunset, switch to dim warm lighting (amber/red 
              spectrum) to preserve natural melatonin rise. Red light (630-700nm) has minimal 
              impact on circadian rhythm and can be used safely in the evening.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>📊 Sleep Efficiency</Text>
            <Text style={styles.infoText}>
              Percentage of time in bed actually spent sleeping. Above 85% is good, 
              above 90% is excellent. Low efficiency may indicate sleep disorders, 
              stress, or poor sleep hygiene.
            </Text>
          </View>
        </View>

        {/* Tips card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Optimize your sleep</Text>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🫀 Lower Your Heart Rate Before Bed (Most Important!)</Text>
            <Text style={styles.infoText}>
              The key to great sleep is entering bed with a low resting heart rate. 
              A calm nervous system signals your body it's safe to enter deep sleep. 
              High HR keeps you in fight-or-flight mode and fragments sleep cycles.
            </Text>
          </View>

          <Text style={styles.tipText}>
            ⏰ Stop eating 3-4 hours before bed (digestion raises HR by 10-15 bpm)
          </Text>
          <Text style={styles.tipText}>
            ☕ No caffeine after 2 PM (raises HR and blocks adenosine for 6-8 hours)
          </Text>
          <Text style={styles.tipText}>
            📰 Avoid news, debates, or conflict 2 hours before bed (cortisol spike)
          </Text>
          <Text style={styles.tipText}>
            🎬 Skip thriller/horror movies in the evening (adrenaline stays elevated)
          </Text>
          <Text style={styles.tipText}>
            🧘 Practice 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s (lowers HR 5-10 bpm)
          </Text>
          <Text style={styles.tipText}>
            💡 Dim lights after sunset - use red/amber bulbs or salt lamps (preserves melatonin)
          </Text>
          <Text style={styles.tipText}>
            🔴 Red light therapy (630-700nm) safe for evening use - doesn't suppress melatonin
          </Text>
          <Text style={styles.tipText}>
            📱 No screens 1-2 hours before bed OR use blue light blockers/night mode
          </Text>
          <Text style={styles.tipText}>
            🕶️ Blue light blocking glasses (amber lenses) 2-3h before bed if using screens
          </Text>
          <Text style={styles.tipText}>
            💡 Avoid bright overhead lights in evening - use lamps with warm bulbs (&lt;2700K)
          </Text>
          <Text style={styles.tipText}>
            🛁 Hot bath/shower 90 min before bed (temperature drop signals sleep)
          </Text>
          <Text style={styles.tipText}>
            📖 Replace screen time with reading (use dim amber book light)
          </Text>
          <Text style={styles.tipText}>
            🌅 Get morning sunlight (10-30 min) to anchor circadian rhythm
          </Text>
          <Text style={styles.tipText}>
            ❄️ Keep bedroom cool (60-67°F / 15-19°C) for optimal sleep
          </Text>
          <Text style={styles.tipText}>
            🌑 Complete darkness - use blackout curtains or eye mask
          </Text>
          <Text style={styles.tipText}>
            🍷 Limit alcohol - it fragments sleep and reduces REM
          </Text>
          <Text style={styles.tipText}>
            🏃 Exercise regularly, but finish 3+ hours before bed
          </Text>
          <Text style={styles.tipText}>
            ⏰ Consistent sleep/wake times (even weekends) - within 30 min
          </Text>
          <Text style={styles.tipText}>
            💊 Consider magnesium glycinate (200-400mg) 1-2h before bed
          </Text>
          <Text style={styles.tipText}>
            🛏️ Use bed only for sleep (not work, TV, phone scrolling)
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
    paddingBottom: 32 
  },
  title: { 
    fontSize: 44, 
    fontWeight: "700", 
    color: "rgba(120,255,220,0.95)" 
  },
  subtitle: { 
    color: "rgba(255,255,255,0.7)", 
    fontSize: 16, 
    marginTop: 6, 
    marginBottom: 16 
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
    marginBottom: 14 
  },
  row: { 
    flexDirection: "row", 
    justifyContent: "space-between" 
  },
  col: { 
    flex: 1, 
    paddingHorizontal: 8 
  },
  colWithDivider: { 
    borderRightWidth: 1, 
    borderRightColor: "rgba(255,255,255,0.10)" 
  },
  label: { 
    color: "rgba(255,255,255,0.65)", 
    fontSize: 13 
  },
  value: { 
    color: "white", 
    fontSize: 26, 
    fontWeight: "700", 
    marginTop: 4 
  },
  valueSmall: { 
    color: "white", 
    fontSize: 22, 
    fontWeight: "700", 
    marginTop: 4 
  },
  muted: { 
    color: "rgba(255,255,255,0.5)", 
    fontSize: 12, 
    marginTop: 6 
  },
  accent: {
    color: "rgba(120,255,220,0.85)",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
  source: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    marginTop: 12,
  },
  stageText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
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
