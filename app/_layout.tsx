import 'react-native-reanimated';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { t } from 'i18next';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { MenuProvider } from 'react-native-popup-menu';

import GlobalLevelUpModal from '@/components/GlobalLevelUpModal';
import { MusicProvider } from '@/components/MusicContext';
import Sparks from '@/components/Sparks';
import { SparksProvider, useSparks } from '@/components/SparksContext';
import { WearableProvider } from '@/wearables/wearableProvider';

// ThemeProvider value computed below (reads stored preferred theme)
import { SessionProvider } from './context/SessionStorage';
import { StorageProvider } from './context/StorageContext';
import { getStoredPreferredTheme,subscribe } from './context/themeEvents';
import { MyDarkTheme, MyLightTheme } from './theme/AppTheme';
// Themes are provided by AppThemeProvider
import { globalStyles } from './theme/globalStyles';

SplashScreen.preventAutoHideAsync();

function SparksOverlay() {
  const { showSparks } = useSparks();
  return showSparks ? <Sparks /> : null;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const colorScheme = useColorScheme();
  const [preferredTheme, setPreferredTheme] = React.useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await getStoredPreferredTheme();
      if (mounted) setPreferredTheme(stored);
    })();

    const unsub = subscribe(s => setPreferredTheme(s));
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const theme = preferredTheme === 'light' ? MyLightTheme : preferredTheme === 'dark' ? MyDarkTheme : colorScheme === 'dark' ? MyDarkTheme : MyLightTheme;

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);


  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={globalStyles.flex1}>
      <ThemeProvider value={theme}>
        <SparksProvider>
          <SparksOverlay />
          <MusicProvider>
            <WearableProvider>
              <SessionProvider>
                <StorageProvider>
                  <PaperProvider>
                    <MenuProvider>
                      <BottomSheetModalProvider>
                        <GlobalLevelUpModal />
                        <Stack
                          screenOptions={{
                            headerShown: false,
                            headerTransparent: true,
                            headerStyle: {
                              backgroundColor: 'transparent',
                            },
                            headerTintColor: '#fff',
                            headerTitleStyle: {
                              fontWeight: 'bold',
                            },
                          }}
                        >
                          <Stack.Screen
                            name="(tabs)"
                            options={{
                              headerShown: false,
                              title: '',
                              headerBackTitle: t('back'),
                            }}
                          />

                          <Stack.Screen
                            name="(manage)"
                            options={{
                              headerShown: false,
                              title: '',
                              headerBackTitle: t('back'),
                            }}
                          />

                          <Stack.Screen
                            name="(onboarding)/onboardingsupplements"
                            options={{
                              headerShown: false,
                              title: '',
                              headerBackTitle: t('back'),
                            }}
                          />
                          <Stack.Screen
                            name="(onboarding)/onboardinggoals"
                            options={{
                              headerShown: true,
                              title: '',
                              headerBackTitle: t('back'),
                            }}
                          />
                        </Stack>
                        <StatusBar style="auto" />
                      </BottomSheetModalProvider>
                    </MenuProvider>
                  </PaperProvider>
                </StorageProvider>
              </SessionProvider>
            </WearableProvider>
          </MusicProvider>
        </SparksProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
