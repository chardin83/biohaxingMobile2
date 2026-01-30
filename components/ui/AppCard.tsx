// components/ui/AppCard.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { Colors } from '@/app/theme/Colors';


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
  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, isActive && styles.cardActive]} testID={testID}>
      <View style={styles.cardRow}>
        {icon && (
          <View style={styles.iconWrapper}>
            <Icon source={icon} size={24} color={Colors.dark.primary} />
          </View>
        )}

        <View style={styles.textWrapper}>
          <Text style={styles.cardTitle}>{title}</Text>
          {description && <Text style={styles.cardSubtitle}>{description}</Text>}
        </View>

        {typeof xp === 'number' && (
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>{xp} XP</Text>
          </View>
        )}
        {isActive && (
          <View style={styles.checkIcon}>
            <Icon source="check-circle" size={34} color={Colors.dark.checkmarkSupplement} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.secondary,
    width: '90%',
    padding: 15,
    borderRadius: 12,
    marginVertical: 8,
    borderColor: Colors.dark.border,
    borderWidth: 2,
  },
  cardActive: {
    backgroundColor: '#223B50',
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
    borderColor: Colors.dark.borderLight,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    flex: 1,
  },
  cardTitle: {
    color: Colors.dark.primary,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    color: Colors.dark.textLight,
    fontSize: 14,
    marginTop: 4,
  },
  xpBadge: {
    marginLeft: 'auto',
    backgroundColor: Colors.dark.checkmarkSupplement,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  xpText: {
    color: Colors.dark.textWhite,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AppCard;
