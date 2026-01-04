import React from "react";
import { Stack } from "expo-router";

export default function ManageLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="areas" options={{ headerShown: false, title: "" }} />
    </Stack>
  );
}
