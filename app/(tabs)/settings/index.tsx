import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import HealthSyncSettings from '@/components/HealthSyncSettings';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';
import { SettingsCardLink } from '@/components/ui/SettingsCardLink';
import { LANGUAGE_DISPLAY } from '@/constants/languages';

const STORAGE_KEY = 'preferredLanguage';

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedLabel, setSelectedLabel] = React.useState<string>('');
  const [themeLabel, setThemeLabel] = React.useState<string>(t('themeSelector.device'));

  React.useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          setSelectedLabel(t('languageSelector.device'));
          return;
        }
        if (stored === 'device') {
          setSelectedLabel(t('languageSelector.device'));
        } else if (stored === 'sv') {
          setSelectedLabel(LANGUAGE_DISPLAY.sv);
        } else {
          setSelectedLabel(LANGUAGE_DISPLAY.en);
        }
      } catch {
        // handle without using an identifier
      }
    };
    load();
  }, [t]);

  React.useEffect(() => {
    const loadTheme = async () => {
      try {
        const v = await AsyncStorage.getItem('preferredTheme');
        if (v === 'light') setThemeLabel(t('themeSelector.light'));
        else if (v === 'dark') setThemeLabel(t('themeSelector.dark'));
        else setThemeLabel(t('themeSelector.device'));
      } catch {
        // ignore
      }
    };
    loadTheme();
  }, [t]);

  const onPressLanguage = () => {
    router.push('/(stack)/settings/language');
  };

  return (
    <Container background="default">
      <View style={styles.headerRow}>
        <ThemedText type="title2">{t('layout.settings')}</ThemedText>
      </View>

      <ThemedText type="label" style={styles.title} uppercase>
        {t('settings.preferences')}
      </ThemedText>

      <SettingsCardLink
        rows={[
          {
            key: 'language',
            title: t('languageSelector.title', { defaultValue: 'Language' }),
            value: selectedLabel,
            iconName: 'public',
            onPress: onPressLanguage,
          },
          {
            key: 'theme',
            title: t('themeSelector.title', { defaultValue: 'Theme' }),
            value: themeLabel,
            iconName: 'settings',
            onPress: () => router.push('/(stack)/settings/theme'),
          },
        ]}
        style={styles.cardSpacing}
      />

      <ThemedText type="label" style={styles.title} uppercase>
        {t('settings.integrations')}
      </ThemedText>

      <HealthSyncSettings style={styles.cardSpacing} />
      <ThemedText type="label" style={styles.title} uppercase>
        {t('settings.privacy')}
      </ThemedText>

      <SettingsCardLink
        title={t('settings.privacy')}
        subtitle={t('settings.privacySubtitle')}
        iconName="privacy"
        onPress={() => router.push('/(stack)/settings/privacy')}
        style={styles.cardSpacing}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cardSpacing: {
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
  },
  row: {}, // Removed custom styles for the row
  selectorContainer: {
    marginHorizontal: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
  },
});
