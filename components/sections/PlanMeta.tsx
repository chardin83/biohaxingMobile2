import { TFunction } from 'i18next';
import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

type PlanMetaProps = {
  startedAt: string;
  createdBy?: string;
  t: TFunction;
  formatDate: (isoDate: string) => string;
};

export const PlanMeta: React.FC<PlanMetaProps> = ({ startedAt, createdBy, t, formatDate }) => (
  <ThemedText type="caption" style={styles.trainingMeta}>
    {t('plan.trainingActiveSince', {
      date: formatDate(startedAt),
    })}
    {createdBy ? ` • ${t('plan.createdBy', { name: createdBy })}` : ''}
  </ThemedText>
);

const styles = StyleSheet.create({
  trainingMeta: {
    marginTop: -10,
  },
});
