import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';

export function SleepConsistencyLabel() {
  const { t } = useTranslation('metrics');
  const { colors } = useTheme();
  const { getMetricHistory } = useStorage();

  const bedtimeEntryCount = React.useMemo(() => {
    return getMetricHistory('sleep_bedtime').length;
  }, [getMetricHistory]);

  const consistencyLabel = bedtimeEntryCount >= 6 ? t('moderate') : t('low');

  return (
    <View style={[globalStyles.col, globalStyles.colWithDivider, { borderRightColor: colors.borderLight ?? colors.border }]}>
      <ThemedText type="label">{t('sleep_consistency.title')}</ThemedText>
      <ThemedText type="title3">{consistencyLabel}</ThemedText>
      <ThemedText type="caption">{t('sleep_consistency.pattern')}</ThemedText>
    </View>
  );
}
