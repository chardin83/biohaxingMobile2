import { useTheme } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { PressableCard } from '@/components/ui/PressableCard';
import { microbiome } from '@/locales/microbiome';
import { tips } from '@/locales/tips';

export default function MicrobiomeDetailsScreen() {
  const { probioticId, areaId } = useLocalSearchParams<{ probioticId: string; areaId?: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const probiotic = microbiome.find(b => b.id === probioticId);
  const relatedTips = React.useMemo(
    () => tips.filter(tip => tip.microbiomeIds?.includes(probioticId)),
    [probioticId]
  );

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

  const handleTipPress = (tipId: string, tipAreaIds: string[]) => {
    const targetAreaId = areaId && tipAreaIds.includes(areaId) ? areaId : tipAreaIds[0];

    if (!targetAreaId) {
      return;
    }

    router.push({
      pathname: `/dashboard/area/${targetAreaId}/details` as any,
      params: {
        tipId,
      },
    });
  };

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
      {relatedTips.length > 0 && (
        <Card title="Kopplade tips">
          <View style={styles.relatedTipsList}>
            {relatedTips.map(tip => (
              <PressableCard
                key={tip.id}
                onPress={() => handleTipPress(tip.id, tip.areas.map(item => item.id))}
                style={styles.relatedTipCard}
              >
                <ThemedText type="title3" style={styles.relatedTipTitle}>
                  {t(`tips:${tip.title}`)}
                </ThemedText>
                <ThemedText type="default">
                  {t(`tips:${tip.descriptionKey}`)}
                </ThemedText>
              </PressableCard>
            ))}
          </View>
        </Card>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  probioticTitle: {
    marginBottom: 12,
  },
  relatedTipsList: {
    gap: 12,
  },
  relatedTipCard: {
    marginBottom: 0,
  },
  relatedTipTitle: {
    marginBottom: 6,
  },
  error: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
});
