import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { BodyBatteryMetric } from '@/components/metrics/BodyBatteryMetric';
import { HRVMetric } from '@/components/metrics/HRVMetric';
import { RecoveryStatusMetric } from '@/components/metrics/RecoveryStatusMetric';
import { RestingHRMetric } from '@/components/metrics/RestingHRMetric';
import { StressScoreMetric } from '@/components/metrics/StressScoreMetric';
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

function getBalanceMessage(stressScore: number, t: (key: string) => string): string {
  if (stressScore < 40) {
    return t("nervousSystemOverview.ansBalance.parasympathetic");
  } else if (stressScore < 70) {
    return t("nervousSystemOverview.ansBalance.balanced");
  } else {
    return t("nervousSystemOverview.ansBalance.sympathetic");
  }
}

export default function NervousSystemScreen({ mainGoalId }: { mainGoalId: string }) {
  const { adapter, status } = useWearable();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = React.useState(true);
  const [hrvData, setHrvData] = React.useState<HRVSummary[]>([]);
  const [hrv, setHrv] = React.useState<number | null>(null);
  const [sleepHours, setSleepHours] = React.useState<number | null>(null);
  const [energyData, setEnergyData] = React.useState<any[]>([]);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const range = { start: daysAgo(7), end: new Date().toISOString() };

      const [hrvValue, energy] = await Promise.all([
          adapter.getHRV(range),
          adapter.getEnergySignal(range),
        ]);
      setHrvData(hrvValue);
      setEnergyData(energy);
      
      const hrvMetrics = calculateHRVMetrics(hrvValue);
      setHrv(hrvMetrics.hrv);

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

  return (
    <>
      <ThemedText type="title" style={{ color: colors.accentStrong }}>{t("nervousSystemOverview.title")}</ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t("nervousSystemOverview.description")}
      </ThemedText>

      <WearableStatus status={status} />

      {/* Overview card - Main ANS metrics */}
      <Card title={t("nervousSystemOverview.autonomicNervousSystem.title")}>
        {loading ? (
          <ThemedText type="caption">{t("general.loading")}</ThemedText>
        ) : (
          <>
            <View style={globalStyles.row}>
              <HRVMetric hrvData={hrvData} showDivider />

              {/* Stress Score */}
              <StressScoreMetric hrvData={hrvData} showDivider />

              {/* Body Battery */}
              <BodyBatteryMetric energyData={energyData} />
            </View>

            {/* Second row */}
            <View style={[globalStyles.row, globalStyles.marginTop16]}>
              <RestingHRMetric hrvData={hrvData} showDivider />

            {/* Recovery Status */}
            <RecoveryStatusMetric hrvData={hrvData} sleepHours={sleepHours} />
            </View>
          </>
        )}
      </Card>

      {/* ANS Balance visualization */}
      <Card title={t("nervousSystemOverview.ansBalance.title")}>
        {loading ? (
          <ThemedText type="caption">{t("general.loading")}</ThemedText>
        ) : (
          <>
            <View style={styles.balanceContainer}>
              <View style={styles.balanceBar}>
                <View style={[{ flex: stressScore, backgroundColor: colors.warmDefault }]} />
                <View style={[{ flex: 100 - stressScore, backgroundColor: colors.accentDefault }]} />
              </View>
              <View style={styles.balanceLabels}>
                <ThemedText type="caption">⚡ {t("nervousSystemOverview.ansBalance.fightFlight")}</ThemedText>
                <ThemedText type="caption">😌 {t("nervousSystemOverview.ansBalance.restDigest")}</ThemedText>
              </View>
            </View>
            <ThemedText type="default">{getBalanceMessage(stressScore, t)}</ThemedText>
          </>
        )}
      </Card>

      {/* Information card */}
      <Card title={t("nervousSystemOverview.informationCard.title")}>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">❤️ {t("nervousSystemOverview.informationCard.hrv.title")}</ThemedText>
          <ThemedText type="default">
            {t("nervousSystemOverview.informationCard.hrv.description")}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">😰 {t("nervousSystemOverview.informationCard.stressScore.title")}</ThemedText>
          <ThemedText type="default">
            {t("nervousSystemOverview.informationCard.stressScore.description")}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🔋 {t("nervousSystemOverview.informationCard.bodyBattery.title")}</ThemedText>
          <ThemedText type="default">
            {t("nervousSystemOverview.informationCard.bodyBattery.description")}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⚖️ {t("nervousSystemOverview.informationCard.ansBalance.title")}</ThemedText>
          <ThemedText type="default">
            {t("nervousSystemOverview.informationCard.ansBalance.description")}
          </ThemedText>
        </View>
      </Card>

      <GenesListCard areaId="nervousSystem"/>

      {/* Tips card */}
      <TipsList areaId={mainGoalId} />
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
