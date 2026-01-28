
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet,Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { genes } from '@/locales/genes';

import { Card } from './Card';
import GeneCard from './GeneCard';

interface GenesListCardProps {
  areaId: string;
  title?: string;
  style?: any;
}

const GenesListCard: React.FC<GenesListCardProps> = ({ areaId, title = 'DNA & Gener', style }) => {
  const router = useRouter();
  const filteredGenes = genes.filter(gene =>
    gene.areas.some(area => area.id === areaId)
  );

  if (filteredGenes.length === 0) return null;

  const handleGenePress = (geneId: string) => {
    router.push({
      pathname: "/dashboard/area/[areaId]/gene",
      params: { areaId, geneId },
    });
  };

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
        if (!area) return null;
        return (
          <GeneCard key={gene.id} gene={gene} area={area} onPress={() => handleGenePress(gene.id)} />
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

export default GenesListCard;
