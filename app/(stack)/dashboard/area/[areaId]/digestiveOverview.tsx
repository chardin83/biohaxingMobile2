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
  const { t } = useTranslation('areas');

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.digestiveHealth }}>
        {t('digestiveHealth.title')}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('digestiveHealth.description')}
      </ThemedText>

      <WearableStatus />

      <DigestiveTrendsChart />

      {/* Info section: Understanding your metrics */}
      <InformationCardLink
        title={t('digestiveHealth.information.title')}
        iconName="microbiome"
        iconColor={colors.area.digestiveHealth}
        items={[
          {
            key: 'microbiome',
            icon: '🦠',
            title: t('digestiveHealth.information.microbiome.title'),
            description: t('digestiveHealth.information.microbiome.description'),
          },
          {
            key: 'stress',
            icon: '😌',
            title: t('digestiveHealth.information.stress.title'),
            description: t('digestiveHealth.information.stress.description'),
          },
          {
            key: 'sleep',
            icon: '💤',
            title: t('digestiveHealth.information.sleep.title'),
            description: t('digestiveHealth.information.sleep.description'),
          },
          {
            key: 'activity',
            icon: '🏃‍♂️',
            title: t('digestiveHealth.information.activity.title'),
            description: t('digestiveHealth.information.activity.description'),
          },
          {
            key: 'hydration',
            icon: '💧',
            title: t('digestiveHealth.information.hydration.title'),
            description: t('digestiveHealth.information.hydration.description'),
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
