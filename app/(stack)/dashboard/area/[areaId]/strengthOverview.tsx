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
  const { t } = useTranslation('areas');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title" style={{ color: colors.area.strength }}>
        {t('strength.title')}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('strength.description')}
      </ThemedText>

      <WearableStatus />

      <StrengthRecoveryTrendsChart />

      {/* Protein Timing Card */}
      <InformationCardLink
        title={t('strength.proteinTiming.title')}
        iconName="protein"
        iconColor={colors.area.strength}
        items={[
          {
            key: 'proteinTiming',
            icon: '⏰',
            title: t('strength.proteinTiming.proteinTiming.title'),
            description: t('strength.proteinTiming.proteinTiming.description'),
          },
          {
            key: 'recommendations',
            title: t('strength.proteinTiming.recommendations.title'),
            description: t('strength.proteinTiming.recommendations.description'),
          },
        ]}
      />

      {/* Information Card */}
      <InformationCardLink
        title={t('strength.information.title')}
        iconName="trainingGym"
        iconColor={colors.area.strength}
        items={[
          {
            key: 'trainingReadiness',
            icon: '💪',
            title: t('strength.information.trainingReadiness.title'),
            description: t('strength.information.trainingReadiness.description'),
          },
          {
            key: 'trainingLoad',
            icon: '📊',
            title: t('strength.information.trainingLoad.title'),
            description: t('strength.information.trainingLoad.description'),
          },
          {
            key: 'recoveryTime',
            icon: '⏱️',
            title: t('strength.information.recoveryTime.title'),
            description: t('strength.information.recoveryTime.description'),
          },
          {
            key: 'sleepMuscleGrowth',
            icon: '🛌',
            title: t('strength.information.sleepMuscleGrowth.title'),
            description: t('strength.information.sleepMuscleGrowth.description'),
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
