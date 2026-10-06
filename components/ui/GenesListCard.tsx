import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { genes } from '@/locales/genes';

import GeneCard from './GeneCard';
import GeneDetailsBottomSheet from './GeneDetailsBottomSheet';
import { InformationCardLink } from './InformationCardLink';

interface GenesListCardProps {
  areaId: string;
  style?: StyleProp<ViewStyle>;
}

const GenesListCard: React.FC<GenesListCardProps> = ({ areaId, style }) => {
  const [selectedGeneId, setSelectedGeneId] = useState<string | null>(null);
  const { colors } = useTheme();
  const { t } = useTranslation();

  const filteredGenes = genes.filter(gene => gene.areas.some(area => area.id === areaId));

  if (filteredGenes.length === 0) return null;

  return (
    <>
      <InformationCardLink title={t('genesList.title')} iconName="dna" style={style}>
        {
          <>
            <View style={styles.infoSection}>
              <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>
                🧬 {t('genesList.genesLinkedToArea', { area: t(`areas:${areaId}.title`) })}
              </ThemedText>
              <ThemedText style={[styles.infoText, { color: colors.textTertiary }]}>{t('genesList.genesAffectHealth')}</ThemedText>
            </View>
            {filteredGenes.map(gene => {
              const area = gene.areas.find(a => a.id === areaId);
              if (!area) return null;
              return <GeneCard key={gene.id} gene={gene} area={area} onPress={() => setSelectedGeneId(gene.id)} />;
            })}
            <ThemedText type="explainer" style={[globalStyles.explainer, { color: colors.textMuted, borderColor: colors.borderLight }]}>
              {t('genesList.explainer')}
            </ThemedText>
          </>
        }
      </InformationCardLink>
      <GeneDetailsBottomSheet geneId={selectedGeneId} areaId={areaId} onDismiss={() => setSelectedGeneId(null)} />
    </>
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
