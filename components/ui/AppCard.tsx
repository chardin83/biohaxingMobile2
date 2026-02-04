// components/ui/AppCard.tsx
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';

interface AppCardProps {
  icon?: string;
  title: string;
  description?: string;
  isActive?: boolean;
  xp?: number;
  onPress: () => void;
  testID?: string;
}

const AppCard: React.FC<AppCardProps> = ({ icon, title, description, isActive = false, xp, onPress, testID }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        globalStyles.card,
        styles.card,
        { backgroundColor: colors.secondaryBackground, borderColor: colors.border },
        isActive && { backgroundColor: colors.cardActive },
      ]}
      testID={testID}
    >
      <View style={styles.cardRow}>
        {icon && (
          <View style={[styles.iconWrapper, { borderColor: colors.iconBorder, backgroundColor: colors.iconBackground }]}>
            <Icon source={icon} size={24} color={colors.icon} />
          </View>
        )}

        <View style={styles.textWrapper}>
          <ThemedText type="title3" style={[styles.cardTitle, { color: colors.primary }]}>
            {title}
          </ThemedText>
          {description && (
            <ThemedText type="default" style={[{ color: colors.textLight }]}>
              {description}
            </ThemedText>
          )}
        </View>

        {/* Badge och checkIcon i kolumn */}
        <View style={styles.statusColumn}>
          {typeof xp === 'number' && (
            <View
              style={[
                globalStyles.badge,
                { backgroundColor: colors.xp },
                xp === 0 ? styles.badgeLowOpacity : styles.badgeFullOpacity,
              ]}
            >
              <ThemedText type="defaultSemiBold" style={{ color: colors.secondaryBackground }}>
                {xp} XP
              </ThemedText>
            </View>
          )}
          {isActive && (
            <View style={styles.checkIcon}>
              <Icon source="check-circle" size={34} color={colors.xp} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badgeLowOpacity: {
    opacity: 0.5,
  },
  badgeFullOpacity: {
    opacity: 1,
  },
  card: {
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
  checkIcon: {
    marginLeft: 'auto',
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
