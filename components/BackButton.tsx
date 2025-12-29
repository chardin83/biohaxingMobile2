import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

interface BackButtonProps {
  onPress?: () => void;
  style?: any;
}

export default function BackButton({ onPress, style }: BackButtonProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <Pressable onPress={handlePress} style={[styles.backButton, style]}>
      <Text style={styles.backText}>← {t("back")}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingTop: 10,
    paddingLeft: 18,
    paddingBottom: 10,
    alignSelf: "flex-start", // Lägg till denna rad
  },
  backText: {
    color: "rgba(120,255,220,0.95)",
    fontSize: 17,
  },
});