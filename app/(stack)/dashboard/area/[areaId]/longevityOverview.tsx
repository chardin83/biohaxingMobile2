import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import MicrobiomeListCard from '@/components/ui/MicrobiomeListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { useWearable } from '@/wearables/wearableProvider';

export default function LongevityOverview({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { status } = useWearable();

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.longevity }}>{t('longevityOverview.title')}</ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('longevityOverview.description')}
      </ThemedText>

      <WearableStatus status={status} />

      <Card title={t('longevityOverview.pillars.title')}>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">😴 {t('longevityOverview.pillars.sleepRecovery.title')}</ThemedText>
          <ThemedText type="default">{t('longevityOverview.pillars.sleepRecovery.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🫀 {t('longevityOverview.pillars.metabolicHealth.title')}</ThemedText>
          <ThemedText type="default">{t('longevityOverview.pillars.metabolicHealth.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🏃 {t('longevityOverview.pillars.trainingCapacity.title')}</ThemedText>
          <ThemedText type="default">{t('longevityOverview.pillars.trainingCapacity.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🦴 {t('longevityOverview.pillars.fasciaStrength.title')}</ThemedText>
          <ThemedText type="default">{t('longevityOverview.pillars.fasciaStrength.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🧘 {t('longevityOverview.pillars.nervousSystemStress.title')}</ThemedText>
          <ThemedText type="default">{t('longevityOverview.pillars.nervousSystemStress.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🌿 {t('longevityOverview.pillars.inflammationMicrobiome.title')}</ThemedText>
          <ThemedText type="default">{t('longevityOverview.pillars.inflammationMicrobiome.description')}</ThemedText>
        </View>
      </Card>

      <MicrobiomeListCard areaId="longevity" />

      <TipsList areaId={mainGoalId} />
    </>
  );
}
