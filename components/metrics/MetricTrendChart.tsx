import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { IconSymbol } from '@/components/ui/IconSymbol';

export interface MetricTrendPoint {
  readonly date: string;
  readonly value: number;
}

type ChartEventSeries = {
  label: string;
  dates: string[];
  color?: string;
};

type AxisEntry = {
  readonly id: 'max' | 'mid' | 'min';
  readonly value: number;
};

interface MetricTrendChartProps {
  readonly data: MetricTrendPoint[];
  readonly metricName: string;
  readonly unit?: string;
  readonly valueFormatter?: (value: number) => string;
  readonly daysToShow?: number;
  readonly height?: number;
  readonly accentColor?: string;
  readonly onViewRegisteredValues?: () => void;
  readonly xAxisLabelFormatter?: (date: string) => string;
  readonly referenceLines?: Array<{
    value: number;
    label?: string;
    color?: string;
  }>;
  readonly eventSeries?: ChartEventSeries[];
}

const CHART_PADDING = {
  top: 12,
  right: 8,
  bottom: 28,
  left: 8,
};

const CHART_ROW_MARGIN_LEFT = -20;
const Y_AXIS_COLUMN_WIDTH = 40;
const Y_AXIS_COLUMN_MARGIN_RIGHT = 4;
const CHART_FRAME_OFFSET = CHART_ROW_MARGIN_LEFT + Y_AXIS_COLUMN_WIDTH + Y_AXIS_COLUMN_MARGIN_RIGHT;

const Y_AXIS_LABEL_LINE_HEIGHT = 20;
const Y_AXIS_LABEL_OFFSET = Y_AXIS_LABEL_LINE_HEIGHT / 2;
const X_AXIS_LABEL_WIDTH = 44;
const EMPTY_GRID_LINE_COUNT = 3;

type EmptyChartLabel = {
  readonly id: 'start' | 'mid' | 'end';
  readonly left: number;
  readonly textAlign: 'left' | 'center' | 'right';
};

function formatShortDate(date: string) {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
}

function toDateTimestamp(date: string) {
  const parsed = new Date(`${date}T00:00:00.000Z`).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getTodayUtcDateString() {
  return new Date().toISOString().slice(0, 10);
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
  valueFormatter,
  daysToShow = 7,
  height = 180,
  accentColor,
  onViewRegisteredValues,
  xAxisLabelFormatter,
  referenceLines,
  eventSeries,
}: Readonly<MetricTrendChartProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation('metrics');
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
        emptyText: {
          color: colors.textMuted,
          textAlign: 'center',
        },
        emptyTitle: {
          color: colors.text,
        },
        emptyIconFrame: {
          borderColor: colors.primary,
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
    [colors.borderLight, colors.overlayLight, colors.primary, colors.text, colors.textMuted, height]
  );


  const getTargetLabel = React.useCallback(
  (tag: string) => {
    const keys = [
      `common:nutritionLogger.mineralLabels.${tag}`,
      `common:nutritionLogger.polyphenolLabels.${tag}`,
      `common:nutritionLogger.vitaminLabels.${tag}`,
      `common:nutritionLogger.fiberLabels.${tag}`,
      `common:nutritionLogger.aminoAcidLabels.${tag}`,
      `common:nutritionLogger.plantDiversityLabels.${tag}`,
      `common:nutritionLogger.weeklyTrackingLabels.${tag}`,
      `common:nutritionLogger.fiberSubtypeLabels.${tag}`,
    ];

    for (const key of keys) {
      const translated = t(key, {
        defaultValue: '',
      });

      if (translated) {
        return translated;
      }
    }

    return tag;
  },
  [t],
);

  const chartData = React.useMemo<MetricTrendPoint[]>(() => {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const todayTs = toDateTimestamp(getTodayUtcDateString());
    const windowStartTs = todayTs - (daysToShow - 1) * MS_PER_DAY;
    const sortedData = [...data].sort((left, right) => toDateTimestamp(left.date) - toDateTimestamp(right.date));
    return sortedData.filter(entry => {
      const ts = toDateTimestamp(entry.date);
      return ts >= windowStartTs && ts <= todayTs;
    });
  }, [data, daysToShow]);

  const subtitleText = React.useMemo(() => {
    const isWholeWeeks = daysToShow % 7 === 0;
    if (isWholeWeeks) {
      const weekCount = daysToShow / 7;
      return t('metrics:trendChart.subtitleWeeks', {
        count: weekCount,
        defaultValue: weekCount === 1 ? 'Last week' : `Last ${weekCount} weeks`,
      });
    }

    return t('metrics:trendChart.subtitleDays', {
      count: daysToShow,
      defaultValue: daysToShow === 1 ? 'Last day' : `Last ${daysToShow} days`,
    });
  }, [daysToShow, t]);

  const latestValue = chartData.at(-1)?.value;
  const minValue = chartData.length > 0 ? Math.min(...chartData.map(entry => entry.value)) : undefined;
  const maxValue = chartData.length > 0 ? Math.max(...chartData.map(entry => entry.value)) : undefined;
  const formatValue = React.useCallback((value: number) => {
    if (valueFormatter) {
      return valueFormatter(value);
    }

    const unitSuffix = unit ? ` ${unit}` : '';
    return `${value}${unitSuffix}`;
  }, [unit, valueFormatter]);

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    setChartWidth(currentWidth => (currentWidth === nextWidth ? currentWidth : nextWidth));
  }, []);

  const xAxisDates = React.useMemo(() => {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    const todayTs = toDateTimestamp(getTodayUtcDateString());
    const windowStartTs =
      todayTs - (daysToShow - 1) * MS_PER_DAY;

    const getDateString = (timestamp: number) =>
      new Date(timestamp).toISOString().slice(0, 10);

    if (daysToShow <= 7) {
      return Array.from({ length: daysToShow }, (_, index) =>
        getDateString(windowStartTs + index * MS_PER_DAY),
      );
    }

    const middleTs =
      windowStartTs + (todayTs - windowStartTs) / 2;

    return [
      getDateString(windowStartTs),
      getDateString(middleTs),
      getDateString(todayTs),
    ];
  }, [daysToShow]);

  const chartGeometry = React.useMemo(() => {
    if (chartWidth === 0 || chartData.length === 0) {
      return null;
    }

    const innerWidth = Math.max(chartWidth - CHART_PADDING.left - CHART_PADDING.right, 1);
    const innerHeight = Math.max(height - CHART_PADDING.top - CHART_PADDING.bottom, 1);
    const dataValues = chartData.map(entry => entry.value);
    const referenceValues = (referenceLines ?? []).map(line => line.value);
    const allValues = [...dataValues, ...referenceValues];
    const rawMin = Math.min(...allValues);
    const rawMax = Math.max(...allValues);

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

    const referenceLinePoints = (referenceLines ?? []).map(line => ({
      y: CHART_PADDING.top + ((paddedMax - line.value) / paddedRange) * innerHeight,
      value: line.value,
      label: line.label,
      color: line.color,
    }));

    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    const todayTs = toDateTimestamp(getTodayUtcDateString());
    const windowStartTs = todayTs - (daysToShow - 1) * MS_PER_DAY;
    const windowRange = Math.max(todayTs - windowStartTs, 1);

    const getXForDate = (date: string) => {
      const ts = toDateTimestamp(date);

      return (
        CHART_PADDING.left +
        ((ts - windowStartTs) / windowRange) * innerWidth
      );
    };

    const points = chartData.map(entry => {
      const x = getXForDate(entry.date);

      const y =
        CHART_PADDING.top +
        ((paddedMax - entry.value) / paddedRange) * innerHeight;

      return { x, y };
    });

    const eventSeriesPoints = (eventSeries ?? []).map(series => ({
      label: series.label,
      color: series.color,
      points: series.dates
        .filter(date => {
          const ts = toDateTimestamp(date);

          return ts >= windowStartTs && ts <= todayTs;
        })
        .map(date => ({
          date,
          x: getXForDate(date),
        })),
    }));

    const xAxisPoints = xAxisDates.map(date => ({
      date,
      x: getXForDate(date),
    }));

    return {
      axisEntries,
      points,
      chartBottom: CHART_PADDING.top + innerHeight,
      gridLines,
      referenceLinePoints,
      eventSeriesPoints,
      xAxisPoints,
    };
  }, [chartData, chartWidth, daysToShow, eventSeries, height, referenceLines, xAxisDates]);



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
    const emptyGridLineRows = Array.from({ length: EMPTY_GRID_LINE_COUNT }, (_, index) => index);
    const emptyAxisLabels: EmptyChartLabel[] = [
      { id: 'start', left: CHART_PADDING.left, textAlign: 'left' },
      { id: 'mid', left: chartWidth / 2, textAlign: 'center' },
      { id: 'end', left: Math.max(chartWidth - CHART_PADDING.right, CHART_PADDING.left), textAlign: 'right' },
    ];

    return (
      <View style={[styles.container, dynamicStyles.containerBorder]}>
        <View style={styles.header}>
          <ThemedText type="title3">{t('metrics:trendChart.title', { metric: metricName })}</ThemedText>
          <ThemedText type="caption" style={dynamicStyles.subtitleText}>
            {subtitleText}
          </ThemedText>
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
            {emptyGridLineRows.map(index => (
              <ThemedText
                key={`empty-y-${index}`}
                type="caption"
                style={[
                  styles.yAxisValue,
                  dynamicStyles.yAxisValue,
                  {
                    top: CHART_PADDING.top + ((height - CHART_PADDING.top - CHART_PADDING.bottom) * index) / (EMPTY_GRID_LINE_COUNT - 1) - Y_AXIS_LABEL_OFFSET,
                  },
                ]}
              >
                -
              </ThemedText>
            ))}
          </View>

          <View onLayout={handleLayout} style={[styles.chartFrame, dynamicStyles.chartFrame, styles.emptyChartFrame]}>
            {chartWidth > 0 && (
              <Svg width={chartWidth} height={height}>
                {emptyGridLineRows.map(index => {
                  const y = CHART_PADDING.top + ((height - CHART_PADDING.top - CHART_PADDING.bottom) * index) / (EMPTY_GRID_LINE_COUNT - 1);
                  return (
                    <Line
                      key={`empty-grid-${index}`}
                      x1={CHART_PADDING.left}
                      x2={chartWidth - CHART_PADDING.right}
                      y1={y}
                      y2={y}
                      stroke={colors.borderLight}
                      strokeDasharray="4 6"
                      strokeWidth={1}
                    />
                  );
                })}
              </Svg>
            )}

            <View style={styles.emptyState}>
              <View style={[styles.emptyIconFrame, dynamicStyles.emptyIconFrame]}>
                <IconSymbol name="chart" size={22} color={colors.primary} />
              </View>
              <ThemedText type="defaultSemiBold" style={dynamicStyles.emptyTitle}>
                {t('metrics:trendChart.emptyTitle')}
              </ThemedText>
              <ThemedText type="explainer" style={dynamicStyles.emptyText}>
                {t('metrics:trendChart.empty', { metric: metricName })}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.axisLabels}>
          {emptyAxisLabels.map(label => {
            let labelLeft = CHART_FRAME_OFFSET + label.left - X_AXIS_LABEL_WIDTH;

            if (label.id === 'start') {
              labelLeft = CHART_FRAME_OFFSET + CHART_PADDING.left;
            } else if (label.id === 'mid') {
              labelLeft = CHART_FRAME_OFFSET + label.left - X_AXIS_LABEL_WIDTH / 2;
            }

            return (
              <View
                key={label.id}
                style={[
                  styles.axisLabelItem,
                  {
                    left: labelLeft,
                  },
                ]}
              >
                <ThemedText type="caption" style={[styles.axisLabelText, dynamicStyles.axisLabelText, { textAlign: label.textAlign }]}>
                  -
                </ThemedText>
              </View>
            );
          })}
        </View>

        {!!onViewRegisteredValues && (
          <AppButton
            onPress={onViewRegisteredValues}
            title={t('trendChart.viewRegisteredValues')}
            variant="secondary"
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
            {subtitleText}
          </ThemedText>
        </View>
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <ThemedText type="caption" style={dynamicStyles.subtitleText}>{t('metrics:trendChart.latestLabel')}</ThemedText>
            <ThemedText type="defaultSemiBold">{latestValue == null ? '—' : formatValue(latestValue)}</ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText type="caption" style={dynamicStyles.subtitleText}>{t('metrics:trendChart.lowLabel')}</ThemedText>
            <ThemedText type="defaultSemiBold">{minValue == null ? '—' : formatValue(minValue)}</ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText type="caption" style={dynamicStyles.subtitleText}>{t('metrics:trendChart.highLabel')}</ThemedText>
            <ThemedText type="defaultSemiBold">{maxValue == null ? '—' : formatValue(maxValue)}</ThemedText>
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
              {valueFormatter ? valueFormatter(value) : value.toFixed(1)}
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
              {chartGeometry.referenceLinePoints.map(referenceLine => {
                const color = referenceLine.color ?? colors.textMuted;
                return (
                  <React.Fragment key={`reference-${referenceLine.value}`}>
                    <Line
                      x1={CHART_PADDING.left}
                      x2={chartWidth - CHART_PADDING.right}
                      y1={referenceLine.y}
                      y2={referenceLine.y}
                      stroke={color}
                      strokeDasharray="3 4"
                      strokeWidth={1.5}
                    />
                    <SvgText
                      x={CHART_PADDING.left + 2}
                      y={referenceLine.y - 4}
                      fontSize="10"
                      fill={color}
                    >
                      {referenceLine.label ?? String(referenceLine.value)}
                    </SvgText>
                  </React.Fragment>
                );
              })}
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

      {!!chartGeometry && (
        <>
          <View style={styles.axisLabels}>
            {chartGeometry.xAxisPoints.map(point => {
              const label = xAxisLabelFormatter
                ? xAxisLabelFormatter(point.date)
                : formatShortDate(point.date);

              const left =
                point.x - X_AXIS_LABEL_WIDTH / 2;

              return (
                <View
                  key={`xlabel-${point.date}`}
                  style={[
                    styles.axisLabelItem,
                    { left },
                  ]}
                >
                  <ThemedText
                    type="caption"
                    style={[
                      styles.axisLabelText,
                      dynamicStyles.axisLabelText,
                    ]}
                  >
                    {label}
                  </ThemedText>
                </View>
              );
            })}
          </View>

          {!!eventSeries?.length && (
            <View style={styles.eventRows}>
              {chartGeometry.eventSeriesPoints.map((series, seriesIndex) => (
                <View
                  key={`${series.label}-${seriesIndex}`}
                  style={styles.eventRow}
                >
                  {series.points.map(event => (
                    <View
                      key={`${series.label}-${event.date}`}
                      style={[
                        styles.eventDot,
                        {
                          left: event.x - 4,
                          backgroundColor:
                            series.color ?? colors.primary,
                        },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
        </>
      )}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: colors.primary },
            ]}
          />
          <ThemedText type="caption">
            {metricName}
            {unit ? ` (${unit})` : ''}
          </ThemedText>
        </View>

        {eventSeries?.map((series, index) => (
          <View
            key={`${series.label}-${index}`}
            style={styles.legendItem}
          >
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    series.color ?? colors.primary,
                },
              ]}
            />

            <ThemedText type="caption">
              {getTargetLabel(series.label)}
            </ThemedText>
          </View>
        ))}
      </View>

      {!!onViewRegisteredValues && (
        <AppButton
          onPress={onViewRegisteredValues}
          title={t('trendChart.viewRegisteredValues')}
          variant="secondary"
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
    marginLeft: CHART_ROW_MARGIN_LEFT,
  },
  yAxisColumn: {
    width: Y_AXIS_COLUMN_WIDTH,
    marginRight: Y_AXIS_COLUMN_MARGIN_RIGHT,
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
    position: 'relative',
    height: 18,
    marginTop: 6,
    marginLeft: CHART_FRAME_OFFSET,
  },
  axisLabelItem: {
    position: 'absolute',
    width: X_AXIS_LABEL_WIDTH,
  },
  axisLabelText: {
    textAlign: 'center',
  },
  ctaButton: {
    marginTop: 12,
  },
  emptyState: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  emptyIconFrame: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartFrame: {
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventRows: {
    marginLeft: CHART_FRAME_OFFSET,
    marginTop: 4,
    gap: 4,
  },

  eventRow: {
    position: 'relative',
    height: 12,
  },

  eventDot: {
    position: 'absolute',
    top: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});