import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { colors } from "@/app/theme/styles";
import { Colors } from "@/constants/Colors";

interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export const SwipeableRow = ({
  children,
  onEdit,
  onDelete,
  containerStyle,
}: SwipeableRowProps) => {
  const ACTION_WIDTH = 160;

  const renderRightActions = (progress: any, drag: any) => {
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: drag.value + ACTION_WIDTH }],
    }));

    return (
      <Reanimated.View style={[styles.rightActionContainer, animatedStyle]}>
        {onEdit && (
          <TouchableOpacity
            style={[styles.actionButton, styles.edit]}
            onPress={onEdit}
          >
            <IconSymbol name="pencil" color="white" size={24} />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={[styles.actionButton, styles.delete]}
            onPress={onDelete}
          >
            <IconSymbol name="trash" color="white" size={24} />
          </TouchableOpacity>
        )}
      </Reanimated.View>
    );
  };

  return (
    <ReanimatedSwipeable
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <View style={[styles.rowContent, containerStyle]}>{children}</View>
    </ReanimatedSwipeable>
  );
};

const styles = StyleSheet.create({
  rowContent: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 64,
    justifyContent: "center",
  },
  rightActionContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
  },
  actionButton: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    padding: 10,
  },
  edit: {
    backgroundColor: Colors.dark.secondary,
  },
  delete: {
    backgroundColor: Colors.dark.delete,
  },
  actionText: {
    color: "white",
    fontSize: 10,
    marginTop: 4,
  },
});
