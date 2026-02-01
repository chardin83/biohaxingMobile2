import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { HRVMetric } from '@/components/metrics/HRVMetric';
import { RestingHRMetric } from '@/components/metrics/RestingHRMetric';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { calculateHRVMetrics } from '@/utils/hrvCalculations';
import { HRVSummary } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function getBalanceMessage(stressScore: number): string {
  if (stressScore < 40) {
    return 'Your nervous system is currently in a parasympathetic-dominant state, indicating good recovery and relaxation.';
  } else if (stressScore < 70) {
    return 'Your nervous system shows balanced activity between sympathetic and parasympathetic states.';
  } else {
    return 'Your nervous system shows elevated sympathetic activity. Consider rest and recovery practices.';
  }
}

function getStressLevel(stressScore: number): string {
  if (stressScore < 30) {
    return 'Low';
  } else if (stressScore < 60) {
    return 'Moderate';
  } else {
    return 'High';
  }
}

function getRecoveryStatus(hrv: number | null, sleepHours: number | null): string {
  if (hrv && hrv >= 65 && sleepHours && sleepHours >= 7.5) {
    return 'Fully Recovered';
  } else if (hrv && hrv >= 50 && sleepHours && sleepHours >= 6.5) {
    return 'Good Recovery';
  } else {
    return 'Needs Recovery';
  }
}

export default function NervousSystemScreen({ mainGoalId }: { mainGoalId: string }) {
  const { adapter, status } = useWearable();
  const { colors } = useTheme();

  const [loading, setLoading] = React.useState(true);
  const [hrvData, setHrvData] = React.useState<HRVSummary[]>([]);
  const [hrv, setHrv] = React.useState<number | null>(null);
  const [bodyBattery, setBodyBattery] = React.useState<number | null>(null);
  const [sleepHours, setSleepHours] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const range = { start: daysAgo(7), end: new Date().toISOString() };

      // Hämta HRV data
      const data = await adapter.getHRV(range);
      setHrvData(data);

      const hrvMetrics = calculateHRVMetrics(data);
      setHrv(hrvMetrics.hrv);

      // Hämta Body Battery
      const energyData = await adapter.getEnergySignal(range);
      if (energyData.length > 0) {
        const latest = energyData[energyData.length - 1];
        setBodyBattery(latest.bodyBatteryLevel ?? null);
      }

      // Hämta sleep
      const sleepData = await adapter.getSleep(range);
      if (sleepData.length > 0) {
        const latest = sleepData[sleepData.length - 1];
        setSleepHours(latest.durationMinutes ? latest.durationMinutes / 60 : null);
      }

      setLoading(false);
    })().catch(() => setLoading(false));
  }, [adapter]);

  // Beräkna status baserat på HRV
  const stressScore = hrv ? Math.max(0, Math.min(100, 100 - hrv)) : 50;
  const stressLevel = getStressLevel(stressScore);
  const recoveryStatus = getRecoveryStatus(hrv, sleepHours);

  return (
    <>
      <ThemedText type="title" style={{ color: colors.accentStrong }}>Nervous System</ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        Autonomic nervous system balance and recovery metrics
      </ThemedText>

      <WearableStatus status={status} />

      {/* Overview card - Main ANS metrics */}
      <Card title="Autonomic nervous system">
        {loading ? (
          <ThemedText type="caption">Loading…</ThemedText>
        ) : (
          <>
            <View style={globalStyles.row}>
              <HRVMetric hrvData={hrvData} showDivider />

              {/* Stress Score */}
              <View style={[
                globalStyles.col,
                globalStyles.colWithDivider,
                { borderRightColor: colors.borderLight ?? colors.border }
              ]}>
                <ThemedText type="label">Stress score</ThemedText>
                <ThemedText type="value">{Math.round(stressScore)}</ThemedText>
                <ThemedText type="caption" style={{ color: colors.accentDefault }}>{stressLevel}</ThemedText>
              </View>

              {/* Body Battery */}
              <View style={globalStyles.col}>
                <ThemedText type="label">Body Battery</ThemedText>
                <ThemedText type="caption">{bodyBattery ?? '—'}%</ThemedText>
              </View>
            </View>

            {/* Second row */}
            <View style={[globalStyles.row, globalStyles.marginTop16]}>
              <RestingHRMetric hrvData={hrvData} showDivider />

              {/* Recovery Status */}
              <View style={globalStyles.col}>
                <ThemedText type="label">Recovery status</ThemedText>
                <ThemedText type="caption">{recoveryStatus}</ThemedText>
                <ThemedText type="caption">{sleepHours ? `${sleepHours.toFixed(1)}h sleep` : 'No sleep data'}</ThemedText>
              </View>
            </View>
          </>
        )}
      </Card>

      {/* ANS Balance visualization */}
      <Card title="Sympathetic vs Parasympathetic">
        {loading ? (
          <ThemedText type="caption">Loading…</ThemedText>
        ) : (
          <>
            <View style={styles.balanceContainer}>
              <View style={styles.balanceBar}>
                <View style={[{ flex: stressScore, backgroundColor: colors.warmDefault }]} />
                <View style={[{ flex: 100 - stressScore, backgroundColor: colors.accentDefault }]} />
              </View>
              <View style={styles.balanceLabels}>
                <ThemedText type="caption">⚡ Fight/Flight</ThemedText>
                <ThemedText type="caption">😌 Rest/Digest</ThemedText>
              </View>
            </View>
            <ThemedText type="default">{getBalanceMessage(stressScore)}</ThemedText>
          </>
        )}
      </Card>

      {/* Information card */}
      <Card title="Understanding your nervous system">
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">❤️ HRV (Heart Rate Variability)</ThemedText>
          <ThemedText type="default">
            HRV measures the variation in time between heartbeats. Higher HRV indicates better autonomic nervous
            system function, resilience, and recovery capacity. It's influenced by stress, sleep, fitness, and overall
            health.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">😰 Stress Score</ThemedText>
          <ThemedText type="default">
            Based on HRV, activity, and sleep data. Lower scores (0-25) indicate low stress, while higher scores
            (75-100) show significant sympathetic nervous system activation. Chronic high stress can lead to burnout
            and health issues.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🔋 Body Battery</ThemedText>
          <ThemedText type="default">
            Tracks your body's energy reserves throughout the day. Charged during rest and sleep (parasympathetic
            activity), depleted by stress and activity (sympathetic activity). Optimize recharge by prioritizing sleep
            and recovery.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⚖️ ANS Balance</ThemedText>
          <ThemedText type="default">
            The autonomic nervous system has two branches: sympathetic (fight/flight) and parasympathetic
            (rest/digest). Optimal health requires good balance and the ability to switch between states
            appropriately.
          </ThemedText>
        </View>
      </Card>

      <GenesListCard areaId="stressReduction"/>

      {/* Tips card */}
      <TipsList areaId={mainGoalId} title="tips:nervousSystem.levels.optimization.title" />
    </>
  );
}

const styles = StyleSheet.create({
  balanceContainer: {
    marginVertical: 12,
  },
  balanceBar: {
    flexDirection: 'row',
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  balanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  balanceText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
});
