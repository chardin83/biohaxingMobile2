import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Colors } from '@/constants/Colors';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  transparent?: boolean;
}

export const Card: React.FC<CardProps> = ({ title, children, style, transparent = true }) => (
  <View style={[transparent ? styles.card : styles.box, style]}>
    {title && (
      <Text style={transparent ? styles.cardTitle : styles.boxTitle}>{title}</Text>
    )}
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.cardBackground, // t.ex. 'rgba(255,255,255,0.06)'
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder, // t.ex. 'rgba(255,215,100,0.18)'
    marginBottom: 20,
    width: '100%',
  },
  cardTitle: {
    color: Colors.dark.cardTitle, // t.ex. 'rgba(255,255,255,0.85)'
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
  },
  box: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 10,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  boxTitle: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
});