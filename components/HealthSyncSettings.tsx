import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import AppButton from '@/components/ui/AppButton';
import { Checkbox } from '@/components/ui/Checkbox';
import Notice from '@/components/ui/Notice';
import SettingIcon from '@/components/ui/SettingIcon';
import ThemedSwitch from '@/components/ui/ThemedSwitch';
import { requestHealthConnectPermissions } from '@/services/healtConnectServices';
import HealthKitAdapter from '@/wearables/healthkitAdapter';
import { useWearable } from '@/wearables/wearableProvider';

import { ThemedText } from './ThemedText';
import SettingsCard from './ui/SettingsCard';

export function HealthSyncSettings({ style }: Readonly<{ style?: StyleProp<ViewStyle> }>) {
  const { t } = useTranslation();
  const { healthSyncEnabled, setHealthSyncEnabled, hideHealthSyncPrompt, setHideHealthSyncPrompt, hasConnectedAppleHealth, markAppleHealthConnected } =
    useStorage();

  const { setAdapter } = useWearable();
  const [connecting, setConnecting] = React.useState(false);
  const [connectionError, setConnectionError] = React.useState(false);
  const connectionInFlight = React.useRef(false);
  const isIOS = Platform.OS === 'ios';
  const [savingPrompt, setSavingPrompt] = React.useState(false);
  const [promptError, setPromptError] = React.useState(false);
  const togglePrompt = async () => {
    setSavingPrompt(true);
    setPromptError(false);
    try {
      await setHideHealthSyncPrompt(!hideHealthSyncPrompt);
    } catch {
      setPromptError(true);
    } finally {
      setSavingPrompt(false);
    }
  };

  const handleHealthSyncChange = async (enabled: boolean) => {
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

  const connectOrOpenAppleHealth = async () => {
    if (connectionInFlight.current) return;
    connectionInFlight.current = true;
    setConnecting(true);
    setConnectionError(false);
    try {
      if (hasConnectedAppleHealth) {
        await Linking.openURL('x-apple-health://');
        setHealthSyncEnabled(true);
      } else {
        const adapter = new HealthKitAdapter();
        const status = await adapter.getStatus();
        if (status.state !== 'connected') throw new Error('HealthKit initialization failed');
        await setAdapter(adapter);
        await markAppleHealthConnected();
        setHealthSyncEnabled(true);
      }
    } catch {
      setConnectionError(true);
    } finally {
      connectionInFlight.current = false;
      setConnecting(false);
    }
  };


  return (
    <SettingsCard style={[styles.cardSpacing, style]}>
      <View style={styles.container}>
        <View style={styles.row}>
          <View style={styles.leftWrap}>
            <SettingIcon size={36} iconName={isIOS ? 'applelogo' : 'smartphone'} />

            <ThemedText type="title3" style={styles.titleText}>
              {isIOS ? t('settings:healthSync.appleTitle', 'Apple Health') : t('settings:healthSync.androidTitle', 'Health Connect')}
            </ThemedText>
          </View>

          {!isIOS && <ThemedSwitch value={healthSyncEnabled} onValueChange={handleHealthSyncChange} />}
        </View>

        <View style={styles.descriptionWrap}>
          <ThemedText type="caption">
            {isIOS
              ? t('settings:healthSync.appleIntroduction')
              : t(
                  'settings:healthSync.androidDescription',
                  'When enabled, the app can read health data from Health Connect to improve health insights. Data is stored locally and is never shared without your explicit consent.'
                )}
          </ThemedText>
        </View>
        {isIOS && (
          <View style={styles.descriptionWrap}>
            <AppButton
              title={t(hasConnectedAppleHealth ? 'settings:healthSync.openApple' : 'settings:healthSync.connectApple')}
              onPress={connectOrOpenAppleHealth}
              variant="primary"
              rightIcon="chevron.right"
              rightIconAtEdge
              disabled={connecting}
              content={connecting ? <ActivityIndicator /> : undefined}
            />
            <Notice
              variant="info"
              title={t('settings:healthSync.permissionsTitle')}
              message={t('settings:healthSync.permissionsSteps')}
            />
            {connectionError && <ThemedText type="error">{t('settings:healthSync.connectionError')}</ThemedText>}
          </View>
        )}
        <View style={styles.descriptionWrap}>
          <Checkbox
            checked={!!hideHealthSyncPrompt}
            onPress={togglePrompt}
            disabled={savingPrompt}
            label={t(isIOS ? 'settings:healthSync.hideApplePrompt' : 'settings:healthSync.hideAndroidPrompt')}
          />
          {promptError && <ThemedText type="error">{t('settings:healthSync.preferenceSaveError')}</ThemedText>}
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
