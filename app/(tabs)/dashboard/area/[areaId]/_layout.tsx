import { Stack } from 'expo-router';

export default function AreaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="nervousSystemOverview" />
      <Stack.Screen name="sleepOverview" />
      <Stack.Screen name="energyOverview" />
      <Stack.Screen name="musclePerformanceOverview" />
      <Stack.Screen name="cardioOverview" />
      <Stack.Screen name="digestiveOverview" />
      <Stack.Screen name="immuneOverview" />
      <Stack.Screen name="details/index" /> {/* Ändra till details/index */}
    </Stack>
  );
}
