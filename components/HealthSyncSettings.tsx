import React from 'react';
import { useTranslation } from 'react-i18next';
import { Switch,View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';

import { ThemedText } from './ThemedText';

export function HealthSyncSettings() {
  const { t } = useTranslation();
  const { healthSyncEnabled, setHealthSyncEnabled } = useStorage();

  return (
    <View style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText type="default">{t('settings:healthSync.title') ?? 'Health sync'}</ThemedText>
        <Switch value={healthSyncEnabled} onValueChange={setHealthSyncEnabled} />
      </View>
      <View style={{ marginTop: 8 }}>
        <ThemedText type="caption">
          {t('settings:healthSync.description') ?? 'När du aktiverar detta kan appen läsa din sömnhistorik från Apple Health för att förbättra sömnstatistik. Data lagras lokalt och delas inte utan ditt uttryckliga tillstånd.'}
        </ThemedText>
      </View>
    </View>
  );
}

export default HealthSyncSettings;
