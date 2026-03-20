import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { SleepConsistencyLabel } from '@/components/metrics/SleepConsistencyLabel';
import { SleepConsistencyMetric } from '@/components/metrics/SleepConsistencyMetric';
import { SleepTrendsChart } from '@/components/metrics/SleepTrendsChart';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { shouldSyncWearableData, syncWearableMetricsToStorage } from '@/wearables/syncMetricsToStorage';
import { useWearable } from '@/wearables/wearableProvider';



export default function SleepScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { adapter, status } = useWearable();
  const { upsertMetricEntries } = useStorage();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = React.useState(() => adapter.source !== 'none');
  const lastSyncAtRef = React.useRef(status.lastSyncAt);
  lastSyncAtRef.current = status.lastSyncAt;

  React.useEffect(() => {
    if (adapter.source === 'none') {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      if (shouldSyncWearableData(lastSyncAtRef.current)) {
        await syncWearableMetricsToStorage(adapter, upsertMetricEntries);
      }

      setLoading(false);
    })().catch(() => setLoading(false));
  }, [adapter, upsertMetricEntries]);

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.sleep }}>{t('sleepOverview.title')}</ThemedText>
      <ThemedText type="subtitle">{t('sleepOverview.description')}</ThemedText>
      <WearableStatus status={status} />

      {/* Overview card */}
      <Card title={t('sleepOverview.overview.title')}>
        {loading ? (
          <ThemedText type="caption">Loading…</ThemedText>
        ) : (
          <View style={globalStyles.row}>
            <SleepConsistencyLabel />

            <View style={globalStyles.col}>
              <SleepConsistencyMetric />
            </View>
          </View>
        )}
      </Card>
      
      <SleepTrendsChart />

      {/* Information card */}
      <Card title={t('sleepOverview.understandingSleep.title')}>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🌙 {t('sleepOverview.understandingSleep.stages.title')}</ThemedText>
          <ThemedText type="default">
            {t('sleepOverview.understandingSleep.stages.description')}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🧠 {t('sleepOverview.understandingSleep.deepSleep.title')}</ThemedText>
          <ThemedText type="default">
            {t('sleepOverview.understandingSleep.deepSleep.description')}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">💭 {t('sleepOverview.understandingSleep.remSleep.title')}</ThemedText>
          <ThemedText type="default">
            {t('sleepOverview.understandingSleep.remSleep.description')} 
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⏰ {t('sleepOverview.understandingSleep.circadianRhythm.title')}</ThemedText>
          <ThemedText type="default">
            {t('sleepOverview.understandingSleep.circadianRhythm.description')}
          </ThemedText>
        </View>
      </Card>

      {/* DNA & Gener som påverkar sömn */}
      <GenesListCard areaId="sleepQuality" />

      {/* Tips card */}
      <TipsList areaId={mainGoalId} />

      {/* RegisterMetricBottomSheet hanteras nu i SleepTrendsChart */}
    </>
  );
}

// const styles = StyleSheet.create(...)
