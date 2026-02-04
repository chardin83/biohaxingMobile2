import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleProp,StyleSheet, ViewStyle } from 'react-native';

import { Card } from './Card';

interface PressableCardProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const PressableCard: React.FC<PressableCardProps> = ({ onPress, children, style }) => {
  const { colors } = useTheme();

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card
          style={[
            styles.card,
            pressed && { backgroundColor: colors.overlayLight, borderColor: colors.accentMedium },
            style,
          ]}
        >
          {children}
        </Card>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 0,
  },
});