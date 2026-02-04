import React from 'react';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/ThemedText';
import { Gene, GeneArea } from '@/locales/genes';

import { PressableCard } from './PressableCard';

interface GeneCardProps {
  gene: Gene;
  area: GeneArea;
  onPress: () => void;
}

const GeneCard: React.FC<GeneCardProps> = ({ gene, area, onPress }) => {
  const { t } = useTranslation();

  return (
    <PressableCard onPress={onPress}>
      <ThemedText type="title3">{gene.id}</ThemedText>
      <ThemedText type="default">{t(`genes:${area.descriptionKey}`) || ''}</ThemedText>
    </PressableCard>
  );
};

export default GeneCard;
