import React from 'react';
import { StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';
import { ALL_AMINO_ACID_KEYS } from '@/constants/aminoAcids';
import { MINERAL_TYPE_KEYS } from '@/constants/minerals';
import { VITAMIN_TYPE_KEYS } from '@/constants/vitamins';

export default function NutritionTargetsSection({ tip, colors, t }: Readonly<{ tip: any; colors: any; t: any }>) {
    if (!tip?.fiberTargets && !tip?.polyphenolTargets && !tip?.mineralTargets && !tip?.vitaminTargets && !tip?.aminoAcidTargets && !tip?.trackingTargets) return null;

    const fiberTargets = tip?.fiberTargets ?? [];
    const polyphenolTargets = tip?.polyphenolTargets ?? [];
    const mineralTargets = tip?.mineralTargets ?? [];
    const vitaminTargets = tip?.vitaminTargets ?? [];
    const aminoAcidTargets = tip?.aminoAcidTargets ?? [];
    const trackingTargets = tip?.trackingTargets ?? [];
    const allTargets = [...fiberTargets, ...polyphenolTargets, ...mineralTargets, ...vitaminTargets, ...aminoAcidTargets, ...trackingTargets];

    const mineralTags = new Set(MINERAL_TYPE_KEYS);
    const aminoAcidTags = new Set(ALL_AMINO_ACID_KEYS);
    const vitaminTags = new Set(VITAMIN_TYPE_KEYS);

    if (!allTargets.length) return null;

    const formatValue = (value: number, unit: 'g' | 'mg' | 'plants' | 'items' | 'count') => {
        if (unit === 'plants' || unit === 'items' || unit === 'count') {
            return `${Math.round(value)} ${unit}`;
        }
        let decimals = 1;
        if (unit === 'mg') {
            if (value < 0.01) {
                decimals = 4;
            } else if (value < 1) {
                decimals = 3;
            } else if (value < 10) {
                decimals = 2;
            } else {
                decimals = 0;
            }
        }
        return `${value.toFixed(decimals)} ${unit}`;
    };

    return (
        <AppBox title={t('nutritionTargetSection.title')}>
            {allTargets.map((target: any) => {
                const trackingKey = 'trackingKey' in target ? target.trackingKey : target.tag;
                let labelGroup: 'weeklyTrackingLabels' | 'fiberLabels' | 'aminoAcidLabels' | 'mineralLabels' | 'vitaminLabels' | 'polyphenolLabels' = 'polyphenolLabels';
                if (target.unit === 'plants' || target.unit === 'items' || target.unit === 'count') {
                    labelGroup = 'weeklyTrackingLabels';
                } else if (target.unit === 'g') {
                    labelGroup = 'fiberLabels';
                } else if (aminoAcidTags.has(trackingKey)) {
                    labelGroup = 'aminoAcidLabels';
                } else if (mineralTags.has(trackingKey)) {
                    labelGroup = 'mineralLabels';
                } else if (vitaminTags.has(trackingKey)) {
                    labelGroup = 'vitaminLabels';
                }
                const label = t(`nutritionLogger.${labelGroup}.${trackingKey}`);
                return (
                    <>
                        <View key={`target-${trackingKey}`} style={styles.nutritionTagContainer}>
                            <ThemedText type="default" style={globalStyles.flex1}>
                                {label}
                            </ThemedText>
                            <ThemedText type="caption" style={{ color: colors.textMuted }}>
                                {formatValue(target.amount, target.unit)}
                            </ThemedText>
                        </View>

                        <ThemedText type="explainer" style={[
                            globalStyles.explainer,
                            { borderTopColor: colors.borderLight }
                        ]}>
                            {t('nutritionTargetSection.description')}
                        </ThemedText>
                    </>
                );
            })}
        </AppBox>
    );
}

const styles = StyleSheet.create({
    nutritionTagContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
});
