import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { NervousSystemStatusChart } from '@/components/metrics/NervousSystemStatusChart';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { useStoredHRVData } from '@/hooks/useStoredHRVData';
import { calculateHRVMetrics } from '@/utils/hrvCalculations';
import { useWearable } from '@/wearables/wearableProvider';

function getBalanceMessage(stressScore: number, t: (key: string) => string): string {
  if (stressScore < 40) {
    return t("nervousSystemOverview.ansBalance.parasympathetic");
  } else if (stressScore < 70) {
    return t("nervousSystemOverview.ansBalance.balanced");
  } else {
    return t("nervousSystemOverview.ansBalance.sympathetic");
  }
}

export default function NervousSystemScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { status } = useWearable();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const hrvData = useStoredHRVData();
  const hrv = React.useMemo(() => calculateHRVMetrics(hrvData).hrv, [hrvData]);

  // Beräkna status baserat på HRV
  const stressScore = hrv ? Math.max(0, Math.min(100, 100 - hrv)) : 50;

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.nervousSystem }}>{t("nervousSystemOverview.title")}</ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t("nervousSystemOverview.description")}
      </ThemedText>

      <WearableStatus status={status} />

      <NervousSystemStatusChart />

      {/* ANS Balance visualization */}
      <Card title={t("nervousSystemOverview.ansBalance.title")}>
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
