import React from 'react';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/ThemedText';
import { MicrobiomeArea, MicrobiomeBacteria } from '@/locales/microbiome';

import { PressableCard } from './PressableCard';

interface MicrobiomeCardProps {
  bacteria: MicrobiomeBacteria;
  area: MicrobiomeArea;
  onPress: () => void;
}

const MicrobiomeCard: React.FC<MicrobiomeCardProps> = ({ bacteria, area, onPress }) => {
  const { t } = useTranslation();

  return (
    <PressableCard onPress={onPress}>
      <ThemedText type="title3">{bacteria.id}</ThemedText>
      <ThemedText type="default">{t(`microbiome:${area.descriptionKey}`) || ''}</ThemedText>
    </PressableCard>
  );
};

export default MicrobiomeCard;
