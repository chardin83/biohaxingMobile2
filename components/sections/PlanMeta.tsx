import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

type PlanMetaProps = {
  startedAt: string;
  createdBy?: string;
  formatDate: (isoDate: string) => string;
};

export const PlanMeta: React.FC<PlanMetaProps> = ({ startedAt, createdBy, formatDate }) => {
  const { t } = useTranslation();
  return (
    <ThemedText type="explainer" style={styles.meta}>
      {t('planMeta.activeSince', {
        date: formatDate(startedAt),
      })}
      {createdBy ? ` • ${t('planMeta.createdBy', { name: createdBy })}` : ''}
    </ThemedText>
  );
};

const styles = StyleSheet.create({
  meta: {
        marginTop: -10,
  },
});
