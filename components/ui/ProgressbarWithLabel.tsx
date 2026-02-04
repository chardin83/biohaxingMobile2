// components/ProgressBarWithLabel.tsx
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Progress from 'react-native-progress';

interface Props {
  progress: number; // 0 to 1
  label?: string;
  width?: number; // Endast numerisk width
  height?: number;
  style?: any;
  color?: string;
  unfilledColor?: string;
}

export default function ProgressBarWithLabel({
  progress,
  label,
  width = 200, // Default numerisk width
  height = 8,
  style,
  color,
  unfilledColor,
}: Readonly<Props>) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Progress.Bar
        progress={progress}
        width={width}
        height={height}
        color={color || colors.progressBar}
        unfilledColor={unfilledColor || colors.secondaryBackground}
        borderRadius={5}
        borderWidth={0}
        testID="progress-bar"
      />
      {label && (
        <Text style={[styles.label, { color: colors.textLight }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  label: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 12,
  },
});
