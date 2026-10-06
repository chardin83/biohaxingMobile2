import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { StrengthRecoveryTrendsChart } from '@/components/metrics/StrengthRecoveryTrendsChart';
import { ThemedText } from '@/components/ThemedText';
import GenesListCard from '@/components/ui/GenesListCard';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
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
      <InformationCardLink
        title="Anabolic Window"
        iconName="protein"
        iconColor={colors.area.strength}
        items={[
          {
            key: 'proteinTiming',
            icon: '⏰',
            title: 'Post-workout protein timing',
            description:
              'Post-workout protein intake is most effective within 2-3 hours after training. Muscle protein synthesis remains elevated for 24-48 hours after resistance training.',
          },
          {
            key: 'recommendations',
            title: 'Recommended:',
            description:
              '• 20-40g protein within 2h post-workout\n• 1.6-2.2g/kg body weight daily total\n• Leucine-rich sources (whey, eggs, meat)\n• Distribute protein across 3-5 meals',
          },
        ]}
      />

      {/* Information Card */}
      <InformationCardLink
        title={t('strengthOverview.information.title')}
        iconName="trainingGym"
        iconColor={colors.area.strength}
        items={[
          {
            key: 'trainingReadiness',
            icon: '💪',
            title: t('strengthOverview.information.trainingReadiness.title'),
            description: t('strengthOverview.information.trainingReadiness.description'),
          },
          {
            key: 'trainingLoad',
            icon: '📊',
            title: t('strengthOverview.information.trainingLoad.title'),
            description: t('strengthOverview.information.trainingLoad.description'),
          },
          {
            key: 'recoveryTime',
            icon: '⏱️',
            title: t('strengthOverview.information.recoveryTime.title'),
            description: t('strengthOverview.information.recoveryTime.description'),
          },
          {
            key: 'sleepMuscleGrowth',
            icon: '🛌',
            title: t('strengthOverview.information.sleepMuscleGrowth.title'),
            description: t('strengthOverview.information.sleepMuscleGrowth.description'),
          },
        ]}
      />

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
