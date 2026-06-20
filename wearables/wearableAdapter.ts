import { Platform } from 'react-native';

import HealthConnectAdapter from '@/wearables/healthConnectAdapter';
import HealthKitAdapter from '@/wearables/healthkitAdapter';

export function createWearableAdapter() {
  if (Platform.OS === 'ios') {
    return new HealthKitAdapter();
  }

  if (Platform.OS === 'android') {
    return new HealthConnectAdapter();
  }

  return null;
}