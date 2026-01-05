import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Colors } from "@/constants/Colors";

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
      <Text style={styles.backText}>
        <Text style={styles.arrowText}>{"‹"}</Text> {t("back")}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingTop: 10,
    paddingLeft: 18,
    paddingBottom: 10,
    alignSelf: "flex-start",
  },
  backText: {
    color: Colors.dark.textPrimary,
    fontSize: 17,
  },
  arrowText: {
    color: Colors.dark.accentStrong,
    fontSize: 24,
  },
});