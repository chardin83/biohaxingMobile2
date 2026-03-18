import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';

export interface MetricTrendPoint {
  readonly date: string;
  readonly value: number;
}

interface MetricTrendChartProps {
  readonly data: MetricTrendPoint[];
  readonly metricName: string;
  readonly unit?: string;
  readonly daysToShow?: number;
  readonly height?: number;
  readonly accentColor?: string;
  readonly onAddManualValue?: () => void;
}

const CHART_PADDING = {
  top: 12,
  right: 8,
  bottom: 20,
  left: 8,
};

function formatShortDate(date: string) {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
}

function buildPath(points: { x: number; y: number }[]) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

function buildAreaPath(points: { x: number; y: number }[], chartBottom: number) {
  if (points.length === 0) {
    return '';
  }

  const linePath = buildPath(points);
  const lastPoint = points.at(-1);
  const firstPoint = points.at(0);

  if (!lastPoint || !firstPoint) {
    return '';
  }

  return `${linePath} L ${lastPoint.x} ${chartBottom} L ${firstPoint.x} ${chartBottom} Z`;
}

export function MetricTrendChart({
  data,
  metricName,
  unit,
  daysToShow = 7,
  height = 180,
  accentColor,
  onAddManualValue,
}: Readonly<MetricTrendChartProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [chartWidth, setChartWidth] = React.useState(0);
  const lineColor = accentColor ?? colors.accentStrong;

  const chartData = React.useMemo<MetricTrendPoint[]>(() => {
    return data.slice(-daysToShow);
  }, [data, daysToShow]);

  const latestValue = chartData[chartData.length - 1]?.value;
  const minValue = chartData.length > 0 ? Math.min(...chartData.map(entry => entry.value)) : undefined;
  const maxValue = chartData.length > 0 ? Math.max(...chartData.map(entry => entry.value)) : undefined;

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    setChartWidth(currentWidth => (currentWidth === nextWidth ? currentWidth : nextWidth));
  }, []);

  const chartGeometry = React.useMemo(() => {
    if (chartWidth === 0 || chartData.length === 0) {
      return null;
    }

    const innerWidth = Math.max(chartWidth - CHART_PADDING.left - CHART_PADDING.right, 1);
    const innerHeight = Math.max(height - CHART_PADDING.top - CHART_PADDING.bottom, 1);
    const rawMin = Math.min(...chartData.map(entry => entry.value));
    const rawMax = Math.max(...chartData.map(entry => entry.value));
    const baseRange = Math.max(rawMax - rawMin, 1);
    const paddedMin = Math.max(0, rawMin - baseRange * 0.2);
    const paddedMax = rawMax + baseRange * 0.2;
    const paddedRange = Math.max(paddedMax - paddedMin, 1);

    const points = chartData.map((entry, index) => {
      const x = chartData.length === 1
        ? CHART_PADDING.left + innerWidth / 2
        : CHART_PADDING.left + (index / (chartData.length - 1)) * innerWidth;
      const y = CHART_PADDING.top + ((paddedMax - entry.value) / paddedRange) * innerHeight;

      return { x, y };
    });

    return {
      points,
      chartBottom: CHART_PADDING.top + innerHeight,
      gridLines: [0.25, 0.5, 0.75].map(ratio => CHART_PADDING.top + innerHeight * ratio),
    };
  }, [chartData, chartWidth, height]);

  const labelIndices = React.useMemo(() => {
    if (chartData.length === 0) {
      return [] as number[];
    }

    return Array.from(new Set([0, Math.floor((chartData.length - 1) / 2), chartData.length - 1]));
  }, [chartData.length]);

  if (chartData.length < 2) {
    return (
      <View style={[styles.container, { borderTopColor: colors.borderLight }]}> 
        <View style={styles.header}>
          <ThemedText type="title3">{t('metrics:trendChart.title', { metric: metricName })}</ThemedText>
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('metrics:trendChart.subtitle', { count: daysToShow })}
          </ThemedText>
        </View>
        <View style={[styles.emptyState, { backgroundColor: colors.overlayLight, borderColor: colors.borderLight }]}> 
          <ThemedText type="explainer" style={{ color: colors.textMuted }}>
            {t('metrics:trendChart.empty', { metric: metricName })}
          </ThemedText>
        </View>
        {!!onAddManualValue && (
          <AppButton
            onPress={onAddManualValue}
            title={t('metrics:trendChart.addManualValue')}
            style={styles.ctaButton}
          />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderTopColor: colors.borderLight }]}> 
      <View style={styles.header}>
        <View>
          <ThemedText type="title3">{t('metrics:trendChart.title', { metric: metricName })}</ThemedText>
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('metrics:trendChart.subtitle', { count: chartData.length })}
          </ThemedText>
        </View>
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>{t('metrics:trendChart.latestLabel')}</ThemedText>
            <ThemedText type="defaultSemiBold">{latestValue}{unit ? ` ${unit}` : ''}</ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>{t('metrics:trendChart.lowLabel')}</ThemedText>
            <ThemedText type="defaultSemiBold">{minValue}{unit ? ` ${unit}` : ''}</ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>{t('metrics:trendChart.highLabel')}</ThemedText>
            <ThemedText type="defaultSemiBold">{maxValue}{unit ? ` ${unit}` : ''}</ThemedText>
          </View>
        </View>
      </View>

      <View
        onLayout={handleLayout}
        style={[styles.chartFrame, { backgroundColor: colors.overlayLight, borderColor: colors.borderLight }]}
      >
        {chartGeometry && (
          <Svg width={chartWidth} height={height}>
            <Defs>
              <LinearGradient id="hrvAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={lineColor} stopOpacity="0.28" />
                <Stop offset="1" stopColor={lineColor} stopOpacity="0.04" />
              </LinearGradient>
            </Defs>

            {chartGeometry.gridLines.map(gridY => (
              <Line
                key={gridY}
                x1={CHART_PADDING.left}
                x2={chartWidth - CHART_PADDING.right}
                y1={gridY}
                y2={gridY}
                stroke={colors.borderLight}
                strokeDasharray="4 6"
                strokeWidth={1}
              />
            ))}

            <Path d={buildAreaPath(chartGeometry.points, chartGeometry.chartBottom)} fill="url(#hrvAreaGradient)" />
            <Path
              d={buildPath(chartGeometry.points)}
              fill="none"
              stroke={lineColor}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
            />

            {chartGeometry.points.map((point, index) => {
              const isLatestPoint = index === chartGeometry.points.length - 1;

              return (
                <Circle
                  key={`${chartData[index].date}-${chartData[index].value}`}
                  cx={point.x}
                  cy={point.y}
                  r={isLatestPoint ? 5 : 4}
                  fill={isLatestPoint ? lineColor : colors.cardBackground}
                  stroke={lineColor}
                  strokeWidth={2}
                />
              );
            })}
          </Svg>
        )}
      </View>

      <View style={styles.axisLabels}>
        {labelIndices.map(index => (
          <View key={chartData[index].date} style={styles.axisLabelItem}>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              {formatShortDate(chartData[index].date)}
            </ThemedText>
          </View>
        ))}
      </View>

      {!!onAddManualValue && (
        <AppButton
          onPress={onAddManualValue}
          title={t('metrics:trendChart.addManualValue')}
          style={styles.ctaButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  header: {
    gap: 12,
    marginBottom: 12,
  },
  summary: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryItem: {
    flex: 1,
  },
  chartFrame: {
    minHeight: 180,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  axisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  axisLabelItem: {
    flex: 1,
    alignItems: 'center',
  },
  ctaButton: {
    marginTop: 16,
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
});