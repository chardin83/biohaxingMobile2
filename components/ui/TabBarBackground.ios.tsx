import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getBlurSettings } from './tabbarUtils';

export default function BlurTabBarBackground() {
  const { colors } = useTheme();
  const bg = String(colors.tabBarBackground ?? colors.background ?? '');
  const { tint, intensity } = getBlurSettings(bg);

  return <BlurView tint={tint} intensity={intensity} style={StyleSheet.absoluteFill} />;
}

export function useBottomTabOverflow() {
  const tabHeight = useBottomTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  return tabHeight - bottom;
}
