import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { CardioTrendsChart } from '@/components/metrics/CardioTrendsChart';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import MicrobiomeListCard from '@/components/ui/MicrobiomeListCard';
import { PressableCard } from '@/components/ui/PressableCard';
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
          <ThemedText type="title3">❤️ {t("cardioOverview.understandingYourMetrics.vo2Health.title")}</ThemedText>
          <ThemedText type="default">
            {t("cardioOverview.understandingYourMetrics.vo2Health.description")}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🏃 {t("cardioOverview.understandingYourMetrics.easyRun.title")}</ThemedText>
          <ThemedText type="default">
            {t("cardioOverview.understandingYourMetrics.easyRun.description")}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⚡ {t("cardioOverview.understandingYourMetrics.lactate.title")}</ThemedText>
          <ThemedText type="default">
            {t("cardioOverview.understandingYourMetrics.lactate.description")}
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

      <Card title={t('cardioOverview.relatedAreas.title')}>
        <PressableCard
          onPress={() => {
            router.push({
              pathname: '/dashboard/area/[areaId]',
              params: { areaId: 'digestiveHealth' },
            });
          }}
        >
          <ThemedText type="title3">
            {t('cardioOverview.relatedAreas.digestiveHealth.title')}
          </ThemedText>
          <ThemedText type="default">
            {t('cardioOverview.relatedAreas.digestiveHealth.description')}
          </ThemedText>
        </PressableCard>

        <PressableCard
          style={styles.relatedAreaCardSpacing}
          onPress={() => {
            router.push({
              pathname: '/dashboard/area/[areaId]',
              params: { areaId: 'nervousSystem' },
            });
          }}
        >
          <ThemedText type="title3">
            {t('cardioOverview.relatedAreas.nervousSystem.title')}
          </ThemedText>
          <ThemedText type="default">
            {t('cardioOverview.relatedAreas.nervousSystem.description')}
          </ThemedText>
        </PressableCard>

        <PressableCard
          style={styles.relatedAreaCardSpacing}
          onPress={() => {
            router.push({
              pathname: '/dashboard/area/[areaId]',
              params: { areaId: 'sleepQuality' },
            });
          }}
        >
          <ThemedText type="title3">
            {t('cardioOverview.relatedAreas.sleepQuality.title')}
          </ThemedText>
          <ThemedText type="default">
            {t('cardioOverview.relatedAreas.sleepQuality.description')}
          </ThemedText>
        </PressableCard>
      </Card>

      <GenesListCard areaId="cardioFitness" />

      <MicrobiomeListCard areaId="cardioFitness" />

      {/* Tips Card */}
      <TipsList areaId={mainGoalId}/>
    </>
  );
}

const styles = StyleSheet.create({
  relatedAreaCardSpacing: {
    marginTop: 12,
  },
});
