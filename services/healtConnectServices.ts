import {
  getSdkStatus,
  initialize,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

export async function requestHealthConnectPermissions(): Promise<boolean> {
  const status = await getSdkStatus();
  console.log('Health Connect SDK status:', status);

  if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
    return false;
  }

  const initialized = await initialize();
  console.log('Health Connect initialized:', initialized);

  if (!initialized) {
    return false;
  }

  const grantedPermissions = await requestPermission([
    { accessType: 'read', recordType: 'SleepSession' },
    { accessType: 'read', recordType: 'Steps' },
    { accessType: 'read', recordType: 'HeartRate' },
  ]);

  console.log('Granted permissions:', grantedPermissions);

  return grantedPermissions.length > 0;
}