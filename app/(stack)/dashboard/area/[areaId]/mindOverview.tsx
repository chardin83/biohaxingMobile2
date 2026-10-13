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
  const { t } = useTranslation('areas');

  return (
    <>
      <ThemedText type="title" style={{ color: colors.accentStrong }}>
        {t('mind.title')}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('mind.description')}
      </ThemedText>

      <WearableStatus />

      {/* Overview card - Main mind metrics */}
      <MindTrendsChart />

      {/* Information card */}
      <InformationCardLink
        title={t('mind.information.title')}
        iconName="lightbulb"
        iconColor={colors.accentStrong}
        items={[
          { key: 'focus', icon: '🧠', title: t('mind.information.focus.title'), description: t('mind.information.focus.description') },
          {
            key: 'stress',
            icon: '😰',
            title: t('mind.information.stress.title'),
            description: t('mind.information.stress.description'),
          },
          { key: 'mood', icon: '🙂', title: t('mind.information.mood.title'), description: t('mind.information.mood.description') },
          {
            key: 'sleepQuality',
            icon: '💤',
            title: t('mind.information.sleepQuality.title'),
            description: t('mind.information.sleepQuality.description'),
          },
          { key: 'steps', icon: '🚶‍♂️', title: t('mind.information.steps.title'), description: t('mind.information.steps.description') },
          { key: 'bdnf', icon: '🧬', title: t('mind.information.bdnf.title'), description: t('mind.information.bdnf.description') },
          {
            key: 'ketones',
            icon: '🧬',
            title: t('mind.information.ketones.title'),
            description: t('mind.information.ketones.description'),
          },
          {
            key: 'lactate',
            icon: '🧬',
            title: t('mind.information.lactate.title'),
            description: t('mind.information.lactate.description'),
          },
        ]}
      />

      <GenesListCard areaId="mind" />

      {/* Tips card */}
      <TipsList areaId={mainGoalId} />
    </>
  );
}
