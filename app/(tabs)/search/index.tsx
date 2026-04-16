import { useTheme } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import Badge from '@/components/ui/Badge';
import Container from '@/components/ui/Container';
import LabeledInput from '@/components/ui/LabeledInput';
import { PressableCard } from '@/components/ui/PressableCard';
import { bodyParts as allBodyParts } from '@/locales/bodyParts';
import { TargetPeriod, tips } from '@/locales/tips';
import { PlanCategory } from '@/types/planCategory';

export default function TipsSearchScreen() {
    const { t } = useTranslation();
    const params = useLocalSearchParams<{ targetPeriods?: string | string[] }>();
    const [query, setQuery] = useState('');
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
    const [showFilter, setShowFilter] = useState(false);
    const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
    const [selectedPlanCategories, setSelectedPlanCategories] = useState<PlanCategory[]>([]);
    const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
    const [selectedTargetPeriods, setSelectedTargetPeriods] = useState<TargetPeriod[]>([]);
    const { colors } = useTheme();

    // Always collapse filter panel on navigation/param change
    useEffect(() => {
        setShowFilter(false);
    }, [params.targetPeriods]);

    const toggleSelection = <T,>(currentValues: T[], nextValue: T): T[] => (
        currentValues.includes(nextValue)
            ? currentValues.filter(value => value !== nextValue)
            : [...currentValues, nextValue]
    );

    const initialTargetPeriods = useMemo(() => {
        const rawValue = params.targetPeriods;
        const joinedValue = Array.isArray(rawValue) ? rawValue.join(',') : rawValue;

        if (!joinedValue) {
            return [];
        }

        return joinedValue
            .split(',')
            .map(value => value.trim())
            .filter((value): value is TargetPeriod => value === 'daily' || value === 'weekly');
    }, [params.targetPeriods]);

    useEffect(() => {
        if (initialTargetPeriods.length > 0) {
            setSelectedTargetPeriods(initialTargetPeriods);
        }
    }, [initialTargetPeriods]);

    const allPlanCategories = useMemo(
        () =>
            [...new Set(tips.flatMap(tip => tip.planCategory ?? ['other']))]
                .sort((a, b) => t('common:planCategory.' + a).localeCompare(t('common:planCategory.' + b))),
        [t]
    );

    const filteredTips = useMemo(() => {
        const q = query.trim().toLowerCase();
        return tips
            .filter(tip =>
                (selectedAreas.length === 0 || tip.areas.some(a => selectedAreas.includes(a.id))) &&
                (selectedLevels.length === 0 || selectedLevels.includes(tip.level ?? 1)) &&
                (selectedPlanCategories.length === 0 || (tip.planCategory ?? ['other' as PlanCategory]).some(category => selectedPlanCategories.includes(category))) &&
                (selectedBodyParts.length === 0 || (tip.bodyParts ?? []).some(bodyPart => selectedBodyParts.includes(bodyPart))) &&
                (selectedTargetPeriods.length === 0 || (tip.targetPeriod ? selectedTargetPeriods.includes(tip.targetPeriod) : false)) &&
                (
                    !q ||
                    t('tips:' + tip.title).toLowerCase().includes(q) ||
                    t('tips:' + tip.descriptionKey).toLowerCase().includes(q)
                )
            )
            .sort((a, b) =>
                t('tips:' + a.title).localeCompare(t('tips:' + b.title))
            );
    }, [query, t, selectedAreas, selectedLevels, selectedPlanCategories, selectedBodyParts, selectedTargetPeriods]);

    const matchCount = filteredTips.length;

    const activeFilterCount =
        selectedAreas.length +
        selectedLevels.length +
        selectedPlanCategories.length +
        selectedBodyParts.length +
        selectedTargetPeriods.length;

    const allLevels = [...new Set(tips.map(tip => tip.level ?? 1))].sort((a, b) => a - b);

    const selectedFilterLabels = useMemo(() => {
        const labels = [
            ...selectedAreas.map(areaId => t('areas:' + areaId + '.title')),
            ...selectedLevels.map(level => `${t('common:filter.level')} ${level}`),
            ...selectedPlanCategories.map(category => t('common:planCategory.' + category)),
            ...selectedBodyParts.map(bodyPart => t('bodyParts.' + bodyPart)),
            ...selectedTargetPeriods.map(period => t(`common:filter.${period}`)),
        ];

        return labels;
    }, [selectedAreas, selectedLevels, selectedPlanCategories, selectedBodyParts, selectedTargetPeriods, t]);

    const visibleSelectedFilterLabels = selectedFilterLabels.slice(0, 3);
    const hiddenSelectedFilterCount = Math.max(0, selectedFilterLabels.length - visibleSelectedFilterLabels.length);

    return (
        <Container
            background="gradient"
            gradientKey='sunrise'
            gradientLocations={colors.gradients.sunrise.locations1 as any}
            scrollable={false}
            style={styles.container}
            contentContainerStyle={styles.containerContentOverride}
        >
            <LabeledInput
                label={t('search.label')}
                value={query}
                onChangeText={setQuery}
                containerStyle={styles.inputMargin}
            />
            {showFilter && (
                <ScrollView
                    style={styles.filterScrollView}
                    contentContainerStyle={styles.filterContentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Area-filter */}
                    <ThemedText type="label" style={styles.filterLabel}>
                        {t('common:filter.area')}
                    </ThemedText>
                    <View style={styles.filterView}>
                        {[...new Set(tips.flatMap(tip => tip.areas.map(a => a.id)))].map(areaId => (
                            <Badge
                                key={areaId}
                                variant="overlay"
                                style={[
                                    styles.toggleBadge,
                                    selectedAreas.includes(areaId) && { backgroundColor: colors.accentDefault },
                                ]}
                                onPress={() => setSelectedAreas(currentValues => toggleSelection(currentValues, areaId))}
                            >
                                <ThemedText type="caption" style={styles.badgeLabel}>
                                    {t('areas:' + areaId + '.title')}
                                </ThemedText>
                            </Badge>
                        ))}
                    </View>
                    {/* Level-filter */}
                    <ThemedText type="label" style={styles.filterLabel}>
                        {t('common:filter.level')}
                    </ThemedText>
                    <View style={styles.filterView}>
                        {allLevels.map(level => (
                            <Badge
                                key={level}
                                variant="overlay"
                                style={[
                                    styles.toggleBadge,
                                    selectedLevels.includes(level) && { backgroundColor: colors.accentDefault },
                                ]}
                                onPress={() => setSelectedLevels(currentValues => toggleSelection(currentValues, level))}
                            >
                                <ThemedText type="caption" style={styles.badgeLabel}>{`${level}`}</ThemedText>
                            </Badge>
                        ))}
                    </View>
                    {/* PlanCategory-filter */}
                    <ThemedText type="label" style={styles.filterLabel}>
                        {t('common:filter.planCategory')}
                    </ThemedText>
                    <View style={styles.filterView}>
                        {allPlanCategories.map(cat => (
                            <Badge
                                key={cat}
                                variant="overlay"
                                style={[
                                    styles.toggleBadge,
                                    selectedPlanCategories.includes(cat as PlanCategory) && { backgroundColor: colors.accentDefault },
                                ]}
                                onPress={() => setSelectedPlanCategories(currentValues => toggleSelection(currentValues, cat as PlanCategory))}
                            >
                                <ThemedText type="caption" style={styles.badgeLabel}>{t('common:planCategory.' + cat)}</ThemedText>
                            </Badge>
                        ))}
                    </View>
                    {/* BodyPart-filter */}
                    <ThemedText type="label" style={styles.filterLabel}>
                        {t('common:filter.bodyPart')}
                    </ThemedText>
                    <View style={styles.filterView}>
                        {allBodyParts.map(bp => (
                            <Badge
                                key={bp.id}
                                variant="overlay"
                                style={[
                                    styles.toggleBadge,
                                    selectedBodyParts.includes(bp.id) && { backgroundColor: colors.accentDefault },
                                ]}
                                onPress={() => setSelectedBodyParts(currentValues => toggleSelection(currentValues, bp.id))}
                            >
                                <ThemedText type="caption" style={styles.badgeLabel}>{t('bodyParts.' + bp.id)}</ThemedText>
                            </Badge>
                        ))}
                    </View>
                    <ThemedText type="label" style={styles.filterLabel}>
                        {t('common:filter.targets')}
                    </ThemedText>
                    <View style={styles.filterView}>
                        {(['daily', 'weekly'] as TargetPeriod[]).map(period => (
                            <Badge
                                key={period}
                                variant="overlay"
                                style={[
                                    styles.toggleBadge,
                                    selectedTargetPeriods.includes(period) && { backgroundColor: colors.accentDefault },
                                ]}
                                onPress={() => setSelectedTargetPeriods(currentValues => toggleSelection(currentValues, period))}
                            >
                                <ThemedText type="caption" style={styles.badgeLabel}>
                                    {t(`common:filter.${period}`)}
                                </ThemedText>
                            </Badge>
                        ))}
                    </View>
                </ScrollView>
            )}
            <TouchableOpacity onPress={() => setShowFilter(v => !v)}>
                <ThemedText type="default" style={[styles.filterButtonLabel, { color: colors.accentDefault }]}>
                    {showFilter ? `Filter (${activeFilterCount})` : 'Filter'}
                </ThemedText>
                {!showFilter && selectedFilterLabels.length > 0 && (
                    <View style={styles.collapsedFilterPills}>
                        {visibleSelectedFilterLabels.map((label, index) => (
                            <Badge
                                key={`${label}-${index}`}
                                variant="overlay"
                                style={[styles.toggleBadge, styles.collapsedFilterPill, { backgroundColor: colors.accentDefault }]}
                            >
                                <ThemedText type="caption" style={[styles.badgeLabel, styles.collapsedFilterPillLabel, { color: colors.textWhite }]}>
                                    {label}
                                </ThemedText>
                            </Badge>
                        ))}
                        {hiddenSelectedFilterCount > 0 && (
                            <Badge
                                variant="overlay"
                                style={[styles.toggleBadge, styles.collapsedFilterPill, { backgroundColor: colors.cardBorder }]}
                            >
                                <ThemedText type="caption" style={[styles.badgeLabel, styles.collapsedFilterOverflowLabel, { color: colors.textMuted }]}>
                                    {`+${hiddenSelectedFilterCount}`}
                                </ThemedText>
                            </Badge>
                        )}
                    </View>
                )}
            </TouchableOpacity>
            <ThemedText type="default" style={styles.resultCount}>
                {`${matchCount} tips`}
            </ThemedText>
            <FlatList
                data={filteredTips}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.resultsListContent}
                renderItem={({ item }) => {
                    const firstAreaId = item.areas[0]?.id;

                    return (
                        <PressableCard
                            onPress={() => {
                                if (!firstAreaId) {
                                    return;
                                }

                                router.push({
                                    pathname: `/dashboard/area/${firstAreaId}/details` as any,
                                    params: {
                                        tipId: item.id,
                                        expandAreas: '1',
                                    },
                                });
                            }}
                        >
                            <View style={styles.badgeRow}>
                                {item.targetPeriod ? (
                                    <Badge
                                        variant="overlay"
                                        style={[styles.toggleBadge, styles.badgeTargetOpacity]}
                                    >
                                        <ThemedText type="pill" style={[styles.bold, { color: colors.textWhite }]}>
                                            {t(`common:filter.${item.targetPeriod}`)}
                                        </ThemedText>
                                    </Badge>
                                ) : <View style={styles.flex1width1} />}
                                <View style={globalStyles.flex1} />
                                <Badge variant="overlay" style={[styles.toggleBadge, styles.levelBadge, styles.badgeLevelOpacity, { backgroundColor: colors.accentDefault }]}>
                                    <ThemedText type="pill" style={[styles.bold]}>
                                        {`${t('common:filter.level')} ${item.level ?? 1}`}
                                    </ThemedText>
                                </Badge>
                            </View>
                            <View style={styles.titleRow}>
                                <View style={styles.titleRowInner}>
                                    <ThemedText
                                        type="title3"
                                        style={styles.title}
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                    >
                                        {t('tips:' + item.title)}
                                    </ThemedText>
                                </View>
                            </View>
                            <View style={styles.areaBadgeRowNoWrap}>
                                {item.areas.slice(0, 2).map(a => (
                                    <Badge
                                        key={a.id}
                                        variant="overlay"
                                        style={styles.toggleBadge}
                                    >
                                        <ThemedText type="pill" style={styles.badgeLabel}>
                                            {t('areas:' + a.id + '.title')}
                                        </ThemedText>
                                    </Badge>
                                ))}
                                {item.areas.length > 2 && (
                                    <Badge
                                        variant="overlay"
                                        style={[styles.badgeAreaOverflow, { backgroundColor: colors.cardBorder }]}
                                    >
                                        <ThemedText type="pill" style={styles.badgeAreaOverflowLabel}>
                                            {`+${item.areas.length - 2}`}
                                        </ThemedText>
                                    </Badge>
                                )}
                            </View>
                            <ThemedText
                                type="default"
                                style={styles.desc}
                                numberOfLines={2}
                                ellipsizeMode="tail"
                            >
                                {t('tips:' + item.descriptionKey)}
                            </ThemedText>
                        </PressableCard>
                    );
                }}
                ListEmptyComponent={<ThemedText type="default" style={styles.empty}>Inga tips hittades.</ThemedText>}
            />
        </Container>
    );
}

const styles = StyleSheet.create({
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    badgeTargetOpacity: {
        opacity: 0.7,
    },
    badgeLevelOpacity: {
        opacity: 0.8,
    },
    flex1width1: {
        flex: 1,
        width: 1,
    },
    titleRowInner: {
        flex: 1,
        minWidth: 0,
    },
    container: {
        flex: 1,
        padding: 16,
        paddingTop: 80,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
        flexShrink: 1,
    },
    desc: { marginBottom: 4 },
    areaBadgeRowNoWrap: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
        marginTop: 2,
        marginBottom: 2,
    },
    badgeAreaOverflow: {
        opacity: 0.5,
        paddingHorizontal: 9,
    },
    badgeAreaOverflowLabel: {
        opacity: 0.8,
    },
    badge: {
        marginRight: 6,
        marginBottom: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeLabel: {
        fontSize: 12,
    },
    badgeLabelSmall: {
        fontSize: 11,
    },
    bold: {
        fontWeight: 'bold',
    },
    toggleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        marginBottom: 8,
    },
    targetBadge: {
        marginLeft: 8,
    },
    levelBadge: {
        marginLeft: 8,
    },
    areas: { fontSize: 12 },
    empty: { textAlign: 'center', marginTop: 40 },
    inputMargin: { marginBottom: 20 },
    resultCount: { fontSize: 16, marginBottom: 12 },
    resultsListContent: {
        paddingBottom: 220,
    },
    containerContentOverride: {
        paddingTop: 50,
        paddingBottom: 0,
    },
    filterButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterScrollView: {
        maxHeight: 420,
        marginBottom: 8,
    },
    filterContentContainer: {
        paddingBottom: 8,
    },
    filterLabel: {
        marginBottom: 2,
        fontSize: 13,
        fontWeight: 'bold',
    },
    filterView: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    filterButtonLabel: {
        fontWeight: 'bold',
        fontSize: 16,
        paddingVertical: 8,
    },
    collapsedFilterPills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    collapsedFilterPill: {
        marginBottom: 6,
    },
    collapsedFilterPillLabel: {},
    collapsedFilterOverflowLabel: {
        fontWeight: '600',
    },
});