import { useTheme } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

interface BackButtonProps {
  readonly onPress?: () => void;
  readonly style?: any;
}

export default function BackButton({ onPress, style }: BackButtonProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  const backgroundColor =
    Platform.OS === 'ios' ? 'transparent' : colors.overlayLight;

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.backButton,
        style,
        { backgroundColor },
      ]}
    >
      {Platform.OS === 'ios' && (
        <BlurView
          tint="systemChromeMaterial"
          intensity={100}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.buttonContent} pointerEvents="box-none">
        <ThemedText type="defaultSemiBold">
          <ThemedText type="title2" style={[{ color: colors.primary }]}>
            {'‹'}
          </ThemedText>{' '}
          {t('back')}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 50,
    left: 10,
    zIndex: 100,
    overflow: 'hidden',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minWidth: 48,
    maxWidth: 120,
    minHeight: 36,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});
