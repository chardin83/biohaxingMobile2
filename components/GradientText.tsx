import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions,StyleSheet, Text  } from 'react-native';

export function GradientText({
  children,
  style,
  colors = ['#FFD700', '#FFB300', '#FFFACD'] as const,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  ...rest
}: {
  children: React.ReactNode;
  style?: any;
  colors?: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}) {
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
        colors={colors}
        start={start}
        end={end}
        style={{
          width: screenWidth - 32, // eller annan rimlig bredd
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