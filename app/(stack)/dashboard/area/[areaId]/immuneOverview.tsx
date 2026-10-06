import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ImmuneStatusChart } from '@/components/metrics/ImmuneStatusChart';
import { ThemedText } from '@/components/ThemedText';
import GenesListCard from '@/components/ui/GenesListCard';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import MicrobiomeListCard from '@/components/ui/MicrobiomeListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';

export default function ImmuneScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.immuneSystem }}>
        {t('immuneOverview.title')}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('immuneOverview.description')}
      </ThemedText>

      <WearableStatus />

      <ImmuneStatusChart />

      {/* Information card */}
      <InformationCardLink
        title={t('immuneOverview.whyTheseMetricsMatter.title')}
        iconName="privacy"
        iconColor={colors.area.immuneSystem}
        items={[
          {
            key: 'recovery',
            icon: '🔄',
            title: t('immuneOverview.whyTheseMetricsMatter.recovery.title'),
            description: t('immuneOverview.whyTheseMetricsMatter.recovery.description'),
          },
          {
            key: 'sleep',
            icon: '💤',
            title: t('immuneOverview.whyTheseMetricsMatter.sleep.title'),
            description:
              t('immuneOverview.whyTheseMetricsMatter.sleep.description') +
              ' Adequate sleep is crucial for immune function. During sleep, the body produces cytokines that help fight infection and inflammation.',
          },
          {
            key: 'stress',
            icon: '😌',
            title: t('immuneOverview.whyTheseMetricsMatter.stress.title'),
            description: t('immuneOverview.whyTheseMetricsMatter.stress.description'),
          },
          {
            key: 'hrv',
            icon: '❤️',
            title: t('immuneOverview.whyTheseMetricsMatter.hrv.title'),
            description: t('immuneOverview.whyTheseMetricsMatter.hrv.description'),
          },
          {
            key: 'restingHeartRate',
            icon: '🫀',
            title: t('immuneOverview.whyTheseMetricsMatter.restingHeartRate.title'),
            description: t('immuneOverview.whyTheseMetricsMatter.restingHeartRate.description'),
          },
          {
            key: 'microbiomeButyrate',
            icon: '🦠',
            title: t('immuneOverview.whyTheseMetricsMatter.microbiomeButyrate.title'),
            description: t('immuneOverview.whyTheseMetricsMatter.microbiomeButyrate.description'),
          },
        ]}
      />

      {/* DNA & Immunförsvar Genetics */}
      <GenesListCard areaId="immune" />

      {/* Microbiome section */}
      <MicrobiomeListCard areaId="immune" />

      {/* Tips card */}
      <TipsList areaId={mainGoalId} />
    </>
  );
}
