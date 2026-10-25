import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { CardLinkList } from '@/components/ui/CardLinkList';
import Container from '@/components/ui/Container';
import { LANGUAGE_DISPLAY } from '@/constants/languages';

const STORAGE_KEY = 'preferredLanguage';

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
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
        <ThemedText type="title2">{t('layout.more')}</ThemedText>
      </View>
      <CardLinkList
        style={styles.cardSpacing}
        rows={[{
          key: 'person',
          title: t('common:privacy.person.title'),
          subtitle: t('common:privacy.person.subtitle'),
          iconName: 'person',
          onPress: () => router.push('/(stack)/settings/person'),
        }]}
      />

      <ThemedText type="label" style={styles.title} uppercase>
        {t('settings.preferences')}
      </ThemedText>

      <CardLinkList
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
        {t('settings.subscription')}
      </ThemedText>
      <CardLinkList
        style={styles.cardSpacing}
        rows={[{
          key: 'premium',
          title: t('common:premium.premium'),
          subtitle: t('settings.premiumDescription'),
          iconName: 'crown',
          iconColor: colors.gold,
          onPress: () => router.push('/(stack)/settings/premium'),
        }]}
      />

      <ThemedText type="label" style={styles.title} uppercase>
        {t('settings.integrations')}
      </ThemedText>

      <CardLinkList
        style={styles.cardSpacing}
        rows={[
          {
            key: 'health-sync',
            title: t(Platform.OS === 'ios' ? 'settings:healthSync.appleTitle' : 'settings:healthSync.androidTitle'),
            iconName: Platform.OS === 'ios' ? 'applelogo' : 'smartphone',
            onPress: () => router.push('/(stack)/settings/health-sync'),
          },
        ]}
      />

      <ThemedText type="label" style={styles.title} uppercase>
        {t('settings.myData')}
      </ThemedText>

      <CardLinkList
        style={styles.cardSpacing}
        rows={[
          {
            key: 'metrics',
            title: t('settings.myMetrics'),
            iconName: 'chart',
            onPress: () => router.push('/(stack)/metrics'),
          },
          {
            key: 'lifeStyle',
            title: t('common:lifeStyle.title'),
            iconName: 'book',
            iconColor: '#afa2ff',
            onPress: () => router.push('/(stack)/lifestyle'),
          },
          {
            key: 'link',
            title: t('settings.myMultivitamins'),
            subtitle: t('settings.myMultivitaminsSubtitle'),
            iconName: 'pill',
            onPress: () => router.push('/(stack)/supplements/multivitamins'),
          },
        ]}
      />

      <ThemedText type="label" style={styles.title} uppercase>
        {t('settings.privacy')}
      </ThemedText>

      <CardLinkList
        style={styles.cardSpacing}
        rows={[
          {
            key: 'link',
            title: t('settings.privacy'),
            subtitle: t('settings.privacySubtitle'),
            iconName: 'privacy',
            onPress: () => router.push('/(stack)/settings/privacy'),
          },
        ]}
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
