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

type AxisEntry = {
  readonly id: 'max' | 'mid' | 'min';
  readonly value: number;
};

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

const Y_AXIS_LABEL_LINE_HEIGHT = 20;
const Y_AXIS_LABEL_OFFSET = Y_AXIS_LABEL_LINE_HEIGHT / 2;

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
  const dynamicStyles = React.useMemo(
    () =>
      StyleSheet.create({
        containerBorder: {
          borderTopColor: colors.borderLight,
        },
        subtitleText: {
          color: colors.textMuted,
        },
        emptyState: {
          backgroundColor: colors.overlayLight,
          borderColor: colors.borderLight,
        },
        emptyText: {
          color: colors.textMuted,
        },
        chartRow: {
          marginLeft: -20,
        },
        yAxisColumn: {
          height,
        },
        yAxisUnit: {
          color: colors.textMuted,
          top: 0,
        },
        yAxisValue: {
          color: colors.textMuted,
        },
        chartFrame: {
          backgroundColor: colors.overlayLight,
          borderColor: colors.borderLight,
        },
        axisLabelText: {
          color: colors.textMuted,
        },
      }),
    [colors.borderLight, colors.overlayLight, colors.textMuted, height]
  );

  const chartData = React.useMemo<MetricTrendPoint[]>(() => {
    return data.slice(-daysToShow);
  }, [data, daysToShow]);

  const latestValue = chartData.at(-1)?.value;
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

    const axisEntries: AxisEntry[] = [
      { id: 'max', value: rawMax },
      { id: 'mid', value: (rawMax + rawMin) / 2 },
      { id: 'min', value: rawMin },
    ];
    const gridLines = axisEntries.map(({ value }) =>
      CHART_PADDING.top + ((paddedMax - value) / paddedRange) * innerHeight
    );

    const points = chartData.map((entry, index) => {
      const x = chartData.length === 1
        ? CHART_PADDING.left + innerWidth / 2
        : CHART_PADDING.left + (index / (chartData.length - 1)) * innerWidth;
      const y = CHART_PADDING.top + ((paddedMax - entry.value) / paddedRange) * innerHeight;

      return { x, y };
    });

    return {
      axisEntries,
      points,
      chartBottom: CHART_PADDING.top + innerHeight,
      gridLines,
    };
  }, [chartData, chartWidth, height]);

  const labelIndices = React.useMemo(() => {
    if (chartData.length === 0) {
      return [] as number[];
    }

    return Array.from(new Set([0, Math.floor((chartData.length - 1) / 2), chartData.length - 1]));
  }, [chartData.length]);

  const yAxisEntries = chartGeometry?.axisEntries ?? [];
  const yAxisLabelStyles = React.useMemo(
    () =>
      (chartGeometry?.gridLines ?? []).map(gridY =>
        StyleSheet.create({
          value: {
            top: gridY - Y_AXIS_LABEL_OFFSET,
          },
        }).value
      ),
    [chartGeometry?.gridLines]
  );

  if (chartData.length < 2) {
    return (
      <View style={[styles.container, dynamicStyles.containerBorder]}> 
        <View style={styles.header}>
          <ThemedText type="title3">{t('metrics:trendChart.title', { metric: metricName })}</ThemedText>
          <ThemedText type="caption" style={dynamicStyles.subtitleText}>
            {t('metrics:trendChart.subtitle', { count: daysToShow })}
          </ThemedText>
        </View>
        <View style={[styles.emptyState, dynamicStyles.emptyState]}> 
          <ThemedText type="explainer" style={dynamicStyles.emptyText}>
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
  <View style={[styles.container, dynamicStyles.containerBorder]}> 
    <View style={styles.header}>
      <View>
        <ThemedText type="title3">{t('metrics:trendChart.title', { metric: metricName })}</ThemedText>
        <ThemedText type="caption" style={dynamicStyles.subtitleText}>
          {t('metrics:trendChart.subtitle', { count: chartData.length })}
        </ThemedText>
      </View>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <ThemedText type="caption" style={dynamicStyles.subtitleText}>{t('metrics:trendChart.latestLabel')}</ThemedText>
          <ThemedText type="defaultSemiBold">{latestValue}{unit ? ` ${unit}` : ''}</ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText type="caption" style={dynamicStyles.subtitleText}>{t('metrics:trendChart.lowLabel')}</ThemedText>
          <ThemedText type="defaultSemiBold">{minValue}{unit ? ` ${unit}` : ''}</ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText type="caption" style={dynamicStyles.subtitleText}>{t('metrics:trendChart.highLabel')}</ThemedText>
          <ThemedText type="defaultSemiBold">{maxValue}{unit ? ` ${unit}` : ''}</ThemedText>
        </View>
      </View>
    </View>

    <View style={[styles.chartRow, dynamicStyles.chartRow]}>
      <View style={[styles.yAxisColumn, dynamicStyles.yAxisColumn]}>
        {!!unit && (
          <ThemedText
            type="caption"
            style={[styles.yAxisUnit, dynamicStyles.yAxisUnit]}
          >
            {unit}
          </ThemedText>
        )}
        {yAxisEntries.map(({ id, value }, index) => (
          <ThemedText
            key={id}
            type="caption"
            style={[styles.yAxisValue, dynamicStyles.yAxisValue, yAxisLabelStyles[index]]}
          >
            {value.toFixed(1)}
          </ThemedText>
        ))}
      </View>
      <View
        onLayout={handleLayout}
        style={[styles.chartFrame, dynamicStyles.chartFrame]}
      >
        {chartGeometry && (
          <Svg width={chartWidth} height={height}>
            <Defs>
              <LinearGradient id="hrvAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={lineColor} stopOpacity="0.28" />
                <Stop offset="1" stopColor={lineColor} stopOpacity="0.04" />
              </LinearGradient>
            </Defs>
            {chartGeometry.gridLines.map((gridY, index) => (
              <Line
                key={chartGeometry.axisEntries[index]?.id ?? `grid-${gridY}`}
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
    </View>

    <View style={styles.axisLabels}>
      {labelIndices.map(index => (
        <View key={chartData[index].date} style={styles.axisLabelItem}>
            <ThemedText type="caption" style={dynamicStyles.axisLabelText}>
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
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  yAxisColumn: {
    width: 40,
    marginRight: 4,
    position: 'relative',
  },
  yAxisUnit: {
    position: 'absolute',
    right: 0,
    textAlign: 'right',
  },
  yAxisValue: {
    position: 'absolute',
    right: 0,
    textAlign: 'right',
  },
  chartFrame: {
    minHeight: 180,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    flex: 1,
    maxWidth: '100%',
    width: '100%',
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