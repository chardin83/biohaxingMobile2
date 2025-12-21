import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useStorage } from "../context/StorageContext";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AppButton from "@/components/ui/AppButton";
import { Colors } from "@/constants/Colors";
import MyGoalsSelector from "@/components/MyGoalsSelector";

export default function OnboardingGoals() {
  const { t } = useTranslation(["goals", "common", "supplements"]);
  const { setHasCompletedOnboarding } = useStorage();
  const router = useRouter();

  const handleNext = () => {
    setHasCompletedOnboarding(true);
    router.push("/dashboard");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("common:goals.selectGoal")}</Text>
      <MyGoalsSelector />

      <AppButton
        title={t("common:onboarding.continue")}
        onPress={handleNext}
        variant="primary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    padding: 20,
    paddingTop: 90,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.dark.primary,
    marginBottom: 20,
  },
});
