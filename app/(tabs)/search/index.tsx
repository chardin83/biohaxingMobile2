import { useTheme } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import LabeledInput from '@/components/ui/LabeledInput';
import { bodyParts as allBodyParts } from '@/locales/bodyParts';
import { tips } from '@/locales/tips';
import { PlanCategory } from '@/types/planCategory';

export default function TipsSearchScreen() {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [showFilter, setShowFilter] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [selectedPlanCategory, setSelectedPlanCategory] = useState<string | null>(null);
    const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
    const { colors } = useTheme();

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
                (!selectedArea || tip.areas.some(a => a.id === selectedArea)) &&
                (!selectedLevel || (tip.level ?? 1) === selectedLevel) &&
                (!selectedPlanCategory || (tip.planCategory ?? ['other' as PlanCategory]).includes(selectedPlanCategory as PlanCategory)) &&
                (!selectedBodyPart || (tip.bodyParts ?? []).includes(selectedBodyPart)) &&
                (
                    !q ||
                    t('tips:' + tip.title).toLowerCase().includes(q) ||
                    t('tips:' + tip.descriptionKey).toLowerCase().includes(q)
                )
            )
            .sort((a, b) =>
                t('tips:' + a.title).localeCompare(t('tips:' + b.title))
            );
    }, [query, t, selectedArea, selectedLevel, selectedPlanCategory, selectedBodyPart]);

    const matchCount = filteredTips.length;

    const activeFilterCount =
        (selectedArea ? 1 : 0) +
        (selectedLevel ? 1 : 0) +
        (selectedPlanCategory ? 1 : 0) +
        (selectedBodyPart ? 1 : 0);

    const allLevels = [...new Set(tips.map(tip => tip.level ?? 1))].sort((a, b) => a - b);

    return (
        <Container background="gradient" gradientKey='sunrise' gradientLocations={colors.gradients.sunrise.locations1 as any} scrollable={false} style={styles.container} >
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
                                    selectedArea === areaId && { backgroundColor: colors.accentDefault },
                                ]}
                                onPress={() => setSelectedArea(selectedArea === areaId ? null : areaId)}
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
                                    selectedLevel === level && { backgroundColor: colors.accentDefault },
                                ]}
                                onPress={() => setSelectedLevel(selectedLevel === level ? null : level)}
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
                                    selectedPlanCategory === cat && { backgroundColor: colors.accentDefault },
                                ]}
                                onPress={() => setSelectedPlanCategory(selectedPlanCategory === cat ? null : cat)}
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
                                    selectedBodyPart === bp.id && { backgroundColor: colors.accentDefault },
                                ]}
                                onPress={() => setSelectedBodyPart(selectedBodyPart === bp.id ? null : bp.id)}
                            >
                                <ThemedText type="caption" style={styles.badgeLabel}>{t('bodyParts.' + bp.id)}</ThemedText>
                            </Badge>
                        ))}
                    </View>
                </ScrollView>
            )}
            <TouchableOpacity onPress={() => setShowFilter(v => !v)}>
                <ThemedText type="default" style={[styles.filterButtonLabel, { color: colors.accentDefault }]}>
                    {`Filter (${activeFilterCount}st)`}
                </ThemedText>
            </TouchableOpacity>
            <ThemedText type="default" style={styles.resultCount}>
                {`Resultat: (${matchCount}st)`}
            </ThemedText>
            <FlatList
                data={filteredTips}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <Card>
                        <View style={styles.titleRow}>
                            <ThemedText type="title3" style={styles.title}>{t('tips:' + item.title)}</ThemedText>
                            <Badge variant="overlay" style={[styles.toggleBadge, styles.levelBadge, { backgroundColor: colors.accentDefault }]}>
                                <ThemedText type="caption" style={[styles.badgeLabel, styles.bold]}>
                                    {`${t('common:filter.level')} ${item.level ?? 1}`}
                                </ThemedText>
                            </Badge>
                        </View>
                        <View style={styles.areaBadgeRow}>
                            {item.areas.map(a => (
                                <Badge
                                    key={a.id}
                                    variant="overlay"
                                    style={styles.toggleBadge}
                                >
                                    <ThemedText type="caption" style={styles.badgeLabel}>
                                        {t('areas:' + a.id + '.title')}
                                    </ThemedText>
                                </Badge>
                            ))}
                        </View>
                        <ThemedText type="default" style={styles.desc}>{t('tips:' + item.descriptionKey)}</ThemedText>
                    </Card>
                )}
                ListEmptyComponent={<ThemedText type="default" style={styles.empty}>Inga tips hittades.</ThemedText>}
            />
        </Container>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        paddingTop: 80,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
    desc: { marginBottom: 4 },
    areaBadgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
        marginBottom: 8,
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
    levelBadge: {
        marginLeft: 8,
    },
    areas: { fontSize: 12 },
    empty: { textAlign: 'center', marginTop: 40 },
    inputMargin: { marginBottom: 20 },
    resultCount: { fontSize: 16, marginBottom: 12 },
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
});