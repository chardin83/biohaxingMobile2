import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AdapterStatus } from "@/wearables/types";

interface WearableStatusProps {
  status: AdapterStatus;
  style?: any;
}

export function WearableStatus({ status, style }: WearableStatusProps) {
  const getStatusColor = () => {
    switch (status.state) {
      case "connected":
        return "rgba(100,255,150,0.9)";
      case "disconnected":
        return "rgba(255,200,100,0.8)";
      case "error":
        return "rgba(255,100,100,0.9)";
      default:
        return "rgba(255,255,255,0.5)";
    }
  };

  const getStatusIcon = () => {
    switch (status.state) {
      case "connected":
        return "✓";
      case "disconnected":
        return "○";
      case "error":
        return "✗";
      default:
        return "•";
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.statusText, { color: getStatusColor() }]}>
        {getStatusIcon()} {status.state}
      </Text>
      {status.state === "connected" && status.source && (
        <Text style={styles.sourceText}> • {status.source}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sourceText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
});