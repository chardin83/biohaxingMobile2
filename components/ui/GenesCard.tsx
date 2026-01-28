import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet,Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { genes } from '@/locales/genes';

import { Card } from './Card';

interface GenesCardProps {
  areaId: string;
  title?: string;
  style?: any;
}

export const GenesCard: React.FC<GenesCardProps> = ({ areaId, title = 'DNA & Gener', style }) => {
  const { t } = useTranslation();
  const filteredGenes = genes.filter(gene =>
    gene.areas.some(area => area.id === areaId)
  );

  if (filteredGenes.length === 0) return null;

  return (
    <Card title={title} style={style}>
      <View style={styles.infoSection}>
        <Text style={styles.infoLabel}>🧬 Gener kopplade till området</Text>
        <Text style={styles.infoText}>
          Flera gener påverkar din hälsa och funktion inom detta område:
        </Text>
      </View>
      {filteredGenes.map(gene => {
        const area = gene.areas.find(a => a.id === areaId);
        return (
          <View style={styles.infoSection} key={gene.id}>
            <Text style={styles.infoLabel}>{gene.id}</Text>
            <Text style={styles.infoText}>
              {t(`genes:${area?.descriptionKey}`) || ''}
            </Text>
          </View>
        );
      })}
      <Text style={styles.muted}>
        Genetiska tester kan ge insikt om din profil, men livsstil har alltid störst påverkan!
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  infoSection: {
    marginBottom: 16,
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
  muted: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
});
