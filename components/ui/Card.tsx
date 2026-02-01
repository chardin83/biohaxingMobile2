import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>; // <-- update this line
  transparent?: boolean;
}

export const Card: React.FC<CardProps> = ({ title, children, style, transparent = true }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        transparent
          ? [globalStyles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]
          : [styles.box, { backgroundColor: colors.secondary, borderColor: colors.border }],
        style,
      ]}
    >
      {title && (
        <ThemedText
          type={transparent ? 'title3' : 'defaultSemiBold'}
          style={transparent
            ? [styles.cardTitle, { color: colors.cardTitle }]
            : [styles.boxTitle, { color: colors.primary }]
          }
        >
          {title}
        </ThemedText>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
  },
  box: {
    borderWidth: 1,
    borderRadius: globalStyles.borders.borderRadius,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  boxTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
});