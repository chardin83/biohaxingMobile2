import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import * as Localization from 'expo-localization';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text,View } from 'react-native';

import i18n from '@/app/i18n';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

const STORAGE_KEY = 'preferredLanguage';

const languages: string[] = ['device', 'en', 'sv'];

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

const getFlagEmoji = (lang: string) => {
  switch (lang) {
    case 'sv':
      return '🇸🇪';
    case 'en':
      return '🌐';
    default:
      return '🌐';
  }
};

export default function LanguageSelector() {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const [selected, setSelected] = React.useState<string>('device');
  const borderColor = colors.border;

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
    <View style={[styles.container, styles.card, { backgroundColor: colors.cardBackground, borderColor }]}> 
      {languages.map((lang, idx) => {
        const raw = LANGUAGE_LABELS[lang];
        const label = typeof raw === 'function' ? raw(t) : raw ?? lang;
        const isLast = idx === languages.length - 1;
        const flag = getFlagEmoji(lang);
        let leftIcon: React.ReactNode;
        if (lang === 'device') {
          leftIcon = <IconSymbol name="smartphone" size={16} color={colors.icon ?? '#000'} />;
        } else if (lang === 'en') {
          leftIcon = <IconSymbol name="public" size={16} color={colors.icon ?? '#000'} />;
        } else {
          leftIcon = <Text style={styles.flag}>{flag}</Text>;
        }

        return (
          <Pressable
            key={lang}
            onPress={() => onSelect(lang)}
            style={[styles.row, isLast ? styles.rowNoBorder : [styles.rowBorder, { borderBottomColor: borderColor }]]}
            accessibilityRole="button"
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.overlayLight ?? 'rgba(0,0,0,0.04)' }]}>
                {leftIcon}
              </View>
              <ThemedText type="default" style={styles.label}>
                {label}
              </ThemedText>
            </View>
            {selected === lang ? (
              <CheckBold size={18} color={colors.primary} />
            ) : (
              <ThemedText type="default">{''}</ThemedText>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

type CheckBoldProps = Readonly<{ size?: number; color: string }>;

function CheckBold(props: CheckBoldProps) {
  const { size = 18, color } = props;
  return (
    <View style={[styles.checkWrapper, { width: size + 6, height: size + 6 }]}> 
      <IconSymbol name="check" size={size} color={color} style={styles.checkLayer1} />
      <IconSymbol name="check" size={size} color={color} style={styles.checkLayer2} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
  },
  card: {
    borderRadius: 8,
    width: '100%',
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowNoBorder: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginLeft: 12,
    fontSize: 16,
  },
  checkWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  checkLayer1: {
    position: 'absolute',
    left: -0.6,
    top: -0.4,
  },
  checkLayer2: {
    position: 'absolute',
    left: 0.6,
    top: 0.4,
  },
});
