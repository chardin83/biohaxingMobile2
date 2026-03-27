import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ImmuneStatusChart } from '@/components/metrics/ImmuneStatusChart';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import MicrobiomeListCard from '@/components/ui/MicrobiomeListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { useWearable } from '@/wearables/wearableProvider';

export default function ImmuneScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { status } = useWearable();
  const { t } = useTranslation();

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.immuneSystem }}>{t("immuneOverview.title")}</ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t("immuneOverview.description")}
      </ThemedText>

      <WearableStatus status={status} />

  <ImmuneStatusChart />

      {/* Information card */}
      <Card title={t("immuneOverview.whyTheseMetricsMatter.title")}>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">💤 {t("immuneOverview.whyTheseMetricsMatter.sleep.title")}</ThemedText>
          <ThemedText type="default">
            {t("immuneOverview.whyTheseMetricsMatter.sleep.description")}
            Adequate sleep is crucial for immune function. During sleep, the body produces cytokines that help fight
            infection and inflammation.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">😌 {t("immuneOverview.whyTheseMetricsMatter.stress.title")}</ThemedText>
          <ThemedText type="default">
            {t("immuneOverview.whyTheseMetricsMatter.stress.description")}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">❤️ {t("immuneOverview.whyTheseMetricsMatter.hrv.title")}</ThemedText>
          <ThemedText type="default">
            {t("immuneOverview.whyTheseMetricsMatter.hrv.description")}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🫀 {t("immuneOverview.whyTheseMetricsMatter.restingHeartRate.title")}</ThemedText>
          <ThemedText type="default">
            {t("immuneOverview.whyTheseMetricsMatter.restingHeartRate.description")}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🦠 {t("immuneOverview.whyTheseMetricsMatter.microbiomeButyrate.title")}</ThemedText>
          <ThemedText type="default">
            {t("immuneOverview.whyTheseMetricsMatter.microbiomeButyrate.description")}
          </ThemedText>
        </View>
      </Card>

      {/* DNA & Immunförsvar Genetics */}
      <GenesListCard areaId="immune"/>

      {/* Microbiome section */}
      <MicrobiomeListCard areaId="immune" />

      {/* Tips card */}
      <TipsList areaId={mainGoalId}/>
    </>
  );
}
