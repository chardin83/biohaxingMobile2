import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { Colors } from '@/constants/Colors';
import { genes } from '@/locales/genes';

export default function GeneDetailsScreen() {
  const { geneId, areaId } = useLocalSearchParams<{ geneId: string; areaId?: string }>();
  const { t } = useTranslation();

  const gene = genes.find(g => g.id === geneId);
  if (!gene) {
    return (
      <Container background="gradient" gradientKey="sunriseUp" gradientLocations={Colors.dark.gradients.sunriseUp.locations as any}     onBackPress={() => router.replace(`/dashboard/area/${areaId}`)}
      showBackButton>
        <Text style={styles.error}>Gene not found</Text>
      </Container>
    );
  }

  // Visa beskrivning för rätt area om areaId finns, annars första area
  const area = areaId
    ? gene.areas.find(a => a.id === areaId)
    : gene.areas[0];

  return (
    <Container background="gradient" gradientKey="sunrise" gradientLocations={Colors.dark.gradients.sunrise.locations3 as any}     onBackPress={() => router.replace(`/dashboard/area/${areaId}`)}
      showBackButton>
      <Card title={gene.id}>
        <Text style={styles.geneTitle}>{t(`genes:${gene.titleKey}`)}</Text>
        <Text style={styles.geneDescription}>{t(`genes:${area?.descriptionKey}`)}</Text>
      </Card>
    </Container>
  );
}

const styles = StyleSheet.create({
  geneTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
    marginBottom: 12,
  },
  geneDescription: {
    color: Colors.dark.textTertiary,
    fontSize: 16,
    lineHeight: 22,
  },
  error: {
    color: Colors.dark.error,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
});
