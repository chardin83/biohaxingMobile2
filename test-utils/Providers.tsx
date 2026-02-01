import { DefaultTheme,ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { MenuProvider } from 'react-native-popup-menu';

import { StorageProvider } from '@/app/context/StorageContext';

export const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider value={DefaultTheme}>
    <MenuProvider>
      <StorageProvider>
        {children}
      </StorageProvider>
    </MenuProvider>
  </ThemeProvider>
);