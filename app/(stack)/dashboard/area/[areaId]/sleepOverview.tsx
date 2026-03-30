import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { SleepTrendsChart } from '@/components/metrics/SleepTrendsChart';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import { PressableCard } from '@/components/ui/PressableCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { shouldSyncWearableData, syncWearableMetricsToStorage } from '@/wearables/syncMetricsToStorage';
import { useWearable } from '@/wearables/wearableProvider';



export default function SleepScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { adapter, status } = useWearable();
  const { upsertMetricEntries } = useStorage();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const lastSyncAtRef = React.useRef(status.lastSyncAt);
  lastSyncAtRef.current = status.lastSyncAt;

  React.useEffect(() => {
    if (adapter.source === 'none') return;
    (async () => {
      if (shouldSyncWearableData(lastSyncAtRef.current)) {
        await syncWearableMetricsToStorage(adapter, upsertMetricEntries);
      }
    })().catch(() => {});
  }, [adapter, upsertMetricEntries]);

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.sleep }}>{t('sleepOverview.title')}</ThemedText>
      <ThemedText type="subtitle">{t('sleepOverview.description')}</ThemedText>
      <WearableStatus status={status} />

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

      {/* Related areas */}
      <Card title={t('sleepOverview.relatedAreas.title')}>
        <PressableCard
          onPress={() => {
            router.push({
              pathname: '/dashboard/area/[areaId]',
              params: { areaId: 'nervousSystem' },
            });
          }}
        >
          <ThemedText type="title3">
            {t('sleepOverview.relatedAreas.nervousSystem.title')}
          </ThemedText>
          <ThemedText type="default">
            {t('sleepOverview.relatedAreas.nervousSystem.description')}
          </ThemedText>
        </PressableCard>

        <PressableCard
          style={styles.relatedAreaCardSpacing}
          onPress={() => {
            router.push({
              pathname: '/dashboard/area/[areaId]',
              params: { areaId: 'digestiveHealth' },
            });
          }}
        >
          <ThemedText type="title3">
            {t('sleepOverview.relatedAreas.digestiveHealth.title')}
          </ThemedText>
          <ThemedText type="default">
            {t('sleepOverview.relatedAreas.digestiveHealth.description')}
          </ThemedText>
        </PressableCard>

        <PressableCard
          style={styles.relatedAreaCardSpacing}
          onPress={() => {
            router.push({
              pathname: '/dashboard/area/[areaId]',
              params: { areaId: 'energy' },
            });
          }}
        >
          <ThemedText type="title3">
            {t('sleepOverview.relatedAreas.energy.title')}
          </ThemedText>
          <ThemedText type="default">
            {t('sleepOverview.relatedAreas.energy.description')}
          </ThemedText>
        </PressableCard>
      </Card>

      {/* DNA & Gener som påverkar sömn */}
      <GenesListCard areaId="sleepQuality" />

      {/* Tips card */}
      <TipsList areaId={mainGoalId} />

      {/* RegisterMetricBottomSheet hanteras nu i SleepTrendsChart */}
    </>
  );
}

const styles = StyleSheet.create({
  relatedAreaCardSpacing: {
    marginTop: 12,
  },
});
