import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/Colors';
import { Gene, GeneArea } from '@/locales/genes';

interface GeneCardProps {
  gene: Gene;
  area: GeneArea;
  onPress: () => void;
}

const GeneCard: React.FC<GeneCardProps> = ({ gene, area, onPress }) => {
  const { t } = useTranslation();
  return (
    <Pressable style={styles.infoSection} onPress={onPress}>
      <Text style={styles.infoLabel}>{gene.id}</Text>
      <Text style={styles.infoText}>{t(`genes:${area.descriptionKey}`) || ''}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  infoSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.accentVeryWeak,
  },
  infoLabel: {
    color: Colors.dark.textSecondary,
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 6,
  },
  infoText: {
    color: Colors.dark.textTertiary,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default GeneCard;
