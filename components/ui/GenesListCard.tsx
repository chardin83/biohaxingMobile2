import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
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
  const { colors } = useTheme();
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
        <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>🧬 Gener kopplade till området</ThemedText>
        <ThemedText style={[styles.infoText, { color: colors.textTertiary }]}>
          Flera gener påverkar din hälsa och funktion inom detta område:
        </ThemedText>
      </View>
      {filteredGenes.map(gene => {
        const area = gene.areas.find(a => a.id === areaId);
        if (!area) return null;
        return (
          <GeneCard key={gene.id} gene={gene} area={area} onPress={() => handleGenePress(gene.id)} />
        );
      })}
      <ThemedText style={[styles.muted, { color: colors.textMuted }]}>
        Genetiska tester kan ge insikt om din profil, men livsstil har alltid störst påverkan!
      </ThemedText>
    </Card>
  );
};

const styles = StyleSheet.create({
  infoSection: {
    marginBottom: 16,
  },
  infoLabel: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  muted: {
    fontSize: 12,
    marginTop: 6,
  },
});

export default GenesListCard;
