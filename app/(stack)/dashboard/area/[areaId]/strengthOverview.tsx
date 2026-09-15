import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { StrengthRecoveryTrendsChart } from '@/components/metrics/StrengthRecoveryTrendsChart';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import MicrobiomeListCard from '@/components/ui/MicrobiomeListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';

export default function StrengthScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title" style={{ color: colors.area.strength }}>
        {t('strengthOverview.title')}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('strengthOverview.description')}
      </ThemedText>

      <WearableStatus />

      <StrengthRecoveryTrendsChart />

      {/* Protein Timing Card */}
      <Card title="Anabolic Window">
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⏰ Post-workout protein timing</ThemedText>
          <ThemedText type="default">
            Post-workout protein intake is most effective within 2-3 hours after training. Muscle protein synthesis remains elevated for 24-48 hours after
            resistance training.
          </ThemedText>
        </View>
        <View style={[globalStyles.topBorder, { borderTopColor: colors.borderLight }]}>
          <View style={globalStyles.infoSection}>
            <ThemedText type="title3">Recommended:</ThemedText>
            <ThemedText type="default">• 20-40g protein within 2h post-workout</ThemedText>
            <ThemedText type="default">• 1.6-2.2g/kg body weight daily total</ThemedText>
            <ThemedText type="default">• Leucine-rich sources (whey, eggs, meat)</ThemedText>
            <ThemedText type="default">• Distribute protein across 3-5 meals</ThemedText>
          </View>
        </View>
      </Card>

      {/* Information Card */}
      <Card title={t('strengthOverview.information.title')}>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">💪 {t('strengthOverview.information.trainingReadiness.title')}</ThemedText>
          <ThemedText type="default">{t('strengthOverview.information.trainingReadiness.description')}</ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">📊 {t('strengthOverview.information.trainingLoad.title')}</ThemedText>
          <ThemedText type="default">{t('strengthOverview.information.trainingLoad.description')}</ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⏱️ {t('strengthOverview.information.recoveryTime.title')}</ThemedText>
          <ThemedText type="default">{t('strengthOverview.information.recoveryTime.description')}</ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🛌 {t('strengthOverview.information.sleepMuscleGrowth.title')}</ThemedText>
          <ThemedText type="default">{t('strengthOverview.information.sleepMuscleGrowth.description')}</ThemedText>
        </View>
      </Card>

      {/* DNA & Gener som påverkar styrka */}
      <GenesListCard areaId="strength" />

      {/* Microbiome section */}
      <MicrobiomeListCard areaId="strength" />

      {/* Optimization Tips Card */}
      <TipsList areaId={mainGoalId} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
});
