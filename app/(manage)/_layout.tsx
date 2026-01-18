import { Stack } from "expo-router";
import React from "react";

export default function ManageLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="areas" options={{ headerShown: false, title: "" }} />
    </Stack>
  );
}
