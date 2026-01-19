import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity,View } from 'react-native';

import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import LabeledInput from '@/components/ui/LabeledInput';
import { Colors } from '@/constants/Colors';
import { tips } from '@/locales/tips';

export default function TipsSearchScreen() {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [showFilter, setShowFilter] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [selectedPlanCategory, setSelectedPlanCategory] = useState<string | null>(null);

    const allPlanCategories = useMemo(
        () =>
            [...new Set(tips.map(tip => tip.planCategory ?? 'other'))]
                .sort((a, b) => t('common:planCategory.' + a).localeCompare(t('common:planCategory.' + b))),
        [tips, t]
    );

    const filteredTips = useMemo(() => {
        const q = query.trim().toLowerCase();
        return tips
            .filter(tip =>
                (!selectedArea || tip.areas.some(a => a.id === selectedArea)) &&
                (!selectedLevel || (tip.level ?? 1) === selectedLevel) &&
                (!selectedPlanCategory || (tip.planCategory ?? 'other') === selectedPlanCategory) &&
                (
                    !q ||
                    t('tips:' + tip.title).toLowerCase().includes(q) ||
                    t('tips:' + tip.descriptionKey).toLowerCase().includes(q)
                )
            )
            .sort((a, b) =>
                t('tips:' + a.title).localeCompare(t('tips:' + b.title))
            );
    }, [query, t, selectedArea, selectedLevel, selectedPlanCategory]);

    const matchCount = filteredTips.length;

    const activeFilterCount =
        (selectedArea ? 1 : 0) +
        (selectedLevel ? 1 : 0) +
        (selectedPlanCategory ? 1 : 0);

    const allLevels = [...new Set(tips.map(tip => tip.level ?? 1))].sort((a, b) => a - b);

    return (
        <LinearGradient
            colors={Colors.dark.gradients.sunrise.colors as any}
            locations={Colors.dark.gradients.sunrise.locations as any}
            start={Colors.dark.gradients.sunrise.start}
            end={Colors.dark.gradients.sunrise.end}
            style={styles.container}
        >
            <LabeledInput
                label={t('search.label')}
                value={query}
                onChangeText={setQuery}
                containerStyle={styles.inputMargin}
            />
            {showFilter && (
                <>
                    {/* Area-filter */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                        {[...new Set(tips.flatMap(tip => tip.areas.map(a => a.id)))].map(areaId => (
                            <Badge
                                key={areaId}
                                variant="overlay"
                                style={[
                                    styles.toggleBadge,
                                    selectedArea === areaId && { backgroundColor: Colors.dark.accentDefault },
                                ]}
                                onPress={() => setSelectedArea(selectedArea === areaId ? null : areaId)}
                            >
                                <Text style={styles.badgeLabel}>
                                    {t('areas:' + areaId + '.title')}
                                </Text>
                            </Badge>
                        ))}
                    </View>
                    {/* Level-filter */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                        {allLevels.map(level => (
                            <Badge
                                key={level}
                                variant="overlay"
                                style={[
                                    styles.toggleBadge,
                                    selectedLevel === level && { backgroundColor: Colors.dark.accentDefault },
                                ]}
                                onPress={() => setSelectedLevel(selectedLevel === level ? null : level)}
                            >
                                <Text style={styles.badgeLabel}>{`Level ${level}`}</Text>
                            </Badge>
                        ))}
                    </View>
                    {/* PlanCategory-filter */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                        {allPlanCategories.map(cat => (
                            <Badge
                                key={cat}
                                variant="overlay"
                                style={[
                                    styles.toggleBadge,
                                    selectedPlanCategory === cat && { backgroundColor: Colors.dark.accentDefault },
                                ]}
                                onPress={() => setSelectedPlanCategory(selectedPlanCategory === cat ? null : cat)}
                            >
                                <Text style={styles.badgeLabel}>{t('common:planCategory.' + cat)}</Text>
                            </Badge>
                        ))}
                    </View>
                </>
            )}
            <TouchableOpacity onPress={() => setShowFilter(v => !v)} style={{ marginBottom: 8 }}>
                <Text style={{ color: Colors.dark.accentDefault, fontWeight: 'bold', fontSize: 16 }}>
                    {`Filter (${activeFilterCount}st)`}
                </Text>
            </TouchableOpacity>
            <Text style={{ color: Colors.dark.textSecondary, fontSize: 16, marginBottom: 12 }}>
                {`Resultat: (${matchCount}st)`}
            </Text>
            <FlatList
                data={filteredTips}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <Card>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={styles.title}>{t('tips:' + item.title)}</Text>
                            <Badge variant="overlay" style={[styles.toggleBadge, { backgroundColor: Colors.dark.accentDefault, marginLeft: 8 }]}>
                                <Text style={[styles.badgeLabel, { fontWeight: 'bold' }]}>
                                    {`Level ${item.level ?? 1}`}
                                </Text>
                            </Badge>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
                            {item.areas.map(a => (
                                <Badge
                                    key={a.id}
                                    variant="overlay"
                                    style={styles.toggleBadge}
                                >
                                    <Text style={styles.badgeLabel}>
                                        {t('areas:' + a.id + '.title')}
                                    </Text>
                                </Badge>
                            ))}
                        </View>
                        <Text style={styles.desc}>{t('tips:' + item.descriptionKey)}</Text>
                    </Card>
                )}
                ListEmptyComponent={<Text style={styles.empty}>Inga tips hittades.</Text>}
            />
            <View style={styles.levelFilter}>
                <Text style={styles.levelLabel}>Nivå:</Text>
                {allLevels.map(level => (
                    <Badge
                        key={level}
                        variant="overlay"
                        style={styles.levelBadge}
                        onPress={() => setSelectedLevel(selectedLevel === level ? null : level)}
                    >
                        <Text style={styles.levelLabel}>
                            {level}
                        </Text>
                    </Badge>
                ))}
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        paddingTop: 80,
        // Bakgrundsfärg sätts av LinearGradient
    },
    title: { fontWeight: 'bold', fontSize: 16, marginBottom: 4, color: Colors.dark.textPrimary },
    desc: { color: Colors.dark.textSecondary, marginBottom: 4 },
    badgeRow: {
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
        color: Colors.dark.text,
        fontSize: 12,
    },
    toggleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        marginBottom: 8,
    },
    areas: { color: Colors.dark.textSecondary, fontSize: 12 },
    empty: { textAlign: 'center', color: Colors.dark.textSecondary, marginTop: 40 },
    inputMargin: { marginBottom: 20 },
    filterButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: Colors.dark.accentDefault,
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelFilter: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    levelLabel: { color: Colors.dark.textSecondary, fontSize: 12 },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        marginBottom: 8,
    },
});