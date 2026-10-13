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
  const { t } = useTranslation('areas');

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.energy }}>
        {t('energy.title')}
      </ThemedText>
      <ThemedText type="subtitle">{t('energy.description')}</ThemedText>
      <WearableStatus />

      {/* Energy Production Factors */}
      <EnergyProductionCharts />

      {/* Activity Tracking */}
      <TodaysActivityCharts />

      {/* Mitochondrial Health Information */}
      <InformationCardLink
        title={t('energy.information.title')}
        iconName="mitochondrialHealth"
        iconColor={colors.area.energy}
        items={[
          {
            key: 'powerhouses',
            icon: '🔬',
            title: t('energy.information.powerhouses.title'),
            description: t('energy.information.powerhouses.description'),
          },
          {
            key: 'atpProduction',
            icon: '⚡',
            title: t('energy.information.atpProduction.title'),
            description: t('energy.information.atpProduction.description'),
          },
          {
            key: 'mitochondrialBiogenesis',
            icon: '🧬',
            title: t('energy.information.mitochondrialBiogenesis.title'),
            description: t('energy.information.mitochondrialBiogenesis.description'),
          },
          {
            key: 'oxidativeStress',
            icon: '🛡️',
            title: t('energy.information.oxidativeStress.title'),
            description: t('energy.information.oxidativeStress.description'),
          },
          {
            key: 'nadDecline',
            icon: '⏰',
            title: t('energy.information.nadDecline.title'),
            description: t('energy.information.nadDecline.description'),
          },
          {
            key: 'mitophagy',
            icon: '🔄',
            title: t('energy.information.mitophagy.title'),
            description: t('energy.information.mitophagy.description'),
          },
          {
            key: 'insulinResistance',
            icon: '🍬',
            title: t('energy.information.insulinResistance.title'),
            description: t('energy.information.insulinResistance.description'),
          },
          {
            key: 'chronicStress',
            icon: '⚠️',
            title: t('energy.information.chronicStress.title'),
            description: t('energy.information.chronicStress.description'),
          },
          {
            key: 'metabolicFlexibility',
            icon: '🔄',
            title: t('energy.information.metabolicFlexibility.title'),
            description: t('energy.information.metabolicFlexibility.description'),
          },
          {
            key: 'resistantStarch',
            icon: '🌾',
            title: t('energy.information.resistantStarch.title'),
            description: t('energy.information.resistantStarch.description'),
          },
          {
            key: 'lowCarbHighIntensityTraining',
            icon: '🏃',
            title: t('energy.information.lowCarbHighIntensityTraining.title'),
            description: t('energy.information.lowCarbHighIntensityTraining.description'),
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
