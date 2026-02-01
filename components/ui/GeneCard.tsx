import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Gene, GeneArea } from '@/locales/genes';

interface GeneCardProps {
  gene: Gene;
  area: GeneArea;
  onPress: () => void;
}

const GeneCard: React.FC<GeneCardProps> = ({ gene, area, onPress }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Pressable
      style={[
        styles.infoSection,
        {
          backgroundColor: colors.cardBackground ,
          borderColor: colors.accentVeryWeak,
        },
      ]}
      onPress={onPress}
    >
      <ThemedText type="title3">
        {gene.id}
      </ThemedText>
      <ThemedText type="default">
        {t(`genes:${area.descriptionKey}`) || ''}
      </ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  infoSection: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});

export default GeneCard;
