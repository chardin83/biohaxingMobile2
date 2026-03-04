import { useTheme } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { genes } from '@/locales/genes';

export default function GeneDetailsScreen() {
  const { geneId, areaId } = useLocalSearchParams<{ geneId: string; areaId?: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const gene = genes.find(g => g.id === geneId);
  if (!gene) {
    return (
      <Container
        background="gradient"
        gradientKey="sunriseUp"
        gradientLocations={colors.gradients?.sunriseUp?.locations as any}
        onBackPress={() => router.replace(`/dashboard/area/${areaId}`)}
        showBackButton
      >
        <ThemedText type="title3" style={[styles.error, { color: colors.error }]}>
          Gene not found
        </ThemedText>
      </Container>
    );
  }

  // Visa beskrivning för rätt area om areaId finns, annars första area
  const area = areaId
    ? gene.areas.find(a => a.id === areaId)
    : gene.areas[0];

  return (
    <Container
      background="gradient"
      gradientKey="sunrise"
      gradientLocations={colors.gradients?.sunrise?.locations3 as any}
      onBackPress={() => router.replace(`/dashboard/area/${areaId}`)}
      showBackButton
    >
      <Card title={gene.id}>
        <ThemedText type="title2" style={[styles.geneTitle, { color: colors.textSecondary }]}>
          {t(`genes:${gene.titleKey}`)}
        </ThemedText>
        <ThemedText type="default">
          {t(`genes:${area?.descriptionKey}`)}
        </ThemedText>
      </Card>
    </Container>
  );
}

const styles = StyleSheet.create({
  geneTitle: {
    marginBottom: 12,
  },
  error: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
});
