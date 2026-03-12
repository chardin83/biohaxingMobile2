import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { microbiome } from '@/locales/microbiome';

import { Card } from './Card';
import MicrobiomeCard from './MicrobiomeCard';

interface MicrobiomeListCardProps {
  areaId: string;
  style?: any;
}

const MicrobiomeListCard: React.FC<MicrobiomeListCardProps> = ({ areaId, style }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

   const handleMicrobiomePress = (propbioticId: string) => {
    router.push({
      pathname: "/dashboard/area/[areaId]/microbiome",
      params: { areaId, probioticId: propbioticId },
    });
  };

  const filteredBacteria = microbiome.filter(bacteria =>
    bacteria.areas.some(area => area.id === areaId)
  );

  if (filteredBacteria.length === 0) return null;

  return (
    <Card title={t('microbiomeList.title')} style={style}>
      <View style={styles.infoSection}>
        <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>🦠 {t('microbiomeList.bacteriaLinkedToArea', { area: t(`areas:${areaId}.title`) })}</ThemedText>
        {filteredBacteria.length === 0 ? (
          <ThemedText style={[styles.infoText, { color: colors.textTertiary }]}> {t('microbiomeList.noBacteria')} </ThemedText>
        ) : (
          <ThemedText style={[styles.infoText, { color: colors.textTertiary }]}> {t('microbiomeList.bacteriaAffectHealth')} </ThemedText>
        )}
      </View>
      {filteredBacteria.map(bacteria => {
        const area = bacteria.areas.find(a => a.id === areaId);
        if (!area) return null;
        return (
          <MicrobiomeCard onPress={() => handleMicrobiomePress(bacteria.id)} key={bacteria.id} bacteria={bacteria} area={area} />
        );
      })}
      <ThemedText type="explainer" style={[globalStyles.explainer, { color: colors.textMuted, borderColor: colors.borderLight }]}> {t('microbiomeList.explainer')} </ThemedText>
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

export default MicrobiomeListCard;
