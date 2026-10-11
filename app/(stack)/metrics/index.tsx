import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import { CardLinkList } from '@/components/ui/CardLinkList';
import Container from '@/components/ui/Container';
import { METRIC_GROUPS, type MetricId, metrics } from '@/locales/metrics';
import { formatLatestMetricValue, getLatestMetricEntries } from '@/utils/latestMetricOverview';

export default function MyMetricsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { metricEntries } = useStorage();
  const latestEntries = getLatestMetricEntries(metricEntries);
  const sections = METRIC_GROUPS.map(group => ({
    group,
    rows: (Object.keys(metrics) as MetricId[])
      .filter(metricId => metrics[metricId].group === group)
      .map(metricId => ({
        key: metricId,
        title: t(`metrics:${metrics[metricId].nameKey}`),
        iconName: metrics[metricId].iconName,
        subtitle: latestEntries[metricId]
          ? formatLatestMetricValue(latestEntries[metricId], i18n.language, t)
          : t('metrics:availability.noData'),
        onPress: () => router.push({ pathname: '/(stack)/metrics/[metricId]', params: { metricId } }),
      })).sort((a, b) => a.title.localeCompare(b.title, i18n.language)),
  }));
  return (
    <Container background="default" showBackButton>
      <ThemedText type="title2">{t('settings.myMetrics')}</ThemedText>
      {sections.filter(section => section.rows.length > 0).map(section => (
        <View key={section.group} style={styles.section}>
          <ThemedText type="label" uppercase style={styles.heading}>{t(`metrics:groups.${section.group}`)}</ThemedText>
          <CardLinkList rows={section.rows} />
        </View>
      ))}
    </Container>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16 },
  heading: { marginBottom: 8 },
});
