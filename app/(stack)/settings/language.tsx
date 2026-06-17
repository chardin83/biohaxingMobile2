import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import LanguageSelector from '@/components/LanguageSelector';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';

export default function LanguageSettingsPage() {
  const { t } = useTranslation('common');
  const { colors } = useTheme();

  return (
    <Container background="default" showBackButton>
      <View style={styles.headerRow}>
        <ThemedText type="title2">{t('languageSelector.title')}</ThemedText>
        <ThemedText type="caption" style={styles.subtitle}>{t('languageSelector.subtitle')}</ThemedText>
      </View>

      <View style={[styles.selectorContainer, { backgroundColor: colors.background }]}> 
        <LanguageSelector />
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  subtitle: {
    marginTop: 6,
  },
  selectorContainer: {
    marginHorizontal: 0,
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 0,
  },
});
