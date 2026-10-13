import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { CardioTrendsChart } from '@/components/metrics/CardioTrendsChart';
import { ThemedText } from '@/components/ThemedText';
import GenesListCard from '@/components/ui/GenesListCard';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import MicrobiomeListCard from '@/components/ui/MicrobiomeListCard';
import RelatedAreasList from '@/components/ui/RelatedAreasList';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';

export default function CardioScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation('areas');

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.cardio }}>
        {t('cardioFitness.title')}
      </ThemedText>
      <ThemedText type="subtitle">{t('cardioFitness.description')}</ThemedText>
      <WearableStatus />

      <CardioTrendsChart />

      {/* VO2 Max explanation */}
      <InformationCardLink
        title={t('cardioFitness.information.title')}
        iconName="heart"
        iconColor={colors.area.cardio}
        items={[
          {
            key: 'vo2Max',
            icon: '🫁',
            title: t('cardioFitness.information.vo2Max.title'),
            description: t('cardioFitness.information.vo2Max.description'),
          },
          {
            key: 'vo2Health',
            icon: '❤️',
            title: t('cardioFitness.information.vo2Health.title'),
            description: t('cardioFitness.information.vo2Health.description'),
          },
          {
            key: 'easyRun',
            icon: '🏃',
            title: t('cardioFitness.information.easyRun.title'),
            description: t('cardioFitness.information.easyRun.description'),
          },
          {
            key: 'lactate',
            icon: '⚡',
            title: t('cardioFitness.information.lactate.title'),
            description: t('cardioFitness.information.lactate.description'),
          },
          {
            key: 'restingHeartRate',
            icon: '🫀',
            title: t('cardioFitness.information.restingHeartRate.title'),
            description: t('cardioFitness.information.restingHeartRate.description'),
          },
          {
            key: 'trainingLoad',
            icon: '💪',
            title: t('cardioFitness.information.trainingLoad.title'),
            description: t('cardioFitness.information.trainingLoad.description'),
          },
          {
            key: 'recoveryTime',
            icon: '⏱️',
            title: t('cardioFitness.information.recoveryTime.title'),
            description: t('cardioFitness.information.recoveryTime.description'),
          },
          {
            key: 'fitnessAge',
            icon: '🎂',
            title: t('cardioFitness.information.fitnessAge.title'),
            description: t('cardioFitness.information.fitnessAge.description'),
          },
        ]}
      />

      <RelatedAreasList areaId="cardioFitness" />

      <GenesListCard areaId="cardioFitness" />

      <MicrobiomeListCard areaId="cardioFitness" />

      {/* Tips Card */}
      <TipsList areaId={mainGoalId} />
    </>
  );
}
