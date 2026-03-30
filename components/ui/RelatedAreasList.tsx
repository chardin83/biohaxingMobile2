import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { PressableCard } from '@/components/ui/PressableCard';
import { areas } from '@/locales/areas';

interface RelatedAreasListProps {
  areaId: string;
}

export default function RelatedAreasList({ areaId }: Readonly<RelatedAreasListProps>) {
  const { t } = useTranslation();

  const area = areas.find(a => a.id === areaId);
  if (!area?.relatedAreas?.length) return null;

  return (
    <Card title={t(`areas:${areaId}.relatedAreas.sectionTitle`)}>
      {area.relatedAreas.map((link, index) => (
        <PressableCard
          key={link.areaId}
          style={index > 0 ? styles.cardSpacing : undefined}
          onPress={() => {
            router.push({
              pathname: '/dashboard/area/[areaId]',
              params: { areaId: link.areaId },
            });
          }}
        >
          <ThemedText type="title3">
            {t(`areas:${link.areaId}.title`)}
          </ThemedText>
          <ThemedText type="default">
            {t(`areas:${areaId}.relatedAreas.${link.areaId}`)}
          </ThemedText>
        </PressableCard>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardSpacing: {
    marginTop: 12,
  },
});
