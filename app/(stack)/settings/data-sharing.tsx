import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import AISharingControls from '@/components/AISharingControls';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';
import SettingsCard from '@/components/ui/SettingsCard';

export default function DataSharingPage() {
  const { t } = useTranslation('common');

  return (
    <Container background="default" showBackButton>
      <View style={styles.headerRow}>
        <ThemedText type="title2">{t('privacy.dataSharing.title')}</ThemedText>
      </View>

      <ThemedText type="label" style={styles.title} uppercase>
        {t('privacy.dataSharing.title')}
      </ThemedText>

      <SettingsCard style={styles.cardSpacing}>
        <AISharingControls />
      </SettingsCard>
    </Container>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  title: {
    fontWeight: '700',
    marginTop: 8,
    marginLeft: 16,
  },
  cardSpacing: {
    marginTop: 8,
    marginHorizontal: 0,
  },
});
