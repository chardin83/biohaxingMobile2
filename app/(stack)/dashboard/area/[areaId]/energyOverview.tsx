import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { EnergyProductionCharts } from '@/components/metrics/EnergyProductionCharts';
import { TodaysActivityCharts } from '@/components/metrics/TodaysActivityCharts';
import { ThemedText } from '@/components/ThemedText';
import GenesListCard from '@/components/ui/GenesListCard';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import MicrobiomeListCard from '@/components/ui/MicrobiomeListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';

export default function EnergyScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.energy }}>
        {t('energyOverview.title')}
      </ThemedText>
      <ThemedText type="subtitle">{t('energyOverview.description')}</ThemedText>
      <WearableStatus />

      {/* Energy Production Factors */}
      <EnergyProductionCharts />

      {/* Activity Tracking */}
      <TodaysActivityCharts />

      {/* Mitochondrial Health Information */}
      <InformationCardLink
        title={t('energyOverview.mitochondrialHealth.title')}
        iconName="mitochondrialHealth"
        iconColor={colors.area.energy}
        items={[
          {
            key: 'powerhouses',
            icon: '🔬',
            title: t('energyOverview.mitochondrialHealth.powerhouses.title'),
            description: t('energyOverview.mitochondrialHealth.powerhouses.description'),
          },
          {
            key: 'atpProduction',
            icon: '⚡',
            title: t('energyOverview.mitochondrialHealth.atpProduction.title'),
            description: t('energyOverview.mitochondrialHealth.atpProduction.description'),
          },
          {
            key: 'mitochondrialBiogenesis',
            icon: '🧬',
            title: t('energyOverview.mitochondrialHealth.mitochondrialBiogenesis.title'),
            description: t('energyOverview.mitochondrialHealth.mitochondrialBiogenesis.description'),
          },
          {
            key: 'oxidativeStress',
            icon: '🛡️',
            title: t('energyOverview.mitochondrialHealth.oxidativeStress.title'),
            description: t('energyOverview.mitochondrialHealth.oxidativeStress.description'),
          },
          {
            key: 'nadDecline',
            icon: '⏰',
            title: t('energyOverview.mitochondrialHealth.nadDecline.title'),
            description: t('energyOverview.mitochondrialHealth.nadDecline.description'),
          },
          {
            key: 'mitophagy',
            icon: '🔄',
            title: t('energyOverview.mitochondrialHealth.mitophagy.title'),
            description: t('energyOverview.mitochondrialHealth.mitophagy.description'),
          },
          {
            key: 'insulinResistance',
            icon: '🍬',
            title: t('energyOverview.mitochondrialHealth.insulinResistance.title'),
            description: t('energyOverview.mitochondrialHealth.insulinResistance.description'),
          },
          {
            key: 'chronicStress',
            icon: '⚠️',
            title: t('energyOverview.mitochondrialHealth.chronicStress.title'),
            description: t('energyOverview.mitochondrialHealth.chronicStress.description'),
          },
          {
            key: 'metabolicFlexibility',
            icon: '🔄',
            title: t('energyOverview.mitochondrialHealth.metabolicFlexibility.title'),
            description: t('energyOverview.mitochondrialHealth.metabolicFlexibility.description'),
          },
          {
            key: 'resistantStarch',
            icon: '🌾',
            title: t('energyOverview.mitochondrialHealth.resistantStarch.title'),
            description: t('energyOverview.mitochondrialHealth.resistantStarch.description'),
          },
          {
            key: 'lowCarbHighIntensityTraining',
            icon: '🏃',
            title: t('energyOverview.mitochondrialHealth.lowCarbHighIntensityTraining.title'),
            description: t('energyOverview.mitochondrialHealth.lowCarbHighIntensityTraining.description'),
          },
        ]}
      />

      {/* DNA & Mitochondria Genetics */}
      <GenesListCard areaId="energy" />

      <MicrobiomeListCard areaId="energy" />

      {/* Tips Card */}
      <TipsList areaId={mainGoalId} />
    </>
  );
}
