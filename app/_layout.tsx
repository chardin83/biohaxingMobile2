import 'react-native-reanimated';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { t } from 'i18next';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { MenuProvider } from 'react-native-popup-menu';

import GlobalLevelUpModal from '@/components/GlobalLevelUpModal';
import { MusicProvider } from '@/components/MusicContext';
import Sparks from '@/components/Sparks';
import { SparksProvider, useSparks } from '@/components/SparksContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { WearableProvider } from '@/wearables/wearableProvider';

import { SessionProvider } from './context/SessionStorage';
import { StorageProvider } from './context/StorageContext';
import { colors } from './theme/styles';

SplashScreen.preventAutoHideAsync();

function SparksOverlay() {
  const { showSparks } = useSparks();
  return showSparks ? <Sparks /> : null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const MyDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      primary: colors.primary,
      text: colors.text,
      card: colors.assistantBubble,
      border: colors.border,
      notification: colors.delete,
    },
  };

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SparksProvider>
        <SparksOverlay />
        <MusicProvider>
          <WearableProvider>
            <SessionProvider>
              <StorageProvider>
                <PaperProvider>
                  <ThemeProvider value={colorScheme === 'dark' ? MyDarkTheme : DefaultTheme}>
                    <MenuProvider>
                      <GlobalLevelUpModal />
                      <Stack
                        screenOptions={{
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
                    </MenuProvider>
                  </ThemeProvider>
                </PaperProvider>
              </StorageProvider>
            </SessionProvider>
          </WearableProvider>
        </MusicProvider>
      </SparksProvider>
    </GestureHandlerRootView>
  );
}
