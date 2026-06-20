import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import SettingIcon from '@/components/ui/SettingIcon';
import ThemedSwitch from '@/components/ui/ThemedSwitch';
import { requestHealthConnectPermissions } from '@/services/healtConnectServices';

import { ThemedText } from './ThemedText';
import SettingsCard from './ui/SettingsCard';

export function HealthSyncSettings({
  style,
}: Readonly<{ style?: StyleProp<ViewStyle> }>) {
  const { t } = useTranslation();
  const { healthSyncEnabled, setHealthSyncEnabled } = useStorage();

  const isIOS = Platform.OS === 'ios';

 const handleHealthSyncChange = async (enabled: boolean) => {
  console.log('Health sync toggled:', enabled);

  if (!enabled) {
    setHealthSyncEnabled(false);
    return;
  }

  if (Platform.OS === 'android') {
    console.log('Requesting Health Connect permissions...');

    const hasPermission = await requestHealthConnectPermissions();

    console.log('Health Connect permission result:', hasPermission);

    setHealthSyncEnabled(hasPermission);
    return;
  }

  setHealthSyncEnabled(true);
};

  return (
    <SettingsCard style={[styles.cardSpacing, style]}>
      <View style={styles.container}>
        <View style={styles.row}>
          <View style={styles.leftWrap}>
            <SettingIcon
              size={36}
              iconName={isIOS ? 'applelogo' : 'smartphone'}
            />

            <ThemedText type="title3" style={styles.titleText}>
              {isIOS
                ? t('settings:healthSync.appleTitle', 'Apple Health')
                : t('settings:healthSync.androidTitle', 'Health Connect')}
            </ThemedText>
          </View>

          <ThemedSwitch
            value={healthSyncEnabled}
            onValueChange={handleHealthSyncChange}
          />
        </View>

        <View style={styles.descriptionWrap}>
          <ThemedText type="caption">
            {isIOS
              ? t(
                  'settings:healthSync.appleDescription',
                  'When enabled, the app can read health data from Apple Health to improve health insights. Data is stored locally and is never shared without your explicit consent.'
                )
              : t(
                  'settings:healthSync.androidDescription',
                  'When enabled, the app can read health data from Health Connect to improve health insights. Data is stored locally and is never shared without your explicit consent.'
                )}
          </ThemedText>
        </View>
      </View>
    </SettingsCard>
  );
}

export default HealthSyncSettings;

const styles = StyleSheet.create({
  cardSpacing: {
    marginTop: 8,
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