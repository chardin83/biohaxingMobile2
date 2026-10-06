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
  const { t } = useTranslation();
  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.nervousSystem }}>
        {t('nervousSystemOverview.title')}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('nervousSystemOverview.description')}
      </ThemedText>

      <WearableStatus />

      <NervousSystemStatusChart />

      {/* Information card */}
      <InformationCardLink
        title={t('nervousSystemOverview.informationCard.title')}
        iconName="chart"
        iconColor={colors.area.nervousSystem}
        items={[
          {
            key: 'recovery',
            icon: '🔄',
            title: t('nervousSystemOverview.informationCard.recovery.title'),
            description: t('nervousSystemOverview.informationCard.recovery.description'),
          },
          {
            key: 'hrv',
            icon: '❤️',
            title: t('nervousSystemOverview.informationCard.hrv.title'),
            description: t('nervousSystemOverview.informationCard.hrv.description'),
          },
          {
            key: 'nutrients',
            icon: '🥦',
            title: t('nervousSystemOverview.informationCard.nutrients.title'),
            description: t('nervousSystemOverview.informationCard.nutrients.description'),
          },
          {
            key: 'overstimulationScreenTime',
            icon: '📱',
            title: t('nervousSystemOverview.informationCard.overstimulationScreenTime.title'),
            description: t('nervousSystemOverview.informationCard.overstimulationScreenTime.description'),
          },
          {
            key: 'breathing',
            icon: '🫁',
            title: t('nervousSystemOverview.informationCard.breathing.title'),
            description: t('nervousSystemOverview.informationCard.breathing.description'),
          },
          {
            key: 'immuneInflammation',
            icon: '🛡️',
            title: t('nervousSystemOverview.informationCard.immuneInflammation.title'),
            description: t('nervousSystemOverview.informationCard.immuneInflammation.description'),
          },
          {
            key: 'gutVagusMicrobiome',
            icon: '🦠',
            title: t('nervousSystemOverview.informationCard.gutVagusMicrobiome.title'),
            description: t('nervousSystemOverview.informationCard.gutVagusMicrobiome.description'),
          },
          {
            key: 'trainingStrengthens',
            icon: '💪',
            title: t('nervousSystemOverview.informationCard.trainingStrengthens.title'),
            description: t('nervousSystemOverview.informationCard.trainingStrengthens.description'),
          },
          {
            key: 'trainingNutritionStress',
            icon: '🏃',
            title: t('nervousSystemOverview.informationCard.trainingNutritionStress.title'),
            description: t('nervousSystemOverview.informationCard.trainingNutritionStress.description'),
          },
        ]}
      />

      <GenesListCard areaId="nervousSystem" />

      {/* Tips card */}
      <TipsList areaId={mainGoalId} />
    </>
  );
}
