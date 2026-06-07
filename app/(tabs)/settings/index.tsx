import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import HealthSyncSettings from '@/components/HealthSyncSettings';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';

export default function SettingsPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Container background="default" contentContainerStyle={{ paddingTop: 40 }}>
      <ThemedText type="title2">{t('layout.settings', { defaultValue: 'Settings' })}</ThemedText>
      <HealthSyncSettings />
    </Container>
  );
}
