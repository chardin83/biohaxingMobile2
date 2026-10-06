import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { DigestiveTrendsChart } from '@/components/metrics/DigestiveTrendsChart';
import { ThemedText } from '@/components/ThemedText';
import GenesListCard from '@/components/ui/GenesListCard';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import MicrobiomeListCard from '@/components/ui/MicrobiomeListCard';
import RelatedAreasList from '@/components/ui/RelatedAreasList';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';

export default function DigestiveScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.digestiveHealth }}>
        {t('digestiveOverview.title')}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('digestiveOverview.description')}
      </ThemedText>

      <WearableStatus />

      <DigestiveTrendsChart />

      {/* Info section: Understanding your metrics */}
      <InformationCardLink
        title={t('digestiveOverview.understandingYourMetrics.title')}
        iconName="microbiome"
        iconColor={colors.area.digestiveHealth}
        items={[
          {
            key: 'microbiome',
            icon: '🦠',
            title: t('digestiveOverview.understandingYourMetrics.microbiome.title'),
            description: t('digestiveOverview.understandingYourMetrics.microbiome.description'),
          },
          {
            key: 'stress',
            icon: '😌',
            title: t('digestiveOverview.understandingYourMetrics.stress.title'),
            description: t('digestiveOverview.understandingYourMetrics.stress.description'),
          },
          {
            key: 'sleep',
            icon: '💤',
            title: t('digestiveOverview.understandingYourMetrics.sleep.title'),
            description: t('digestiveOverview.understandingYourMetrics.sleep.description'),
          },
          {
            key: 'activity',
            icon: '🏃‍♂️',
            title: t('digestiveOverview.understandingYourMetrics.activity.title'),
            description: t('digestiveOverview.understandingYourMetrics.activity.description'),
          },
          {
            key: 'hydration',
            icon: '💧',
            title: t('digestiveOverview.understandingYourMetrics.hydration.title'),
            description: t('digestiveOverview.understandingYourMetrics.hydration.description'),
          },
        ]}
      />

      {/* Related areas */}
      <RelatedAreasList areaId="digestiveHealth" />

      {/* Microbiome section */}
      <MicrobiomeListCard areaId="digestiveHealth" />

      {/* DNA & Digestive Genetics */}
      <GenesListCard areaId="digestiveHealth" />

      {/* Tips card */}
      <TipsList areaId={mainGoalId} />
    </>
  );
}
