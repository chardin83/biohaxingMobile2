import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { HRVMetric } from '@/components/metrics/HRVMetric';
import { SleepConsistencyMetric } from '@/components/metrics/SleepConsistencyMetric';
import { SleepMetric } from '@/components/metrics/SleepMetric';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Error } from '@/components/ui/Error';
import GenesListCard from '@/components/ui/GenesListCard';
import { Loading } from '@/components/ui/Loading';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { SleepSummary, TimeRange } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

export default function StrengthScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { adapter, status } = useWearable();
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sleepData, setSleepData] = useState<SleepSummary[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const range: TimeRange = {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        };

        const sleep = await adapter.getSleep(range);

        setSleepData(sleep);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [adapter]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error error={error} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title" style={{ color: colors.area.strength }}>{t('strengthOverview.title')}</ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('strengthOverview.description')}
      </ThemedText>

      <WearableStatus status={status} />

      {/* Recovery Factors Card */}
      <Card title={t('strengthOverview.recoveryFactors.title')}>
        <View style={globalStyles.row}>
          <SleepMetric showDivider />
          <SleepConsistencyMetric sleepData={{ ...sleepData[0], targetBedtime: '' }} showDivider />
          <HRVMetric showDivider={false} />
        </View>
        <View style={globalStyles.infoSection}> 
          <ThemedText type='explainer' style={[globalStyles.topBorder, { borderColor: colors.borderLight}]}>
            {t('strengthOverview.recoveryFactors.explainer')}
          </ThemedText>
        </View>
      </Card>

      {/* Protein Timing Card */}
      <Card title="Anabolic Window">
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⏰ Post-workout protein timing</ThemedText>
          <ThemedText type='default'>
            Post-workout protein intake is most effective within 2-3 hours after training. Muscle protein synthesis
            remains elevated for 24-48 hours after resistance training.
          </ThemedText>
        </View>
        <View style={[globalStyles.topBorder, { borderTopColor: colors.borderLight}]}>  
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
          <ThemedText type="default">
            {t('strengthOverview.information.trainingReadiness.description')}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">📊 {t('strengthOverview.information.trainingLoad.title')}</ThemedText>
          <ThemedText type="default">
            {t('strengthOverview.information.trainingLoad.description')}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⏱️ {t('strengthOverview.information.recoveryTime.title')}</ThemedText>
          <ThemedText type="default">
            {t('strengthOverview.information.recoveryTime.description')}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🛌 {t('strengthOverview.information.sleepMuscleGrowth.title')}</ThemedText>
          <ThemedText type="default">
            {t('strengthOverview.information.sleepMuscleGrowth.description')}
          </ThemedText>
        </View>
      </Card>

      {/* DNA & Gener som påverkar styrka */}
      <GenesListCard areaId="strength" />

      {/* Optimization Tips Card */}
      <TipsList areaId={mainGoalId}/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
});
