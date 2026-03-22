import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import { getCurrentWeekTrainingLoad, getTrainingLoadStatus } from '@/utils/trainingLoad';

import { MetricContainer } from './MetricContainer';

interface TrainingLoadMetricProps {
    showDivider?: boolean;
    onPress?: () => void;
    isSelected?: boolean;
}

export function TrainingLoadMetric({
    showDivider = false,
    onPress,
    isSelected = false,
}: Readonly<TrainingLoadMetricProps>) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { getMetricHistory } = useStorage();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    const trainingLoadSummary = React.useMemo(() => {
        return getCurrentWeekTrainingLoad(
            getMetricHistory('active_minutes').map(entry => ({ recordedAt: entry.recordedAt, value: entry.value, unit: entry.unit })),
            getMetricHistory('intensity_minutes').map(entry => ({ recordedAt: entry.recordedAt, value: entry.value, unit: entry.unit }))
        );
    }, [getMetricHistory]);

    const statusKey = getTrainingLoadStatus(trainingLoadSummary.load ?? 0);

    let trainingLoadStatus: string;
    if (statusKey === 'high') {
        trainingLoadStatus = t('metrics:common.high');
    } else if (statusKey === 'low') {
        trainingLoadStatus = t('metrics:common.low');
    } else if (statusKey === 'optimal') {
        trainingLoadStatus = t('metrics:common.optimal');
    } else {
        trainingLoadStatus = '—';
    }

    let statusStyle = styles.statusNeutral;
    if (trainingLoadStatus === t('metrics:common.high')) {
        statusStyle = styles.statusHigh;
    } else if (trainingLoadStatus === t('metrics:common.low')) {
        statusStyle = styles.statusLow;
    } else if (trainingLoadStatus === t('metrics:common.optimal')) {
        statusStyle = styles.statusOptimal;
    }

    return (
        <MetricContainer
            showDivider={showDivider}
            isSelected={isSelected}
            onPress={onPress}
            borderColor={isSelected ? colors.accentStrong : 'transparent'}
        >

            <ThemedText type="label" numberOfLines={1} ellipsizeMode="tail" style={styles.label}>{t('metrics:trainingLoad.name')}</ThemedText>



            <ThemedText type="title2" style={statusStyle}>{trainingLoadStatus}</ThemedText>
            <ThemedText type="caption">{trainingLoadSummary.load ?? '—'}</ThemedText>
            {trainingLoadSummary.hasData && (
                <View style={styles.footer}>
                    <ThemedText type="caption">{t('metrics:trainingLoad.weekTotal', { defaultValue: t('metrics:trainingLoad.sevenDayTotal') })}</ThemedText>
                </View>
            )}
        </MetricContainer>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'nowrap',
    },
    label: {
        flexShrink: 1,
        marginRight: 8,
    },
    footer: {
        marginTop: 2,
    },
    statusNeutral: {
        marginTop: 2,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    statusHigh: {
        marginTop: 2,
        fontWeight: '600',
        color: colors.warmColor,
    },
    statusOptimal: {
        marginTop: 2,
        fontWeight: '600',
        color: colors.successColor,
    },
    statusLow: {
        marginTop: 2,
        fontWeight: '600',
        color: colors.infoColor,
    },
});
