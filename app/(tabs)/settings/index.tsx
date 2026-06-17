import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import HealthSyncSettings from '@/components/HealthSyncSettings';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';
import { SettingsCard } from '@/components/ui/SettingsCard';
import { LANGUAGE_DISPLAY } from '@/constants/languages';

const STORAGE_KEY = 'preferredLanguage';

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedLabel, setSelectedLabel] = React.useState<string>('');

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

      <SettingsCard
        title={t('languageSelector.title', { defaultValue: 'Language' })}
        subtitle={selectedLabel}
        iconName="public"
        onPress={onPressLanguage}
      />

      {/* language selection handled on separate screen */}

      <HealthSyncSettings />
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
  },
  row: {}, // Removed custom styles for the row
  selectorContainer: {
    marginHorizontal: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
  },
});
