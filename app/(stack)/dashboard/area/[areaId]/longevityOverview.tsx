import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/ThemedText';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import MicrobiomeListCard from '@/components/ui/MicrobiomeListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';

export default function LongevityOverview({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.longevity }}>
        {t('longevityOverview.title')}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('longevityOverview.description')}
      </ThemedText>

      <WearableStatus />

      <InformationCardLink
        title={t('longevityOverview.pillars.title')}
        iconName="sparkles"
        iconColor={colors.area.longevity}
        items={[
          {
            key: 'sleepRecovery',
            icon: '😴',
            title: t('longevityOverview.pillars.sleepRecovery.title'),
            description: t('longevityOverview.pillars.sleepRecovery.description'),
          },
          {
            key: 'metabolicHealth',
            icon: '🫀',
            title: t('longevityOverview.pillars.metabolicHealth.title'),
            description: t('longevityOverview.pillars.metabolicHealth.description'),
          },
          {
            key: 'trainingCapacity',
            icon: '🏃',
            title: t('longevityOverview.pillars.trainingCapacity.title'),
            description: t('longevityOverview.pillars.trainingCapacity.description'),
          },
          {
            key: 'fasciaStrength',
            icon: '🦴',
            title: t('longevityOverview.pillars.fasciaStrength.title'),
            description: t('longevityOverview.pillars.fasciaStrength.description'),
          },
          {
            key: 'nervousSystemStress',
            icon: '🧘',
            title: t('longevityOverview.pillars.nervousSystemStress.title'),
            description: t('longevityOverview.pillars.nervousSystemStress.description'),
          },
          {
            key: 'inflammationMicrobiome',
            icon: '🌿',
            title: t('longevityOverview.pillars.inflammationMicrobiome.title'),
            description: t('longevityOverview.pillars.inflammationMicrobiome.description'),
          },
        ]}
      />

      <MicrobiomeListCard areaId="longevity" />

      <TipsList areaId={mainGoalId} />
    </>
  );
}
