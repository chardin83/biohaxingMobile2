import { Stack } from "expo-router";
import { t } from "i18next";

export default function GoalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitle: "",
        headerShadowVisible: false,
      }}
    >
                      <Stack.Screen
                        name="details"
                        options={{
                          headerShown: false,
                          headerTitle: "",
                          headerBackTitle: t("back"),
                        }}
                      />
                      <Stack.Screen
                        name="[mainGoalId]"
                        options={{
                          headerShown: false,
                          headerTitle: "",
                        }}
                      />
                      <Stack.Screen
                        name="selectGoal"
                        options={{
                          headerShown: false,
                          headerTitle: "",
                          headerBackTitle: t("back"), // ✅ Visas som text på back-knapp i nästa skärm
                        }}
                      />
    </Stack>
  );
}
