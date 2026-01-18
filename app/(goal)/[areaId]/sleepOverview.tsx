import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SleepMetric } from '@/components/metrics/SleepMetric';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { SleepSummary } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export default function SleepScreen({ mainGoalId }: { mainGoalId: string }) {
  const { adapter, status } = useWearable();

  const [loading, setLoading] = React.useState(true);
  const [sleepData, setSleepData] = React.useState<SleepSummary[]>([]);
  const [consistencyLabel, setConsistencyLabel] = React.useState<'High' | 'Moderate' | 'Low'>('Moderate');
  const [qualityScore, setQualityScore] = React.useState<number>(6.6);
  const [deepSleepMinutes, setDeepSleepMinutes] = React.useState<number | null>(null);
  const [remSleepMinutes, setRemSleepMinutes] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const range = { start: daysAgo(7), end: new Date().toISOString() };

      const sleeps = await adapter.getSleep(range);
      setSleepData(sleeps);

      // V1: visa senaste nattens duration
      const latest = sleeps[sleeps.length - 1];
      setDeepSleepMinutes(latest?.stages?.deepMinutes ?? null);
      setRemSleepMinutes(latest?.stages?.remMinutes ?? null);

      // "consistency" i V1 kan vara väldigt enkel:
      // här bara en placeholder som du kan byta senare
      setConsistencyLabel(sleeps.length >= 6 ? 'Moderate' : 'Low');

      // "quality" kan också vara placeholder i V1
      setQualityScore(latest?.efficiencyPct ? Math.round((latest.efficiencyPct / 100) * 10 * 10) / 10 : 6.6);

      setLoading(false);
    })().catch(() => setLoading(false));
  }, [adapter]);

  return (
    <View style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Sleep</Text>
        <Text style={styles.subtitle}>Recovery, restoration, and circadian health</Text>
        <WearableStatus status={status} />

        {/* Overview card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your sleep overview</Text>

          {loading ? (
            <Text style={styles.muted}>Loading…</Text>
          ) : (
            <View style={styles.row}>
              <SleepMetric sleepData={sleepData} showDivider />

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
                  <Text style={styles.value}>{deepSleepMinutes ?? '—'}</Text>
                  <Text style={styles.muted}>minutes</Text>
                </View>

                <View style={styles.col}>
                  <Text style={styles.label}>REM sleep</Text>
                  <Text style={styles.value}>{remSleepMinutes ?? '—'}</Text>
                  <Text style={styles.muted}>minutes</Text>
                </View>
              </View>

              <Text style={styles.stageText}>
                💤 Deep sleep is crucial for physical recovery and immune function. REM sleep supports memory
                consolidation and emotional regulation.
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
              Sleep cycles through 4 stages: Light (N1, N2), Deep (N3), and REM. Each stage has unique benefits. Adults
              need 7-9 hours with balanced stage distribution for optimal recovery.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🧠 Deep Sleep</Text>
            <Text style={styles.infoText}>
              Deep sleep (slow-wave sleep) is when your body repairs tissues, builds muscle, strengthens immune system,
              and consolidates memories. Growth hormone peaks during this stage. Aim for 15-25% of total sleep time.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>💭 REM Sleep</Text>
            <Text style={styles.infoText}>
              REM (Rapid Eye Movement) sleep processes emotions, consolidates learning, and supports creativity. Most
              vivid dreams occur here. REM should be 20-25% of total sleep and increases in later cycles.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>⏰ Circadian Rhythm</Text>
            <Text style={styles.infoText}>
              Your internal 24-hour clock regulates sleep-wake cycles, hormone release, and body temperature. Consistent
              sleep/wake times strengthen circadian rhythm and improve sleep quality.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>💡 Light & Melatonin</Text>
            <Text style={styles.infoText}>
              Blue light (450-480nm) from screens and bright overhead lights suppresses melatonin production for 2-3
              hours. After sunset, switch to dim warm lighting (amber/red spectrum) to preserve natural melatonin rise.
              Red light (630-700nm) has minimal impact on circadian rhythm and can be used safely in the evening.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>📊 Sleep Efficiency</Text>
            <Text style={styles.infoText}>
              Percentage of time in bed actually spent sleeping. Above 85% is good, above 90% is excellent. Low
              efficiency may indicate sleep disorders, stress, or poor sleep hygiene.
            </Text>
          </View>
        </View>

        {/* Tips card */}
        <TipsList areaId={mainGoalId} title="sleepQuality.levels.sleepBy2230.tips.0.title" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    paddingTop: 100,
  },
  title: {
    fontSize: 44,
    fontWeight: '700',
    color: 'rgba(120,255,220,0.95)',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(120,255,220,0.18)',
  },
  cardTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
    paddingHorizontal: 8,
  },
  colWithDivider: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.10)',
  },
  label: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
  },
  value: {
    color: 'white',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 4,
  },
  valueSmall: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  muted: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 6,
  },
  stageText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  infoSection: {
    marginBottom: 16,
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 20,
  },
  tipText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 4,
  },
});
