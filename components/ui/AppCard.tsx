// components/ui/AppCard.tsx
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { type StyleProp, StyleSheet, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { Icon } from 'react-native-paper';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import type { IconSymbolName } from '@/components/ui/icon-symbol-map';
import { IconSymbol } from '@/components/ui/IconSymbol';
import XPBadge from '@/components/ui/XPBadge';

interface AppCardProps {
  icon?: string;
  iconName?: IconSymbolName;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  title: string;
  subtitle?: string;
  description?: string;
  isActive?: boolean;
  showCheckbox?: boolean;
  xp?: number;
  onPress?: () => void;
  testID?: string;
  accessibilityHint?: string;
}

const AppCard: React.FC<AppCardProps> = ({
  icon,
  iconName,
  children,
  style,
  title,
  subtitle,
  description,
  isActive = false,
  showCheckbox = false,
  xp,
  onPress,
  testID,
  accessibilityHint,
}) => {
  const { colors } = useTheme();
  const actionRole = onPress ? 'button' : undefined;

  return (
    <TouchableOpacity
      accessible={onPress ? true : undefined}
      accessibilityRole={showCheckbox ? 'checkbox' : actionRole}
      accessibilityLabel={showCheckbox ? [title, subtitle, description].filter(Boolean).join('. ') : undefined}
      accessibilityHint={accessibilityHint}
      accessibilityState={showCheckbox ? { checked: isActive, disabled: !onPress } : { disabled: !onPress }}
      onPress={onPress}
      disabled={!onPress}
      style={[
        globalStyles.card,
        styles.card,
        { backgroundColor: colors.secondaryBackground, borderColor: colors.border },
        isActive && { backgroundColor: colors.cardActive },
        style,
      ]}
      testID={testID}
    >
      <View style={styles.cardRow}>
        {(icon || iconName) && (
          <View style={[styles.iconWrapper, { borderColor: colors.iconBorder, backgroundColor: colors.iconBackground }]}>
            {iconName ? <IconSymbol name={iconName} size={24} color={colors.icon} /> : <Icon source={icon!} size={24} color={colors.icon} />}
          </View>
        )}

        <View style={styles.textWrapper}>
          <ThemedText type="title3" style={[styles.cardTitle, { color: colors.primaryText }]}>
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText type="defaultSemiBold" style={{ color: colors.textWhite }}>
              {subtitle}
            </ThemedText>
          )}
          {description && (
            <ThemedText type="default" style={[{ color: colors.textLight }]}>
              {description}
            </ThemedText>
          )}
        </View>

        <View style={styles.statusColumn}>
          {(typeof xp === 'number' || isActive) && <XPBadge amount={xp} checked={isActive} size={34} />}
          {!isActive && showCheckbox && <IconSymbol name="checkboxBlankOutline" size={34} color={colors.textMuted} />}
        </View>
      </View>
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    width: '90%',
    borderRadius: globalStyles.borders.borderRadius,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    flex: 1,
  },
  cardTitle: {
    textTransform: 'uppercase',
  },
  statusColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    gap: 2,
  },
});

export default AppCard;
