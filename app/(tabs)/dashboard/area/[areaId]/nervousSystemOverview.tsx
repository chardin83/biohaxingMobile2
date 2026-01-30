import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/app/theme/Colors';
import { HRVMetric } from '@/components/metrics/HRVMetric';
import { RestingHRMetric } from '@/components/metrics/RestingHRMetric';
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

  console.log('=== NERVOUS SYSTEM MOUNTED ===');
  console.log('mainGoalId from props:', mainGoalId);

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
        <Text style={styles.title}>Nervous System</Text>
        <Text style={styles.subtitle}>Autonomic nervous system balance and recovery metrics</Text>

        <WearableStatus status={status} />

        {/* Overview card - Main ANS metrics */}
        <Card title="Autonomic nervous system">
          {loading ? (
            <Text style={styles.muted}>Loading…</Text>
          ) : (
            <>
              <View style={styles.row}>
                <HRVMetric hrvData={hrvData} showDivider />

                {/* Stress Score */}
                <View style={[styles.col, styles.colWithDivider]}>
                  <Text style={styles.label}>Stress score</Text>
                  <Text style={styles.value}>{Math.round(stressScore)}</Text>
                  <Text style={styles.accent}>{stressLevel}</Text>
                </View>

                {/* Body Battery */}
                <View style={styles.col}>
                  <Text style={styles.label}>Body Battery</Text>
                  <Text style={styles.valueSmall}>{bodyBattery ?? '—'}%</Text>
                </View>
              </View>

              {/* Second row */}
              <View style={[styles.row, styles.rowMarginTop]}>
                <RestingHRMetric hrvData={hrvData} showDivider />

                {/* Recovery Status */}
                <View style={styles.col}>
                  <Text style={styles.label}>Recovery status</Text>
                  <Text style={styles.valueSmall}>{recoveryStatus}</Text>
                  <Text style={styles.muted}>{sleepHours ? `${sleepHours.toFixed(1)}h sleep` : 'No sleep data'}</Text>
                </View>
              </View>
            </>
          )}
        </Card>

        {/* ANS Balance visualization */}
        <Card title="Sympathetic vs Parasympathetic">
          {loading ? (
            <Text style={styles.muted}>Loading…</Text>
          ) : (
            <>
              <View style={styles.balanceContainer}>
                <View style={styles.balanceBar}>
                  <View style={[styles.sympatheticBar, { flex: stressScore }]} />
                  <View style={[styles.parasympatheticBar, { flex: 100 - stressScore }]} />
                </View>
                <View style={styles.balanceLabels}>
                  <Text style={styles.balanceLabel}>⚡ Fight/Flight</Text>
                  <Text style={styles.balanceLabel}>😌 Rest/Digest</Text>
                </View>
              </View>
              <Text style={styles.balanceText}>{getBalanceMessage(stressScore)}</Text>
            </>
          )}
        </Card>

        {/* Information card */}
        <Card title="Understanding your nervous system">
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>❤️ HRV (Heart Rate Variability)</Text>
            <Text style={styles.infoText}>
              HRV measures the variation in time between heartbeats. Higher HRV indicates better autonomic nervous
              system function, resilience, and recovery capacity. It's influenced by stress, sleep, fitness, and overall
              health.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>😰 Stress Score</Text>
            <Text style={styles.infoText}>
              Based on HRV, activity, and sleep data. Lower scores (0-25) indicate low stress, while higher scores
              (75-100) show significant sympathetic nervous system activation. Chronic high stress can lead to burnout
              and health issues.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🔋 Body Battery</Text>
            <Text style={styles.infoText}>
              Tracks your body's energy reserves throughout the day. Charged during rest and sleep (parasympathetic
              activity), depleted by stress and activity (sympathetic activity). Optimize recharge by prioritizing sleep
              and recovery.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>⚖️ ANS Balance</Text>
            <Text style={styles.infoText}>
              The autonomic nervous system has two branches: sympathetic (fight/flight) and parasympathetic
              (rest/digest). Optimal health requires good balance and the ability to switch between states
              appropriately.
            </Text>
          </View>
        </Card>

        <GenesListCard areaId="stressReduction"/>

        {/* Tips card */}
        <TipsList areaId={mainGoalId} title="tips:nervousSystem.levels.optimization.title" />
      </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 44,
    fontWeight: '700',
    color: Colors.dark.accentStrong,
  },
  subtitle: {
    color: Colors.dark.textTertiary,
    fontSize: 16,
    marginTop: 6,
    marginBottom: 16,
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
  rowMarginTop: {
    marginTop: 20,
  },
  label: {
    color: Colors.dark.textTertiary,
    fontSize: 13,
  },
  value: {
    color: Colors.dark.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    marginTop: 4,
  },
  valueSmall: {
    color: Colors.dark.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  muted: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  accent: {
    color: Colors.dark.accentDefault,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  balanceContainer: {
    marginVertical: 12,
  },
  balanceBar: {
    flexDirection: 'row',
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sympatheticBar: {
    backgroundColor: Colors.dark.warmDefault,
  },
  parasympatheticBar: {
    backgroundColor: Colors.dark.accentDefault,
  },
  balanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  balanceLabel: {
    color: Colors.dark.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  balanceText: {
    color: Colors.dark.textTertiary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoText: {
    color: Colors.dark.textTertiary,
    fontSize: 14,
    lineHeight: 20,
  },
});
