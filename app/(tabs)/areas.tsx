import React from "react";

import { View, Text, StyleSheet } from "react-native";

import MyGoalsSelector from "@/components/MyGoalsSelector";
import { Colors } from "@/constants/Colors";
import { t } from "i18next";

export default function Areas() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("common:areas.selectArea")}</Text>
      <MyGoalsSelector />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingBottom: 100,
    paddingTop: 90,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.dark.primary,
    marginBottom: 20,
  },
});
