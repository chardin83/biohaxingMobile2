// jestSetup.ts
// Mock for AsyncStorage in Jest environment

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
