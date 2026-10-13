import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { SleepTrendsChart } from '@/components/metrics/SleepTrendsChart';
import { ThemedText } from '@/components/ThemedText';
import GenesListCard from '@/components/ui/GenesListCard';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import RelatedAreasList from '@/components/ui/RelatedAreasList';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';

export default function SleepScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation('areas');

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.sleep }}>
        {t('sleepQuality.title')}
      </ThemedText>
      <ThemedText type="subtitle">{t('sleepQuality.description')}</ThemedText>
      <WearableStatus />

      <SleepTrendsChart />

      {/* Information card */}
      <InformationCardLink
        title={t('sleepQuality.information.title')}
        iconName="moon"
        iconColor={colors.area.sleep}
        items={[
          {
            key: 'stages',
            icon: '🌙',
            title: t('sleepQuality.information.stages.title'),
            description: t('sleepQuality.information.stages.description'),
          },
          {
            key: 'deepSleep',
            icon: '🧠',
            title: t('sleepQuality.information.deepSleep.title'),
            description: t('sleepQuality.information.deepSleep.description'),
          },
          {
            key: 'remSleep',
            icon: '💭',
            title: t('sleepQuality.information.remSleep.title'),
            description: t('sleepQuality.information.remSleep.description'),
          },
          {
            key: 'circadianRhythm',
            icon: '⏰',
            title: t('sleepQuality.information.circadianRhythm.title'),
            description: t('sleepQuality.information.circadianRhythm.description'),
          },
        ]}
      />

      {/* Related areas */}
      <RelatedAreasList areaId="sleepQuality" />

      {/* DNA & Gener som påverkar sömn */}
      <GenesListCard areaId="sleepQuality" />

      {/* Tips card */}
      <TipsList areaId={mainGoalId} />

      {/* RegisterMetricBottomSheet hanteras nu i SleepTrendsChart */}
    </>
  );
}
