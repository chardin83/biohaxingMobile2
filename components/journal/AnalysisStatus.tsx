import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface AnalysisStatusProps {
  compact?: boolean;
}

const AnalysisStatus: React.FC<AnalysisStatusProps> = ({ compact = false }) => {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );

    progress.setValue(0);
    animation.start();

    return () => {
      animation.stop();
      progress.stopAnimation();
    };
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 240],
  });

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={[styles.progressTrack, { backgroundColor: colors.accentWeak }]}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: colors.accentStrong,
              transform: [{ translateX }],
            },
          ]}
        />
      </View>

      <View style={styles.steps}>
        <View style={styles.step}>
          <IconSymbol name="checkCircle" size={15} color={colors.accentStrong} />

          <ThemedText type="caption">Analyserar bilden</ThemedText>
        </View>

        <View style={styles.step}>
          <IconSymbol name="checkboxBlankOutline" size={15} color={colors.textMuted} />

          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            Beräknar näringsinnehåll
          </ThemedText>
        </View>

        <View style={styles.step}>
          <IconSymbol name="checkboxBlankOutline" size={15} color={colors.textMuted} />

          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            Förbereder resultatet
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 12,
    gap: 10,
  },

  containerCompact: {
    marginTop: 8,
  },

  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },

  progressBar: {
    width: '40%',
    height: '100%',
    borderRadius: 2,
  },

  steps: {
    alignSelf: 'center',
    gap: 4,
  },

  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

export default AnalysisStatus;
