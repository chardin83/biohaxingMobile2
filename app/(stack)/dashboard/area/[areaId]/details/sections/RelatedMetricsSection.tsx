import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { globalStyles } from '@/app/theme/globalStyles';
import { MetricValuesBottomSheet } from '@/components/sections/metrics/MetricValuesBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import { type MetricId, metrics, tipMetricLinks } from '@/locales/metrics';

export default function RelatedMetricsSection({ tipId }: Readonly<{ tipId: string | null }>) {
  const { colors } = useTheme();
  const { t } = useTranslation(['common', 'metrics']);
  const valuesRef = useRef<BottomSheet>(null);
  const [selectedMetricId, setSelectedMetricId] = useState<MetricId | null>(null);
  const pendingOpen = useRef(false);
  const links = tipId ? (tipMetricLinks[tipId] ?? []).filter(link => metrics[link.metricId]) : [];

  if (!links.length) return null;

  const title = t('common:tipDetails.metricsTitle') + ` (${links.length})`;
  const subtitle = links.map(link => t(`metrics:${link.metricId}.name`)).join(', ');

  return (
    <>
      <InformationCardLink
        title={title}
        sheetTitle={t('common:tipDetails.metricsTitle')}
        subtitle={subtitle}
        iconName="chart"
        snapPoints={['60%']}
        onDismiss={() => {
          if (!pendingOpen.current) return;
          pendingOpen.current = false;
          valuesRef.current?.snapToIndex(1);
        }}
      >
        {dismiss => (
          <>
            {links.map(link => (
              <InformationCardLink
                key={link.metricId}
                title={t(`metrics:${link.metricId}.name`)}
                iconName="chart"
                onPress={() => {
                  setSelectedMetricId(link.metricId);
                  pendingOpen.current = true;
                  dismiss();
                }}
              />
            ))}
            <ThemedText type="explainer" style={[globalStyles.explainer, { borderTopColor: colors.borderLight }]}>
              {t('common:tipDetails.metricsExplainer')}
            </ThemedText>
          </>
        )}
      </InformationCardLink>
      <MetricValuesBottomSheet bottomSheetRef={valuesRef} metricId={selectedMetricId} metricName={selectedMetricId ? t(`metrics:${selectedMetricId}.name`) : undefined} />
    </>
  );
}
