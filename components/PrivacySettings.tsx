
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';
import SettingsCard from '@/components/ui/SettingsCard';

import AISharingControls from './AISharingControls';

export default function PrivacySettings() {
  const { t } = useTranslation('common');

  return (
    <Container background="default" showBackButton>
      <View style={styles.headerRow}>
        <ThemedText type="title2">{t('settings.privacy')}</ThemedText>
      </View>

      <ThemedText type="label" style={styles.title} uppercase>
        {t('settings.privacy')}
      </ThemedText>

      <SettingsCard style={styles.cardSpacing}>
        <AISharingControls />
      </SettingsCard>
    </Container>
  );
}

const styles = StyleSheet.create({
  cardSpacing: {
    paddingTop: 16,
    marginTop: 8,
  },
  headerRow: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  title: {
    fontWeight: '700',
  },
  desc: {
    fontSize: 14,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    fontSize: 14,
  },
  disclaimer: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
