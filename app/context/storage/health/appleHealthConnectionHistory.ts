import AsyncStorage from '@react-native-async-storage/async-storage';

// Device setup history, intentionally excluded from the in-app data deletion
// categories. It records completion of the authorization flow, not per-type
// read permissions (which HealthKit does not disclose).
const CONNECTION_HISTORY_KEY = 'deviceSetup:appleHealthAuthorizationCompleted';

export const getAppleHealthConnectionHistory = async () => (await AsyncStorage.getItem(CONNECTION_HISTORY_KEY)) === 'true';
export const markAppleHealthConnectionCompleted = () => AsyncStorage.setItem(CONNECTION_HISTORY_KEY, 'true');
