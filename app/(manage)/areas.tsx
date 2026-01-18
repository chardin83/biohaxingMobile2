import { t } from "i18next";
import React from "react";
import { StyleSheet,Text, View } from "react-native";

import BackButton from "@/components/BackButton";
import MyGoalsSelector from "@/components/MyGoalsSelector";
import { Colors } from "@/constants/Colors";

export default function Areas() {
  return (
    <View style={styles.container}>
      <BackButton style={styles.backButton} />
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
    paddingTop: 40,
    padding: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.dark.primary,
    marginBottom: 20,
  },
});
