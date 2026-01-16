import React, { ReactNode } from "react";
import {
  StyleSheet,
  StyleProp,
  View,
  ViewStyle,
  TouchableOpacity,
} from "react-native";
import { Colors } from "@/constants/Colors";

export type BadgeVariant = "default" | "overlay";

type BadgeProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: BadgeVariant;
  onPress?: () => void;
  disabled?: boolean;
  activeOpacity?: number;
};

const Badge: React.FC<BadgeProps> = ({
  children,
  style,
  variant = "default",
  onPress,
  disabled,
  activeOpacity = 0.8,
}) => {
  const variantStyle = variant === "overlay" ? styles.overlay : styles.default;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={activeOpacity}
        style={[styles.base, variantStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.base, variantStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  default: {
    backgroundColor: Colors.dark.secondary,
    borderColor: Colors.dark.borderLight,
  },
  overlay: {
    backgroundColor: Colors.dark.overlayLight,
    borderColor: Colors.dark.borderLight,
  },
});

export default Badge;
