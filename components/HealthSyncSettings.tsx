import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import SettingIcon from '@/components/ui/SettingIcon';
import ThemedSwitch from '@/components/ui/ThemedSwitch';

import { ThemedText } from './ThemedText';
import SettingsCard from './ui/SettingsCard';

export function HealthSyncSettings() {
  const { t } = useTranslation();
  const { healthSyncEnabled, setHealthSyncEnabled } = useStorage();

  return (
    <SettingsCard style={styles.cardSpacing}>
      <View style={styles.container}>
        <View style={styles.row}>
          <View style={styles.leftWrap}>
            <SettingIcon size={36} iconName="applelogo" />
            <ThemedText type="title3" style={styles.titleText}>{t('settings:healthSync.title') ?? 'Health sync'}</ThemedText>
          </View>
          <ThemedSwitch value={healthSyncEnabled} onValueChange={setHealthSyncEnabled} />
        </View>
        <View style={styles.descriptionWrap}>
          <ThemedText type="caption">
            {t('settings:healthSync.description') ?? 'När du aktiverar detta kan appen läsa din sömnhistorik från Apple Health för att förbättra sömnstatistik. Data lagras lokalt och delas inte utan ditt uttryckliga tillstånd.'}
          </ThemedText>
        </View>
      </View>
    </SettingsCard>
  );
}

export default HealthSyncSettings;

const styles = StyleSheet.create({
  cardSpacing: {
    marginTop: 12,
  },
  container: {
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descriptionWrap: {
    marginTop: 8,
  },
  leftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    marginLeft: 8,
  },
});
