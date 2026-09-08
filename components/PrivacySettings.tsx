
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';
import { SettingsCardLink } from '@/components/ui/SettingsCardLink';

export default function PrivacySettings() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Container background="default" showBackButton>
      <View style={styles.headerRow}>
        <ThemedText type="title2">{t('settings.privacy')}</ThemedText>
      </View>

      <SettingsCardLink
        title={t('privacy.dataSharing.title')}
        subtitle={t('privacy.dataSharing.subtitle')}
        iconName="public"
        onPress={() => router.push('/(stack)/settings/data-sharing')}
        style={styles.cardSpacing}
      />

      <SettingsCardLink
        title={t('privacy.person.title')}
        subtitle={t('privacy.person.subtitle')}
        iconName="person"
        onPress={() => router.push('/(stack)/settings/person')}
        style={styles.cardSpacing}
      />

      <SettingsCardLink
        title={t('privacy.deleteData.title')}
        subtitle={t('privacy.deleteData.subtitle')}
        iconName="trash"
        iconColor={colors.error}
        onPress={() => router.push('/(stack)/settings/delete-data')}
        style={styles.cardSpacing}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  cardSpacing: {
    marginTop: 8,
  },
  headerRow: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
