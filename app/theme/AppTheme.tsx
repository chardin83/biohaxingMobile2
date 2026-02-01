import { DarkTheme, DefaultTheme } from '@react-navigation/native';

import { Colors } from './Colors';

export const MyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors, // innehåller card/notification osv
    ...Colors.light,        // dina egna
  },
} as const;

export const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    ...Colors.dark,
  },
} as const;

export type AppTheme = typeof MyLightTheme; // (eller typeof MyDarkTheme, de bör ha samma shape)
