import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";

import { colors } from "./theme/styles";
import { StorageProvider } from "./context/StorageContext";
import { SessionProvider } from "./context/SessionStorage";
import { Stack } from "expo-router";
import { t } from "i18next";
import GlobalLevelUpModal from "@/components/GlobalLevelUpModal";
import { MenuProvider } from "react-native-popup-menu";
import { WearableProvider } from "@/wearables/wearableProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
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
      <WearableProvider>
      <SessionProvider>
        <StorageProvider>
          <PaperProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? MyDarkTheme : DefaultTheme}
            >
              <MenuProvider>
              <GlobalLevelUpModal />
              <Stack
                screenOptions={{
                  headerTransparent: true,
                  headerStyle: {
                    backgroundColor: "transparent",
                  },
                  headerTintColor: "#fff",
                  headerTitleStyle: {
                    fontWeight: "bold",
                  },
                }}
              >
                 <Stack.Screen
                  name="(goal)"
                  options={{
                    headerShown: false,
                    title: "",
                    headerBackTitle: t("back"),
                  }}
                />
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                    title: "",
                    headerBackTitle: t("back"),
                  }}
                />

                <Stack.Screen
                  name="(manage)"
                  options={{
                    headerShown: false,
                    title: "",
                    headerBackTitle: t("back"),
                  }}
                />

                <Stack.Screen
                  name="(onboarding)/onboardingsupplements"
                  options={{
                    headerShown: false,
                    title: "",
                    headerBackTitle: t("back"),
                  }}
                />
                <Stack.Screen
                  name="(onboarding)/onboardinggoals"
                  options={{
                    headerShown: true,
                    title: "",
                    headerBackTitle: t("back"),
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
    </GestureHandlerRootView>
  );
}
