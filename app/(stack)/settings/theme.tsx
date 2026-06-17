import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/ThemedText';
import ThemeSelector from '@/components/ThemeSelector';
import Container from '@/components/ui/Container';

export default function ThemePage() {
  const { t } = useTranslation('common');

  return (
    <Container background="default" showBackButton>
      <ThemedText type="title2">{t('themeSelector.title')}</ThemedText>
      <ThemedText type="label">{t('themeSelector.subtitle')}</ThemedText>
      <ThemeSelector />
    </Container>
  );
}
