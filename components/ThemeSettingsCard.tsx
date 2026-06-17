import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { SettingsCardLink } from '@/components/ui/SettingsCardLink';

export default function ThemeSettingsCard() {
  const { t } = useTranslation('common');
  const router = useRouter();

  const onPress = () => {
    router.push('/(stack)/settings/theme');
  };

  return (
    <SettingsCardLink
      title={t('themeSelector.title', { defaultValue: 'Theme' })}
      subtitle={t('themeSelector.subtitle', { defaultValue: 'Use device setting' })}
      iconName="settings"
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({});
