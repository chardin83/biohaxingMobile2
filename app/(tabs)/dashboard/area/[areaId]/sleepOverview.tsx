import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { SleepConsistencyMetric } from '@/components/metrics/SleepConsistencyMetric';
import { SleepMetric } from '@/components/metrics/SleepMetric';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { SleepSummary } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export default function SleepScreen({ mainGoalId }: { mainGoalId: string }) {
  const { adapter, status } = useWearable();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = React.useState(true);
  const [sleepData, setSleepData] = React.useState<SleepSummary[]>([]);
  const [consistencyLabel, setConsistencyLabel] = React.useState<string>('-');
  const [deepSleepMinutes, setDeepSleepMinutes] = React.useState<number | null>(null);
  const [remSleepMinutes, setRemSleepMinutes] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const range = { start: daysAgo(7), end: new Date().toISOString() };

      const sleeps = await adapter.getSleep(range);
      setSleepData(sleeps);

      // V1: visa senaste nattens duration
      const latest = sleeps[sleeps.length - 1];
      setDeepSleepMinutes(latest?.stages?.deepMinutes ?? null);
      setRemSleepMinutes(latest?.stages?.remMinutes ?? null);

      // "consistency" i V1 kan vara väldigt enkel:
      setConsistencyLabel(sleeps.length >= 6 ? t('general.moderate') : t('general.low'));

      setLoading(false);
    })().catch(() => setLoading(false));
  }, [adapter, t]);

  return (
    <>
      <ThemedText type="title">{t('sleepOverview.title')}</ThemedText>
      <ThemedText type="subtitle">{t('sleepOverview.description')}</ThemedText>
      <WearableStatus status={status} />

      {/* Overview card */}
      <Card title={t('sleepOverview.overview.title')}>
        {loading ? (
          <ThemedText type="caption">Loading…</ThemedText>
        ) : (
          <View style={globalStyles.row}>
            <SleepMetric sleepData={sleepData} showDivider />

            <View
              style={[globalStyles.col, globalStyles.colWithDivider, { borderRightColor: colors.borderLight ?? colors.border }]}
            >
              <ThemedText type="label">{t('sleepOverview.overview.consistency.title')}</ThemedText>
              <ThemedText type="title3">{consistencyLabel}</ThemedText>
              <ThemedText type="caption">{t('sleepOverview.overview.consistency.pattern')}</ThemedText>
            </View>

            <View style={globalStyles.col}>
              <SleepConsistencyMetric sleepData={{ ...sleepData[0], targetBedtime: '22:30' }} />
            </View>
          </View>
        )}
      </Card>

      {/* Sleep stages card */}
      <Card title={t('sleepOverview.sleepStages.title')}>
        {loading ? (
          <ThemedText type="caption">Loading…</ThemedText>
        ) : (
          <>
            <View style={globalStyles.row}>
              <View
                style={[globalStyles.col, globalStyles.colWithDivider, { borderRightColor: colors.borderLight }]}
              >
                <ThemedText type="default">{t('sleepOverview.sleepStages.deepSleep.title')}</ThemedText>
                <ThemedText type="title2">{deepSleepMinutes ?? '—'}</ThemedText>
                <ThemedText type="caption">{t('sleepOverview.sleepStages.deepSleep.minutes')}</ThemedText>
              </View>

              <View style={globalStyles.col}>
                <ThemedText type="default">{t('sleepOverview.sleepStages.remSleep.title')}</ThemedText>
                <ThemedText type="title2">{remSleepMinutes ?? '—'}</ThemedText>
                <ThemedText type="caption">{t('sleepOverview.sleepStages.remSleep.minutes')}</ThemedText>
              </View>
            </View>

            <ThemedText type="explainer" style={[globalStyles.topBorder, { borderTopColor: colors.borderLight }]}>
              💤{t("sleepOverview.sleepStages.explainer")} 
            </ThemedText>
          </>
        )}
      </Card>

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
    </>
  );
}
