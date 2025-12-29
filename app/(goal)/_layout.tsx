import { Stack } from "expo-router";

export default function GoalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="selectGoal" />
      <Stack.Screen name="[mainGoalId]" />
    </Stack>
  );
}
