import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { MindTrendsChart } from '@/components/metrics/MindTrendsChart';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';

export default function MindOverviewScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <ThemedText type="title" style={{ color: colors.accentStrong }}>
        {t('mindOverview.title')}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('mindOverview.description')}
      </ThemedText>

      <WearableStatus />

      {/* Overview card - Main mind metrics */}
      <MindTrendsChart />

      {/* Information card */}
      <Card title={t('mindOverview.informationCard.title')}>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🧠 {t('mindOverview.informationCard.focus.title')}</ThemedText>
          <ThemedText type="default">{t('mindOverview.informationCard.focus.description')}</ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">😰 {t('mindOverview.informationCard.stress.title')}</ThemedText>
          <ThemedText type="default">{t('mindOverview.informationCard.stress.description')}</ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🙂 {t('mindOverview.informationCard.mood.title')}</ThemedText>
          <ThemedText type="default">{t('mindOverview.informationCard.mood.description')}</ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">💤 {t('mindOverview.informationCard.sleepQuality.title')}</ThemedText>
          <ThemedText type="default">{t('mindOverview.informationCard.sleepQuality.description')}</ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🚶‍♂️ {t('mindOverview.informationCard.steps.title')}</ThemedText>
          <ThemedText type="default">{t('mindOverview.informationCard.steps.description')}</ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🧬 {t('mindOverview.informationCard.bdnf.title')}</ThemedText>
          <ThemedText type="default">{t('mindOverview.informationCard.bdnf.description')}</ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🧬 {t('mindOverview.informationCard.ketones.title')}</ThemedText>
          <ThemedText type="default">{t('mindOverview.informationCard.ketones.description')}</ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🧬 {t('mindOverview.informationCard.lactate.title')}</ThemedText>
          <ThemedText type="default">{t('mindOverview.informationCard.lactate.description')}</ThemedText>
        </View>
      </Card>

      <GenesListCard areaId="mind" />

      {/* Tips card */}
      <TipsList areaId={mainGoalId} />
    </>
  );
}
