// jestSetup.ts
// Mock for AsyncStorage in Jest environment

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);


jest.mock('react-native-popup-menu', () => {
  const React = require('react');
  return {
    MenuProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    Menu: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    MenuOptions: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    MenuOption: ({ children, onSelect }: any) => React.createElement(React.Fragment, null, children),
    MenuTrigger: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ bottom: 0 })),
}));