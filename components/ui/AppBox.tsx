// components/GoalDetailBox.tsx
import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Colors } from "@/constants/Colors";

interface Props {
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function AppBox({ title, children, headerRight, style }: Readonly<Props>) {
  return (
    <View style={[styles.box, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.boxTitle}>{title}</Text>
        {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
      </View>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerRight: {
    marginLeft: 12,
  },
  boxText: {
    color: Colors.dark.textLight,
    fontSize: 14,
  },
});
