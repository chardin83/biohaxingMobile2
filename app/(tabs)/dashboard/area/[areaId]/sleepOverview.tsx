import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { SleepConsistencyMetric } from '@/components/metrics/SleepConsistencyMetric';
import { SleepMetric } from '@/components/metrics/SleepMetric';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
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
  const { colors } = useTheme();

  const [loading, setLoading] = React.useState(true);
  const [sleepData, setSleepData] = React.useState<SleepSummary[]>([]);
  const [consistencyLabel, setConsistencyLabel] = React.useState<'High' | 'Moderate' | 'Low'>('Moderate');
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
      setConsistencyLabel(sleeps.length >= 6 ? 'Moderate' : 'Low');

      setLoading(false);
    })().catch(() => setLoading(false));
  }, [adapter]);

  return (
    <>
      <ThemedText type="title">Sleep</ThemedText>
      <ThemedText type="subtitle">Recovery, restoration, and circadian health</ThemedText>
      <WearableStatus status={status} />

      {/* Overview card */}
      <Card title="Your sleep overview">
        {loading ? (
          <ThemedText type="caption">Loading…</ThemedText>
        ) : (
          <View style={globalStyles.row}>
            <SleepMetric sleepData={sleepData} showDivider />

            <View
              style={[globalStyles.col, globalStyles.colWithDivider, { borderRightColor: colors.borderLight ?? colors.border }]}
            >
              <ThemedText type="label">Sleep consistency</ThemedText>
              <ThemedText type="title3">{consistencyLabel}</ThemedText>
              <ThemedText type="caption">7 day pattern</ThemedText>
            </View>

            <View style={globalStyles.col}>
              <SleepConsistencyMetric sleepData={{ ...sleepData[0], targetBedtime: '22:30' }} />
            </View>
          </View>
        )}
      </Card>

      {/* Sleep stages card */}
      <Card title="Sleep architecture">
        {loading ? (
          <ThemedText type="caption">Loading…</ThemedText>
        ) : (
          <>
            <View style={globalStyles.row}>
              <View
                style={[globalStyles.col, globalStyles.colWithDivider, { borderRightColor: colors.borderLight ?? colors.border }]}
              >
                <ThemedText type="default">Deep sleep</ThemedText>
                <ThemedText type="title2">{deepSleepMinutes ?? '—'}</ThemedText>
                <ThemedText type="caption">minutes</ThemedText>
              </View>

              <View style={globalStyles.col}>
                <ThemedText type="default">REM sleep</ThemedText>
                <ThemedText type="title2">{remSleepMinutes ?? '—'}</ThemedText>
                <ThemedText type="caption">minutes</ThemedText>
              </View>
            </View>

            <ThemedText type="caption" style={styles.stageText}>
              💤 Deep sleep is crucial for physical recovery and immune function. REM sleep supports memory
              consolidation and emotional regulation.
            </ThemedText>
          </>
        )}
      </Card>

      {/* Information card */}
      <Card title="Understanding sleep">
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🌙 Sleep Stages</ThemedText>
          <ThemedText type="default">
            Sleep cycles through 4 stages: Light (N1, N2), Deep (N3), and REM. Each stage has unique benefits. Adults
            need 7-9 hours with balanced stage distribution for optimal recovery.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🧠 Deep Sleep</ThemedText>
          <ThemedText type="default">
            Deep sleep (slow-wave sleep) is when your body repairs tissues, builds muscle, strengthens immune system,
            and consolidates memories. Growth hormone peaks during this stage. Aim for 15-25% of total sleep time.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">💭 REM Sleep</ThemedText>
          <ThemedText type="default">
            REM (Rapid Eye Movement) sleep processes emotions, consolidates learning, and supports creativity. Most
            vivid dreams occur here. REM should be 20-25% of total sleep and increases in later cycles.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⏰ Circadian Rhythm</ThemedText>
          <ThemedText type="default">
            Your internal 24-hour clock regulates sleep-wake cycles, hormone release, and body temperature. Consistent
            sleep/wake times strengthen circadian rhythm and improve sleep quality.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">💡 Light & Melatonin</ThemedText>
          <ThemedText type="default">
            Blue light (450-480nm) from screens and bright overhead lights suppresses melatonin production for 2-3
            hours. After sunset, switch to dim warm lighting (amber/red spectrum) to preserve natural melatonin rise.
            Red light (630-700nm) has minimal impact on circadian rhythm and can be used safely in the evening.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">📊 Sleep Efficiency</ThemedText>
          <ThemedText type="default">
            Percentage of time in bed actually spent sleeping. Above 85% is good, above 90% is excellent. Low
            efficiency may indicate sleep disorders, stress, or poor sleep hygiene.
          </ThemedText>
        </View>
      </Card>

      {/* DNA & Gener som påverkar sömn */}
      <GenesListCard areaId="sleepQuality" />

      {/* Tips card */}
      <TipsList areaId={mainGoalId} title="sleepQuality.levels.sleepBy2230.tips.0.title" />
    </>
  );
}

const styles = StyleSheet.create({
  stageText: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
