import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ImmuneStatusChart } from '@/components/metrics/ImmuneStatusChart';
import { ThemedText } from '@/components/ThemedText';
import GenesListCard from '@/components/ui/GenesListCard';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import MicrobiomeListCard from '@/components/ui/MicrobiomeListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';

export default function ImmuneScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation('areas');

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.immuneSystem }}>
        {t('immuneSupport.title')}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('immuneSupport.description')}
      </ThemedText>

      <WearableStatus />

      <ImmuneStatusChart />

      {/* Information card */}
      <InformationCardLink
        title={t('immuneSupport.information.title')}
        iconName="privacy"
        iconColor={colors.area.immuneSystem}
        items={[
          {
            key: 'recovery',
            icon: '🔄',
            title: t('immuneSupport.information.recovery.title'),
            description: t('immuneSupport.information.recovery.description'),
          },
          {
            key: 'sleep',
            icon: '💤',
            title: t('immuneSupport.information.sleep.title'),
            description: t('immuneSupport.information.sleep.description'),
          },
          {
            key: 'stress',
            icon: '😌',
            title: t('immuneSupport.information.stress.title'),
            description: t('immuneSupport.information.stress.description'),
          },
          {
            key: 'hrv',
            icon: '❤️',
            title: t('immuneSupport.information.hrv.title'),
            description: t('immuneSupport.information.hrv.description'),
          },
          {
            key: 'restingHeartRate',
            icon: '🫀',
            title: t('immuneSupport.information.restingHeartRate.title'),
            description: t('immuneSupport.information.restingHeartRate.description'),
          },
          {
            key: 'microbiomeButyrate',
            icon: '🦠',
            title: t('immuneSupport.information.microbiomeButyrate.title'),
            description: t('immuneSupport.information.microbiomeButyrate.description'),
          },
        ]}
      />

      {/* DNA & Immunförsvar Genetics */}
      <GenesListCard areaId="immune" />

      {/* Microbiome section */}
      <MicrobiomeListCard areaId="immune" />

      {/* Tips card */}
      <TipsList areaId={mainGoalId} />
    </>
  );
}
