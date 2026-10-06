import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
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
    <InformationCardLink title={t(`areas:${areaId}.relatedAreas.sectionTitle`)} iconName="link">
      {dismiss => (
        <>
          {area.relatedAreas.map((link, index) => (
            <PressableCard
              key={link.areaId}
              style={index > 0 ? styles.cardSpacing : undefined}
              onPress={() => {
                dismiss();
                router.push({
                  pathname: '/dashboard/area/[areaId]',
                  params: { areaId: link.areaId },
                });
              }}
            >
              <ThemedText type="title3">{t(`areas:${link.areaId}.title`)}</ThemedText>
              <ThemedText type="default">{t(`areas:${areaId}.relatedAreas.${link.areaId}`)}</ThemedText>
            </PressableCard>
          ))}
        </>
      )}
    </InformationCardLink>
  );
}

const styles = StyleSheet.create({
  cardSpacing: {
    marginTop: 12,
  },
});
