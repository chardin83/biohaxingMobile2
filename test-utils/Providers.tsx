import { DefaultTheme,ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { MenuProvider } from 'react-native-popup-menu';

import { StorageProvider } from '@/app/context/StorageContext';
import { MockAdapter } from '@/wearables/mockAdapter';
import { WearableProvider } from '@/wearables/wearableProvider';

export const AllProviders = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <ThemeProvider value={DefaultTheme}>
    <MenuProvider>
      <WearableProvider initialAdapter={new MockAdapter()}>
        <StorageProvider>
          {children}
        </StorageProvider>
      </WearableProvider>
    </MenuProvider>
  </ThemeProvider>
);