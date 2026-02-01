import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet,View } from 'react-native';

import { useStorage } from '../context/StorageContext';

export default function IndexRedirector() {
  const { hasCompletedOnboarding, isInitialized, onboardingStep } = useStorage();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (!isInitialized) return;

    if (hasCompletedOnboarding) {
      router.replace('/dashboard');
    } else {
      switch (onboardingStep) {
        case 0:
          router.replace('/(onboarding)/onboardingsupplements');
          break;
        case 1:
          router.replace('/(onboarding)/onboardinggoals');
          break;
        default:
          router.replace('/(onboarding)/onboardingsupplements');
          break;
      }
    }
  }, [isInitialized, hasCompletedOnboarding, onboardingStep, router]);

  if (!isInitialized) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
