import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

interface ImageAnalysisScannerProps {
  source: ImageSourcePropType;
  height?: number;
}

export const ImageAnalysisScanner: React.FC<ImageAnalysisScannerProps> = ({ source, height = 300 }) => {
  const { colors } = useTheme();
  const scanProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanProgress, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanProgress, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
      scanProgress.stopAnimation();
    };
  }, [scanProgress]);

  const translateY = scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height - 2],
  });

  return (
    <View style={[styles.container, { height }]}>
      <Image source={source} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.overlayLight }]} />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.scanGlow,
          {
            backgroundColor: colors.accentWeak,
            transform: [{ translateY }],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.scanner,
          {
            backgroundColor: colors.accentStrong,
            shadowColor: colors.accentStrong,
            transform: [{ translateY }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 16,
    position: 'relative',
  },

  scanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,

    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 0,
    },

    elevation: 8,
  },

  scanGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -8,
    height: 18,
  },
});
