import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

interface MetricContainerProps {
  children: React.ReactNode;
  showDivider?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  borderColor?: string;
  style?: ViewStyle | ViewStyle[];
}

export function MetricContainer({
  children,
  showDivider = false,
  isSelected = false,
  onPress,
  borderColor = 'transparent',
  style,
}: Readonly<MetricContainerProps>) {
  const { colors } = useTheme();
  const containerStyle: ViewStyle[] = [
    styles.metricContainer,
    { borderColor },
    isSelected && styles.selected,
    isSelected ? { backgroundColor: colors.overlayLight } : {},
    style as any,
  ];


  const divider = showDivider ? (
    <View pointerEvents="none" style={[styles.dividerBar, { backgroundColor: colors.borderLight }]} />
  ) : null;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          containerStyle,
          pressed && !isSelected && { backgroundColor: colors.overlayLight },
        ]}
      >
        <View style={styles.contentContainer}>{children}</View>
        {divider}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle}>
      <View style={styles.contentContainer}>{children}</View>
      {divider}
    </View>
  );
}

const styles = StyleSheet.create({
  metricContainer: {
    flex: 1,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 16,
  },
  dividerBar: {
    position: 'absolute',
    top: 16,
    right: 0,
    bottom: 16,
    width: 1,
  },
  selected: {
    borderWidth: 1,
  },
  contentContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
