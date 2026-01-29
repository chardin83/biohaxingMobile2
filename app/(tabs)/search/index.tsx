import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView,StyleSheet, Text, TouchableOpacity,View } from 'react-native';

import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import LabeledInput from '@/components/ui/LabeledInput';
import { Colors } from '@/constants/Colors';
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
        <Container background="gradient" gradientKey='sunrise' gradientLocations={Colors.dark.gradients.sunrise.locations1 as any}>
        
            <LabeledInput
                label={t('search.label')}
                value={query}
                onChangeText={setQuery}
                containerStyle={styles.inputMargin}
            />
            {showFilter && (
                <ScrollView
                    style={{ maxHeight: 420, marginBottom: 8 }}
                    contentContainerStyle={{ paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Area-filter */}
                    <Text style={{ color: Colors.dark.textSecondary, marginBottom: 2, fontSize: 13, fontWeight: 'bold' }}>
                        {t('common:filter.area')}
                    </Text>
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
                    <Text style={{ color: Colors.dark.textSecondary, marginBottom: 2, fontSize: 13, fontWeight: 'bold' }}>
                        {t('common:filter.level')}
                    </Text>
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
                                <Text style={styles.badgeLabel}>{`${level}`}</Text>
                            </Badge>
                        ))}
                    </View>
                    {/* PlanCategory-filter */}
                    <Text style={{ color: Colors.dark.textSecondary, marginBottom: 2, fontSize: 13, fontWeight: 'bold' }}>
                        {t('common:filter.planCategory')}
                    </Text>
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
                    {/* BodyPart-filter */}
                    <Text style={{ color: Colors.dark.textSecondary, marginBottom: 2, fontSize: 13, fontWeight: 'bold' }}>
                        {t('common:filter.bodyPart')}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                        {allBodyParts.map(bp => (
                            <Badge
                                key={bp.id}
                                variant="overlay"
                                style={[
                                styles.toggleBadge,
                                selectedBodyPart === bp.id && { backgroundColor: Colors.dark.accentDefault },
                                ]}
                                onPress={() => setSelectedBodyPart(selectedBodyPart === bp.id ? null : bp.id)}
                            >
                                <Text style={styles.badgeLabel}>{t('bodyParts.' + bp.id)}</Text>
                            </Badge>
                            ))}
                    </View>
                </ScrollView>
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
                                    {`${t('common:filter.level')} ${item.level ?? 1}`}
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
            </Container>
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
});