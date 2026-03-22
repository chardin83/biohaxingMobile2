import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { CardioTrendsChart } from '@/components/metrics/CardioTrendsChart';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { useWearable } from '@/wearables/wearableProvider';

export default function CardioScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { status } = useWearable();
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.cardio }}>{t("cardioOverview.title")}</ThemedText>
      <ThemedText type="subtitle">{t("cardioOverview.description")}</ThemedText>
      <WearableStatus status={status} />

      <CardioTrendsChart />

      {/* VO2 Max explanation */}
      <Card title={t("cardioOverview.understandingYourMetrics.title")}>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🫁 {t("cardioOverview.understandingYourMetrics.vo2Max.title")}</ThemedText>
          <ThemedText type="default">
            {t("cardioOverview.understandingYourMetrics.vo2Max.description")}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🫀 {t("cardioOverview.understandingYourMetrics.restingHeartRate.title")}</ThemedText>
          <ThemedText type="default">
            {t("cardioOverview.understandingYourMetrics.restingHeartRate.description")}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">💪 {t("cardioOverview.understandingYourMetrics.trainingLoad.title")}</ThemedText>
          <ThemedText type="default">
            {t("cardioOverview.understandingYourMetrics.trainingLoad.description")}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⏱️ {t("cardioOverview.understandingYourMetrics.recoveryTime.title")}</ThemedText>
          <ThemedText type="default">
            {t("cardioOverview.understandingYourMetrics.recoveryTime.description")}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🎂 {t("cardioOverview.understandingYourMetrics.fitnessAge.title")}</ThemedText>
          <ThemedText type="default">
            {t("cardioOverview.understandingYourMetrics.fitnessAge.description")}
          </ThemedText>
        </View>
      </Card>

      <GenesListCard areaId="cardioFitness" />

      {/* Tips Card */}
      <TipsList areaId={mainGoalId}/>
    </>
  );
}
