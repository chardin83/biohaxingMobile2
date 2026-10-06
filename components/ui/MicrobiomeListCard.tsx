import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { microbiome } from '@/locales/microbiome';

import { InformationCardLink } from './InformationCardLink';
import MicrobiomeCard from './MicrobiomeCard';
import MicrobiomeDetailsBottomSheet from './MicrobiomeDetailsBottomSheet';

interface MicrobiomeListCardProps {
  areaId: string;
  style?: any;
  bacteriaAffectHealthKey?: string;
}

const MicrobiomeListCard: React.FC<MicrobiomeListCardProps> = ({ areaId, style, bacteriaAffectHealthKey }) => {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();

  const [selectedBacteriaId, setSelectedBacteriaId] = useState<string | null>(null);

  const filteredBacteria = microbiome.filter(bacteria => bacteria.areas.some(area => area.id === areaId));

  const areaSpecificDescriptionKey = bacteriaAffectHealthKey ?? `microbiomeList.bacteriaAffectHealthByArea.${areaId}`;
  const bacteriaAffectHealthText = i18n.exists(areaSpecificDescriptionKey) ? t(areaSpecificDescriptionKey) : t('microbiomeList.bacteriaAffectHealth');

  if (filteredBacteria.length === 0) return null;

  return (
    <>
      <InformationCardLink title={t('microbiomeList.title')} iconName="microbiome" style={style}>
        <View style={styles.infoSection}>
          <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>
            🦠 {t('microbiomeList.bacteriaLinkedToArea', { area: t(`areas:${areaId}.title`) })}
          </ThemedText>
          {filteredBacteria.length === 0 ? (
            <ThemedText style={[styles.infoText, { color: colors.textTertiary }]}> {t('microbiomeList.noBacteria')} </ThemedText>
          ) : (
            <ThemedText style={[styles.infoText, { color: colors.textTertiary }]}> {bacteriaAffectHealthText} </ThemedText>
          )}
        </View>
        {filteredBacteria.map(bacteria => {
          const area = bacteria.areas.find(a => a.id === areaId);
          if (!area) return null;
          return <MicrobiomeCard onPress={() => setSelectedBacteriaId(bacteria.id)} key={bacteria.id} bacteria={bacteria} area={area} />;
        })}
        <ThemedText type="explainer" style={[globalStyles.explainer, { color: colors.textMuted, borderColor: colors.borderLight }]}>
          {' '}
          {t('microbiomeList.explainer')}{' '}
        </ThemedText>
      </InformationCardLink>
      <MicrobiomeDetailsBottomSheet bacteriaId={selectedBacteriaId} areaId={areaId} onDismiss={() => setSelectedBacteriaId(null)} />
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

export default MicrobiomeListCard;
