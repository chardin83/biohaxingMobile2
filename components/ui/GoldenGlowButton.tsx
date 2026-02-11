import { useTheme } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';

interface GoldenGlowButtonProps {
  title?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  transparent?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link';
  accessibilityHint?: string; // Lägg till denna rad
}

export const GoldenGlowButton: React.FC<GoldenGlowButtonProps> = ({
  title,
  onPress,
  disabled = false,
  style,
  transparent = true,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityHint, // Lägg till denna rad
}) => {
  const { colors, dark } = useTheme();
  const borderRadius = globalStyles.borders?.borderRadius ?? 12;
  const thickness = 2;

  const border = colors.cardBorder;
  const gold = colors.goldenGlowButtonGlow;
  const bg = colors.goldenGlowButtonBackground;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.wrap, style, disabled && styles.disabled]}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      accessible={true}
    >
      <View
        style={[
          styles.glowWrap,
          Platform.OS === 'ios'
            ? [
                styles.iosShadow,
                {
                  shadowColor: gold,
                  shadowOpacity: dark ? 0.2 : 0.6,
                  shadowRadius: dark ? 24 : 18,
                },
              ]
            : styles.androidElevation,
        ]}
      >
        <View style={[styles.frame, { borderRadius }]}>
          {/* Gradient border */}
          <LinearGradient
            colors={[
              rgbaFromAny(border, 0.22),
              rgbaFromAny(border, 0.18),
              rgbaFromAny(gold, 0.4),
              rgbaFromAny(gold, 0.65),
            ]}
            locations={[0, 0.45, 0.78, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius }]}
          />
          {/* Inre yta */}
          <View style={{ padding: thickness }}>
            <View
              style={[styles.inner, { borderRadius: borderRadius - thickness }]}
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 18 : 12}
                tint="dark"
                style={[StyleSheet.absoluteFill, { borderRadius: borderRadius - thickness }]}
              />
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: borderRadius - thickness,
                    backgroundColor: rgbaFromAny(bg, 0.72),
                  },
                ]}
              />
              <View
                style={[styles.content, { borderRadius: borderRadius - thickness }]}
              >
                {title && (
                  <ThemedText
                    type={transparent ? 'title3' : 'defaultSemiBold'}
                    style={[styles.title, { color: colors.goldenGlowButtonText }]}
                  >
                    {title}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

// ---- helpers ----
function rgbaFromAny(color: string, alpha: number) {
  if (!color) return `rgba(255,180,80,${alpha})`;
  if (color.startsWith('rgba')) {
    return color.replace(/,\s*[\d.]+\s*\)$/, `, ${alpha})`);
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }
  if (color.startsWith('#') && color.length === 7) {
    const r = Number.parseInt(color.slice(1, 3), 16);
    const g = Number.parseInt(color.slice(3, 5), 16);
    const b = Number.parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return `rgba(255,180,80,${alpha})`;
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginBottom: 20 },
  glowWrap: { overflow: 'visible' },
  frame: { overflow: 'hidden' },
  inner: { overflow: 'hidden' },
  content: { padding: 16 },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
    textAlign: 'center',
  },
  box: {
    borderWidth: 1,
    borderRadius: globalStyles.borders.borderRadius,
    padding: 16,
    width: '100%',
  },
  androidElevation: { elevation: 12 },
  iosShadow: {
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  disabled: { opacity: 0.5 },
});
