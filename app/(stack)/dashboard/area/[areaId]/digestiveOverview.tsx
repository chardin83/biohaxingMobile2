import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { DigestiveTrendsChart } from '@/components/metrics/DigestiveTrendsChart';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import MicrobiomeListCard from '@/components/ui/MicrobiomeListCard';
import RelatedAreasList from '@/components/ui/RelatedAreasList';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { useWearable } from '@/wearables/wearableProvider';

export default function DigestiveScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { status } = useWearable();
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.digestiveHealth }}>{t('digestiveOverview.title')}</ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('digestiveOverview.description')}
      </ThemedText>

      <WearableStatus status={status} />

      <DigestiveTrendsChart />

      {/* Info section: Understanding your metrics */}
      <Card title={t('digestiveOverview.understandingYourMetrics.title')}>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🦠 {t('digestiveOverview.understandingYourMetrics.microbiome.title')}</ThemedText>
          <ThemedText type="default">
            {t('digestiveOverview.understandingYourMetrics.microbiome.description')}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">😌 {t('digestiveOverview.understandingYourMetrics.stress.title')}</ThemedText>
          <ThemedText type="default">
            {t('digestiveOverview.understandingYourMetrics.stress.description')}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">💤 {t('digestiveOverview.understandingYourMetrics.sleep.title')}</ThemedText>
          <ThemedText type="default">
            {t('digestiveOverview.understandingYourMetrics.sleep.description')}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🏃‍♂️ {t('digestiveOverview.understandingYourMetrics.activity.title')}</ThemedText>
          <ThemedText type="default">
            {t('digestiveOverview.understandingYourMetrics.activity.description')}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">💧 {t('digestiveOverview.understandingYourMetrics.hydration.title')}</ThemedText>
          <ThemedText type="default">
            {t('digestiveOverview.understandingYourMetrics.hydration.description')}
          </ThemedText>
        </View>
      </Card>

      {/* Related areas */}
      <RelatedAreasList areaId="digestiveHealth" />

      {/* Microbiome section */}
      <MicrobiomeListCard areaId="digestiveHealth" />

      {/* DNA & Digestive Genetics */}
      <GenesListCard areaId="digestiveHealth"  />

      {/* Tips card */}
      <TipsList areaId={mainGoalId}/>
    </>
  );
}


