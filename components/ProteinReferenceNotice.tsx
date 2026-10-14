import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import Notice from '@/components/ui/Notice';

export default function ProteinReferenceNotice() {
  const { t } = useTranslation('common');
  return <Notice title={t('nutritionGoals.proteinReference.title')} message={t('nutritionGoals.proteinReference.description')} style={styles.notice} />;
}

const styles = StyleSheet.create({ notice: { marginTop: 16 } });
