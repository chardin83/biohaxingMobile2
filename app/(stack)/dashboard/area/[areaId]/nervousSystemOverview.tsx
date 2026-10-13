import { useTheme } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { NervousSystemStatusChart } from '@/components/metrics/NervousSystemStatusChart';
import { ThemedText } from '@/components/ThemedText';
import GenesListCard from '@/components/ui/GenesListCard';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';

export default function NervousSystemScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation('areas');
  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.nervousSystem }}>
        {t('nervousSystem.title')}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('nervousSystem.description')}
      </ThemedText>

      <WearableStatus />

      <NervousSystemStatusChart />

      {/* Information card */}
      <InformationCardLink
        title={t('nervousSystem.information.title')}
        iconName="chart"
        iconColor={colors.area.nervousSystem}
        items={[
          {
            key: 'recovery',
            icon: '🔄',
            title: t('nervousSystem.information.recovery.title'),
            description: t('nervousSystem.information.recovery.description'),
          },
          {
            key: 'hrv',
            icon: '❤️',
            title: t('nervousSystem.information.hrv.title'),
            description: t('nervousSystem.information.hrv.description'),
          },
          {
            key: 'nutrients',
            icon: '🥦',
            title: t('nervousSystem.information.nutrients.title'),
            description: t('nervousSystem.information.nutrients.description'),
          },
          {
            key: 'overstimulationScreenTime',
            icon: '📱',
            title: t('nervousSystem.information.overstimulationScreenTime.title'),
            description: t('nervousSystem.information.overstimulationScreenTime.description'),
          },
          {
            key: 'breathing',
            icon: '🫁',
            title: t('nervousSystem.information.breathing.title'),
            description: t('nervousSystem.information.breathing.description'),
          },
          {
            key: 'immuneInflammation',
            icon: '🛡️',
            title: t('nervousSystem.information.immuneInflammation.title'),
            description: t('nervousSystem.information.immuneInflammation.description'),
          },
          {
            key: 'gutVagusMicrobiome',
            icon: '🦠',
            title: t('nervousSystem.information.gutVagusMicrobiome.title'),
            description: t('nervousSystem.information.gutVagusMicrobiome.description'),
          },
          {
            key: 'trainingStrengthens',
            icon: '💪',
            title: t('nervousSystem.information.trainingStrengthens.title'),
            description: t('nervousSystem.information.trainingStrengthens.description'),
          },
          {
            key: 'trainingNutritionStress',
            icon: '🏃',
            title: t('nervousSystem.information.trainingNutritionStress.title'),
            description: t('nervousSystem.information.trainingNutritionStress.description'),
          },
        ]}
      />

      <GenesListCard areaId="nervousSystem" />

      {/* Tips card */}
      <TipsList areaId={mainGoalId} />
    </>
  );
}
