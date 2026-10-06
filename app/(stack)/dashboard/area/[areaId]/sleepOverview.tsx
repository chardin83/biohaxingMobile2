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
  const { t } = useTranslation();

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.sleep }}>
        {t('sleepOverview.title')}
      </ThemedText>
      <ThemedText type="subtitle">{t('sleepOverview.description')}</ThemedText>
      <WearableStatus />

      <SleepTrendsChart />

      {/* Information card */}
      <InformationCardLink
        title={t('sleepOverview.understandingSleep.title')}
        iconName="moon"
        iconColor={colors.area.sleep}
        items={[
          {
            key: 'stages',
            icon: '🌙',
            title: t('sleepOverview.understandingSleep.stages.title'),
            description: t('sleepOverview.understandingSleep.stages.description'),
          },
          {
            key: 'deepSleep',
            icon: '🧠',
            title: t('sleepOverview.understandingSleep.deepSleep.title'),
            description: t('sleepOverview.understandingSleep.deepSleep.description'),
          },
          {
            key: 'remSleep',
            icon: '💭',
            title: t('sleepOverview.understandingSleep.remSleep.title'),
            description: t('sleepOverview.understandingSleep.remSleep.description'),
          },
          {
            key: 'circadianRhythm',
            icon: '⏰',
            title: t('sleepOverview.understandingSleep.circadianRhythm.title'),
            description: t('sleepOverview.understandingSleep.circadianRhythm.description'),
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
