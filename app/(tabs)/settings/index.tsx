import React from 'react';
import { useTranslation } from 'react-i18next';

import HealthSyncSettings from '@/components/HealthSyncSettings';
import LanguageSelector from '@/components/LanguageSelector';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <Container background="default">
      <ThemedText type="title2">{t('layout.settings', { defaultValue: 'Settings' })}</ThemedText>
      <LanguageSelector />
      <HealthSyncSettings />
    </Container>
  );
}
