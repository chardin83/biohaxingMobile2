import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { formatDate } from '@/utils/dateUtils';

type PlanMetaProps = {
  startedAt: string;
  createdBy?: string;
};

export const PlanMeta: React.FC<PlanMetaProps> = ({ startedAt, createdBy }) => {
  const { t, i18n } = useTranslation();
  const createdByText = createdBy
    ? t('planMeta.createdBy', { name: createdBy === 'you' ? t('general.you') : createdBy })
    : '';

  return (
    <ThemedText type="explainer" style={styles.meta}>
      {t('planMeta.activeSince', {
        date: formatDate(startedAt, i18n.language),
      })}
      {createdByText ? ` • ${createdByText}` : ''}
    </ThemedText>
  );
};

const styles = StyleSheet.create({
  meta: {
        marginTop: -10,
  },
});
