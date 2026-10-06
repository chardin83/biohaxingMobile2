import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { MindTrendsChart } from '@/components/metrics/MindTrendsChart';
import { ThemedText } from '@/components/ThemedText';
import GenesListCard from '@/components/ui/GenesListCard';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
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
      <InformationCardLink
        title={t('mindOverview.informationCard.title')}
        iconName="lightbulb"
        iconColor={colors.accentStrong}
        items={[
          { key: 'focus', icon: '🧠', title: t('mindOverview.informationCard.focus.title'), description: t('mindOverview.informationCard.focus.description') },
          {
            key: 'stress',
            icon: '😰',
            title: t('mindOverview.informationCard.stress.title'),
            description: t('mindOverview.informationCard.stress.description'),
          },
          { key: 'mood', icon: '🙂', title: t('mindOverview.informationCard.mood.title'), description: t('mindOverview.informationCard.mood.description') },
          {
            key: 'sleepQuality',
            icon: '💤',
            title: t('mindOverview.informationCard.sleepQuality.title'),
            description: t('mindOverview.informationCard.sleepQuality.description'),
          },
          { key: 'steps', icon: '🚶‍♂️', title: t('mindOverview.informationCard.steps.title'), description: t('mindOverview.informationCard.steps.description') },
          { key: 'bdnf', icon: '🧬', title: t('mindOverview.informationCard.bdnf.title'), description: t('mindOverview.informationCard.bdnf.description') },
          {
            key: 'ketones',
            icon: '🧬',
            title: t('mindOverview.informationCard.ketones.title'),
            description: t('mindOverview.informationCard.ketones.description'),
          },
          {
            key: 'lactate',
            icon: '🧬',
            title: t('mindOverview.informationCard.lactate.title'),
            description: t('mindOverview.informationCard.lactate.description'),
          },
        ]}
      />

      <GenesListCard areaId="mind" />

      {/* Tips card */}
      <TipsList areaId={mainGoalId} />
    </>
  );
}
