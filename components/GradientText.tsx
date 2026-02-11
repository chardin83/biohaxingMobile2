import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, Text, useColorScheme } from 'react-native';

import { Colors } from '@/app/theme/Colors';

export function GradientText({
  children,
  style,
  colors,
  start = { x: 0, y: 1 },
  end = { x: 0, y: 0 },
  ...rest
}: Readonly<{
  children: React.ReactNode;
  style?: any;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}>) {
  const scheme = useColorScheme() ?? 'light';
  // Använd gold-färger från Colors som default
  const defaultColors = [
    Colors[scheme].goldenGlowButtonGlow,
    Colors[scheme].goldSoft,
    Colors[scheme].cardBorder,
  ];

  const flatStyle = StyleSheet.flatten([styles.text, style]);
  const fontSize = flatStyle?.fontSize ?? 28;
  const height = Math.ceil(fontSize * 1.2);
  const screenWidth = Dimensions.get('window').width;

  return (
    <MaskedView
      maskElement={
        <Text style={[styles.text, style]} {...rest}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={colors ?? defaultColors}
        start={start}
        end={end}
        style={{
          width: screenWidth - 32,
          minWidth: 200,
          height,
          alignSelf: 'center',
        }}
      />
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: 'bold',
    fontSize: 28,
    textAlign: 'center',
  },
});