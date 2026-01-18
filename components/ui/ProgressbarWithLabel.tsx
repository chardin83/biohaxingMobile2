// components/ProgressBarWithLabel.tsx
import React from "react";
import { StyleSheet,Text, View } from "react-native";
import * as Progress from "react-native-progress";

import { Colors } from "@/constants/Colors";

interface Props {
  readonly progress: number; // 0 to 1
  readonly label?: string;
  readonly width?: number;
}

export default function ProgressBarWithLabel({
  progress,
  label,
  width = 200,
}: Props) {
  return (
    <View style={styles.container}>
      <Progress.Bar
        progress={progress}
        width={width}
        color={Colors.dark.progressBar}
        unfilledColor="#122033"
        borderRadius={5}
        borderWidth={0}
      />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    marginTop: 4,
    textAlign: "center",
    color: Colors.dark.textLight,
    fontSize: 12,
  },
});
