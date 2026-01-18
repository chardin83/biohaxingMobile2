import React from "react";
import { StyleSheet, Text, TouchableOpacity,View } from "react-native";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from "react-native-popup-menu";

import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";

interface MenuItem {
  text: string;
  onSelect: () => void;
  icon?: React.ReactNode;
}

interface DropdownMenuButtonProps {
  title: string;
  items: MenuItem[];
}

const DropdownMenuButton: React.FC<DropdownMenuButtonProps> = ({
  title,
  items,
}) => {
  return (
    <Menu>
      <MenuTrigger
        customStyles={{
          TriggerTouchableComponent: TouchableOpacity,
        }}
      >
        <View style={styles.triggerButton}>
          <Text style={styles.buttonText}>{title}</Text>
          <IconSymbol name="expandMore" size={20} color={Colors.dark.textLight} />
        </View>
      </MenuTrigger>

      <MenuOptions customStyles={{ optionsContainer: styles.menuOptions }}>
        {items.map((item, index) => (
          <MenuOption key={index} onSelect={item.onSelect}>
            <View style={styles.menuItem}>
              {item.icon && <View style={styles.icon}>{item.icon}</View>}
              <Text style={styles.menuItemText}>{item.text}</Text>
            </View>
          </MenuOption>
        ))}
      </MenuOptions>
    </Menu>
  );
};

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.dark.borderLight,
    backgroundColor: "transparent",
  },
  buttonText: {
    color: Colors.dark.textLight,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginRight: 6,
  },
  menuOptions: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 8,
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.dark.textWhite,
  },
  icon: {
    marginRight: 8,
  },
});

export default DropdownMenuButton;
