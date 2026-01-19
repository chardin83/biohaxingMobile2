import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import LabeledInput from '@/components/ui/LabeledInput';
import { Colors } from '@/constants/Colors';
import { tips } from '@/locales/tips';

export default function TipsSearchScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filteredTips = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tips;
    return tips.filter(tip =>
      t('tips:' + tip.title).toLowerCase().includes(q) ||
      t('tips:' + tip.descriptionKey).toLowerCase().includes(q) ||
      tip.areas.some(area => t('areas:' + area.id + '.title').toLowerCase().includes(q))
    );
  }, [query, t]);

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
    paddingTop: 120,
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
  inputMargin: { marginBottom: 40 },
});