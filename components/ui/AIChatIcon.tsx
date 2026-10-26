import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export default function AIChatIcon({ size = 26, color, style }: Readonly<{ size?: number; color: string; style?: StyleProp<ViewStyle> }>) {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={[{ width: size, height: size }, style]}>
      <MaterialIcons name="chat-bubble-outline" size={size} color={color} />
      <View style={[styles.stars, { top: size * 0.18, left: size * 0.24 }]}>
        <MaterialIcons name="auto-awesome" size={size * 0.44} color={color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ stars: { position: 'absolute' } });
