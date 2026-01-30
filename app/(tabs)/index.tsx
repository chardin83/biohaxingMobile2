import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Colors } from '@/app/theme/Colors';

import { useStorage } from '../context/StorageContext';

export default function IndexRedirector() {
  const { hasCompletedOnboarding, isInitialized, onboardingStep } = useStorage();
  const router = useRouter();

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
  }, [isInitialized, hasCompletedOnboarding, onboardingStep]);

  if (!isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.dark.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return null;
}
