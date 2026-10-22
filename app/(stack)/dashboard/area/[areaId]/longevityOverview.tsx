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
  const { t } = useTranslation('areas');
  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.longevity }}>
        {t('longevity.title')}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('longevity.description')}
      </ThemedText>

      <WearableStatus />

      <InformationCardLink
        title={t('longevity.information.title')}
        iconName="sparkles"
        iconColor={colors.area.longevity}
        items={[
          {
            key: 'sleepRecovery',
            icon: '😴',
            title: t('longevity.information.sleepRecovery.title'),
            description: t('longevity.information.sleepRecovery.description'),
          },
          {
            key: 'metabolicHealth',
            icon: '🫀',
            title: t('longevity.information.metabolicHealth.title'),
            description: t('longevity.information.metabolicHealth.description'),
          },
          {
            key: 'trainingCapacity',
            icon: '🏃',
            title: t('longevity.information.trainingCapacity.title'),
            description: t('longevity.information.trainingCapacity.description'),
          },
          {
            key: 'musclePreservation',
            icon: '💪',
            title: t('longevity.information.musclePreservation.title'),
            description: t('longevity.information.musclePreservation.description'),
          },
          {
            key: 'fasciaStrength',
            icon: '🦴',
            title: t('longevity.information.fasciaStrength.title'),
            description: t('longevity.information.fasciaStrength.description'),
          },
          {
            key: 'nervousSystemStress',
            icon: '🧘',
            title: t('longevity.information.nervousSystemStress.title'),
            description: t('longevity.information.nervousSystemStress.description'),
          },
          {
            key: 'inflammationMicrobiome',
            icon: '🌿',
            title: t('longevity.information.inflammationMicrobiome.title'),
            description: t('longevity.information.inflammationMicrobiome.description'),
          },
        ]}
      />

      <MicrobiomeListCard areaId="longevity" />

      <TipsList areaId={mainGoalId} />
    </>
  );
}
