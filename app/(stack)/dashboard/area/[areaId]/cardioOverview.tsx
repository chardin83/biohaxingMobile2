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
  const { t } = useTranslation();

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.cardio }}>
        {t('cardioOverview.title')}
      </ThemedText>
      <ThemedText type="subtitle">{t('cardioOverview.description')}</ThemedText>
      <WearableStatus />

      <CardioTrendsChart />

      {/* VO2 Max explanation */}
      <InformationCardLink
        title={t('cardioOverview.understandingYourMetrics.title')}
        iconName="heart"
        iconColor={colors.area.cardio}
        items={[
          {
            key: 'vo2Max',
            icon: '🫁',
            title: t('cardioOverview.understandingYourMetrics.vo2Max.title'),
            description: t('cardioOverview.understandingYourMetrics.vo2Max.description'),
          },
          {
            key: 'vo2Health',
            icon: '❤️',
            title: t('cardioOverview.understandingYourMetrics.vo2Health.title'),
            description: t('cardioOverview.understandingYourMetrics.vo2Health.description'),
          },
          {
            key: 'easyRun',
            icon: '🏃',
            title: t('cardioOverview.understandingYourMetrics.easyRun.title'),
            description: t('cardioOverview.understandingYourMetrics.easyRun.description'),
          },
          {
            key: 'lactate',
            icon: '⚡',
            title: t('cardioOverview.understandingYourMetrics.lactate.title'),
            description: t('cardioOverview.understandingYourMetrics.lactate.description'),
          },
          {
            key: 'restingHeartRate',
            icon: '🫀',
            title: t('cardioOverview.understandingYourMetrics.restingHeartRate.title'),
            description: t('cardioOverview.understandingYourMetrics.restingHeartRate.description'),
          },
          {
            key: 'trainingLoad',
            icon: '💪',
            title: t('cardioOverview.understandingYourMetrics.trainingLoad.title'),
            description: t('cardioOverview.understandingYourMetrics.trainingLoad.description'),
          },
          {
            key: 'recoveryTime',
            icon: '⏱️',
            title: t('cardioOverview.understandingYourMetrics.recoveryTime.title'),
            description: t('cardioOverview.understandingYourMetrics.recoveryTime.description'),
          },
          {
            key: 'fitnessAge',
            icon: '🎂',
            title: t('cardioOverview.understandingYourMetrics.fitnessAge.title'),
            description: t('cardioOverview.understandingYourMetrics.fitnessAge.description'),
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
