import { useTheme } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { NervousSystemStatusChart } from '@/components/metrics/NervousSystemStatusChart';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
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
      <Card title={t('nervousSystemOverview.informationCard.title')}>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">❤️ {t('nervousSystemOverview.informationCard.hrv.title')}</ThemedText>
          <ThemedText type="default">{t('nervousSystemOverview.informationCard.hrv.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🥦 {t('nervousSystemOverview.informationCard.nutrients.title')}</ThemedText>
          <ThemedText type="default">{t('nervousSystemOverview.informationCard.nutrients.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">📱 {t('nervousSystemOverview.informationCard.overstimulationScreenTime.title')}</ThemedText>
          <ThemedText type="default">{t('nervousSystemOverview.informationCard.overstimulationScreenTime.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🫁 {t('nervousSystemOverview.informationCard.breathing.title')}</ThemedText>
          <ThemedText type="default">{t('nervousSystemOverview.informationCard.breathing.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🛡️ {t('nervousSystemOverview.informationCard.immuneInflammation.title')}</ThemedText>
          <ThemedText type="default">{t('nervousSystemOverview.informationCard.immuneInflammation.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🦠 {t('nervousSystemOverview.informationCard.gutVagusMicrobiome.title')}</ThemedText>
          <ThemedText type="default">{t('nervousSystemOverview.informationCard.gutVagusMicrobiome.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">💪 {t('nervousSystemOverview.informationCard.trainingStrengthens.title')}</ThemedText>
          <ThemedText type="default">{t('nervousSystemOverview.informationCard.trainingStrengthens.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🏃 {t('nervousSystemOverview.informationCard.trainingNutritionStress.title')}</ThemedText>
          <ThemedText type="default">{t('nervousSystemOverview.informationCard.trainingNutritionStress.description')}</ThemedText>
        </View>
      </Card>

      <GenesListCard areaId="nervousSystem" />

      {/* Tips card */}
      <TipsList areaId={mainGoalId} />
    </>
  );
}
