import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface MenuItem {
  text: string;
  onSelect: () => void;
  icon?: React.ReactNode;
}

interface DropdownMenuButtonProps {
  title: string;
  items: MenuItem[];
}

const DropdownMenuButton: React.FC<DropdownMenuButtonProps> = ({ title, items }) => {
  const { colors } = useTheme();

  return (
    <Menu>
      <MenuTrigger
        customStyles={{
          TriggerTouchableComponent: TouchableOpacity,
        }}
      >
        <View
          style={[
            styles.triggerButton,
            {
              borderColor: colors.primary,
            },
          ]}
        >
          <ThemedText
            type="defaultSemiBold"
            style={[
              styles.buttonText,
              { color: colors.primary },
            ]}
          >
            {title}
          </ThemedText>
          <IconSymbol name="expandMore" size={20} color={colors.primary} />
        </View>
      </MenuTrigger>

      <MenuOptions
        customStyles={{
          optionsContainer: [
            styles.menuOptions,
            { backgroundColor: colors.secondary },
          ],
        }}
      >
        {items.map((item, index) => (
          <MenuOption key={index} onSelect={item.onSelect}>
            <View style={styles.menuItem}>
              {item.icon && <View style={styles.icon}>{item.icon}</View>}
              <ThemedText type="default">
                {item.text}
              </ThemedText>
            </View>
          </MenuOption>
        ))}
      </MenuOptions>
    </Menu>
  );
};

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: globalStyles.borders.borderRadius,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginRight: 6,
  },
  menuOptions: {
    borderRadius: globalStyles.borders.borderRadius,
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 8,
  },
});

export default DropdownMenuButton;
