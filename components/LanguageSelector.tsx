import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import i18n from '@/app/i18n';
import { ThemedText } from '@/components/ThemedText';

const STORAGE_KEY = 'preferredLanguage';

const languages: string[] = ['device', 'sv', 'en'];

const LANGUAGE_LABELS: Record<string, string | ((t: (k: string) => string) => string)> = {
  device: t => t('languageSelector.device'),
  sv: 'Svenska',
  en: 'English',
};

const detectDeviceLang = (): 'sv' | 'en' => {
  const locales = Localization.getLocales();
  const rawLanguage =
    locales[0]?.languageCode ?? locales[0]?.languageTag?.split('-')[0] ?? 'en';
  return rawLanguage.toLowerCase().startsWith('sv') ? 'sv' : 'en';
};

export default function LanguageSelector() {
  const { t } = useTranslation('common');
  const [selected, setSelected] = React.useState<string>('device');

  React.useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          setSelected('device');
          const device = detectDeviceLang();
          i18n.changeLanguage(device).catch(error => console.warn('LanguageSelector: changeLanguage failed', error));
          return;
        }

        if (stored === 'device') {
          setSelected('device');
          const device = detectDeviceLang();
          i18n.changeLanguage(device).catch(error => console.warn('LanguageSelector: changeLanguage failed', error));
        } else {
          setSelected(stored);
          i18n.changeLanguage(stored).catch(error => console.warn('LanguageSelector: changeLanguage failed', error));
        }
      } catch (e) {
        console.warn('LanguageSelector: load failed', e);
      }
    };
    load();
  }, []);

  const onSelect = async (code: string) => {
    try {
      setSelected(code);
      await AsyncStorage.setItem(STORAGE_KEY, code);
        if (code === 'device') {
          const device = detectDeviceLang();
          i18n.changeLanguage(device).catch(error => console.warn('LanguageSelector: changeLanguage failed', error));
        } else {
          i18n.changeLanguage(code).catch(error => console.warn('LanguageSelector: changeLanguage failed', error));
        }
    } catch (e) {
      console.warn('LanguageSelector: set preferred language failed', e);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="title3">{t('languageSelector.title')}</ThemedText>
      {languages.map(lang => {
        const raw = LANGUAGE_LABELS[lang];
        const label = typeof raw === 'function' ? raw(t) : raw ?? lang;
        return (
          <Pressable
            key={lang}
            onPress={() => onSelect(lang)}
            style={styles.row}
            accessibilityRole="button"
          >
            <ThemedText type="default">{label}</ThemedText>
            <ThemedText type="default">{selected === lang ? '✓' : ''}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
});
