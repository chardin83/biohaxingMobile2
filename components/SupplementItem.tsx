import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SwipeableRow } from "./ui/SwipeableRow";
import { Colors } from "@/constants/Colors";
import { Supplement } from "@/app/domain/Supplement";

interface RenderSupplementItemProps {
  planName: string;
  supplement: Supplement;
  onRemoveSupplement: (planName: string, supplementTitle: string) => void;
  onEditSupplement: (planName: string, supplementTitle: string) => void;
}

const SupplementItem: React.FC<RenderSupplementItemProps> = ({
  planName,
  supplement,
  onRemoveSupplement,
  onEditSupplement,
}) => {
  return (
    <SwipeableRow
      onEdit={() => onEditSupplement(planName, supplement.name)}
      onDelete={() => onRemoveSupplement(planName, supplement.name)}
      containerStyle={styles.swipeableContent}
    >
      <View style={styles.row}>
        <Text style={styles.text}>
          {`${supplement.name} (${supplement.quantity} ${supplement.unit})`}
        </Text>
        <Text style={styles.icon}>⋮</Text>
      </View>
    </SwipeableRow>
  );
};

const styles = StyleSheet.create({
  swipeableContent: {
    height: 50,
    justifyContent: "center",
    width: "100%",
    borderRadius: 0,
    overflow: "hidden",
    color: Colors.dark.text,
  },
  row: {
    flexDirection: "row",         // <-- viktigt!
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    color: Colors.dark.textWhite,
  },
  icon: {
    fontSize: 18,
    color: "#888",
    opacity: 0.6,
    marginLeft: 12,
  },
});

export default SupplementItem;
