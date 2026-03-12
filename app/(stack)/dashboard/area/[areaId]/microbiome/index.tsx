import { useTheme } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { microbiome } from '@/locales/microbiome';

export default function MicrobiomeDetailsScreen() {
  const { probioticId, areaId } = useLocalSearchParams<{ probioticId: string; areaId?: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const probiotic = microbiome.find(b => b.id === probioticId);
  if (!probiotic) {
    return (
      <Container
        background="gradient"
        gradientKey="sunriseUp"
        gradientLocations={colors.gradients?.sunriseUp?.locations as any}
        onBackPress={() => router.replace(`/dashboard/area/${areaId}`)}
        showBackButton
      >
        <ThemedText type="title3" style={[styles.error, { color: colors.error }]}>Probiotika saknas</ThemedText>
      </Container>
    );
  }

  // Visa beskrivning för rätt area om areaId finns, annars första area
  const area = areaId
    ? probiotic.areas.find(a => a.id === areaId)
    : probiotic.areas[0];

  return (
    <Container
      background="gradient"
      gradientKey="sunrise"
      gradientLocations={colors.gradients?.sunrise?.locations3 as any}
      onBackPress={() => router.replace(`/dashboard/area/${areaId}`)}
      showBackButton
    >
      <Card title={probiotic.id}>
        <ThemedText type="title2" style={[styles.probioticTitle, { color: colors.textSecondary }]}> {t(`microbiome:${probiotic.titleKey}`)} </ThemedText>
        <ThemedText type="default"> {t(`microbiome:${area?.descriptionKey}`)} </ThemedText>
      </Card>
    </Container>
  );
}

const styles = StyleSheet.create({
  probioticTitle: {
    marginBottom: 12,
  },
  error: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
});
