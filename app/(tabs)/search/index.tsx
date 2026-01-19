import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity,View } from 'react-native';

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

    const filteredTips = useMemo(() => {
        const q = query.trim().toLowerCase();
        return tips.filter(tip =>
            (!selectedArea || tip.areas.some(a => a.id === selectedArea)) &&
            (
                !q ||
                t('tips:' + tip.title).toLowerCase().includes(q) ||
                t('tips:' + tip.descriptionKey).toLowerCase().includes(q)
            )
        );
    }, [query, t, selectedArea]);

    const matchCount = filteredTips.length;

    const activeFilterCount = selectedArea ? 1 : 0;

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
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
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
                    <Card title={t('tips:' + item.title)}>
                        <Text style={styles.desc}>{t('tips:' + item.descriptionKey)}</Text>
                        <View style={styles.badgeRow}>
                            {item.areas.map(a => (
                                <Badge
                                    key={a.id}
                                    variant="overlay"
                                    style={styles.toggleBadge} // eller styles.trainingBadge om du vill ha exakt samma
                                >
                                    <Text style={styles.badgeLabel}>
                                        {t('areas:' + a.id + '.title')}
                                    </Text>
                                </Badge>
                            ))}
                        </View>
                    </Card>
                )}
                ListEmptyComponent={<Text style={styles.empty}>Inga tips hittades.</Text>}
            />
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
});