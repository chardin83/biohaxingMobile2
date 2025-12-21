// components/GoalDetailBox.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

interface Props {
  title: string;
  children: React.ReactNode;
}

export default function AppBox({ title, children }: Readonly<Props>) {
  return (
    <View style={styles.box}>
      <Text style={styles.boxTitle}>{title}</Text>
      {typeof children === "string" || typeof children === "number" ? (
        <Text style={styles.boxText}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 10,
    padding: 16,
    width: "100%",
    marginBottom: 20,
  },
  boxTitle: {
    color: Colors.dark.primary,
    fontWeight: "bold",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  boxText: {
    color: Colors.dark.textLight,
    fontSize: 14,
  },
});
