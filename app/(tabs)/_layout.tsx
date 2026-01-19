import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbolName } from '@/components/ui/icon-symbol-map';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

import i18n from '../i18n';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

  console.log('🤖 TabBarBackground loaded:', TabBarBackground?.name);

  const [ready, setReady] = useState(i18n.isInitialized);

  useEffect(() => {
    if (!i18n.isInitialized) {
      i18n.on('initialized', () => {
        setReady(true);
      });
    }
  }, []);

  if (!ready) return null;

  return (
    <Tabs
      // initialRouteName="dashboard" // kan lämnas bort om du vill att dashboard ska vara först
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
        }),
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
    <Tabs.Screen name="dashboard/area/[areaId]" options={{ href: null }} />
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: t('layout.dashboard'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name={'dashboard' as IconSymbolName} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar/index" 
        options={{
          title: t('layout.calendar'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="plan/index"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="checklist" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat/index"
        options={{
          title: 'AI',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chat" color={color} />,
        }}
      />
    </Tabs>
  );
}
