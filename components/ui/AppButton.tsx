import React from "react";
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Colors } from "@/constants/Colors";

type Variant = "primary" | "secondary";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  glow?: boolean; // 🔸 Ny prop
}

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  style,
  disabled = false,
  glow = false,
}) => {
  const isPrimary = variant === "primary";

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        isPrimary && glow && styles.primaryGlow,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          isPrimary ? styles.primaryText : styles.secondaryText,
          isPrimary && glow && styles.primaryTextGlow,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const baseStyle: ViewStyle = {
  paddingVertical: 14,
  paddingHorizontal: 18,
  borderRadius: 16,
  alignItems: "center",
  justifyContent: "center",
};

const styles = StyleSheet.create({
  button: {
    ...baseStyle,
    borderWidth: 1.5,
  },
  primary: {
    borderColor: Colors.dark.primary,
  },
  primaryGlow: {
    backgroundColor: Colors.dark.background,
    shadowColor: Colors.dark.buttonGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  secondary: {
    backgroundColor: "transparent",
    borderColor: Colors.dark.borderLight,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  primaryText: {
    color: Colors.dark.primary,
  },
  primaryTextGlow: {
    textShadowColor: Colors.dark.buttonTextGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  secondaryText: {
    color: Colors.dark.textLight,
  },
});

export default AppButton;
