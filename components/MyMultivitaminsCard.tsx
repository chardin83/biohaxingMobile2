import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsCardLink } from '@/components/ui/SettingsCardLink';

export default function MyMultivitaminsCard() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SettingsCardLink
      title={t('settings.myMultivitamins')}
      subtitle={t('settings.myMultivitaminsSubtitle')}
      iconName="pill"
      onPress={() => router.push('/(stack)/settings/multivitamins')}
      style={{ borderColor: colors.borderLight }}
    />
  );
}