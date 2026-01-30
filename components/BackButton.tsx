import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/app/theme/Colors';

interface BackButtonProps {
  readonly onPress?: () => void;
  readonly style?: any;
}

export default function BackButton({ onPress, style }: BackButtonProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <Pressable onPress={handlePress} style={[styles.backButton, style]}>
      {Platform.OS === 'ios' && (
        <BlurView
          tint="systemChromeMaterial"
          intensity={100}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.buttonContent} pointerEvents="box-none">
        <Text style={styles.backText}>
          <Text style={styles.arrowText}>{'‹'}</Text> {t('back')}
        </Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : Colors.dark.overlayLight,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  backText: {
    color: Colors.dark.textPrimary,
    fontSize: 17,
  },
  arrowText: {
    color: Colors.dark.accentStrong,
    fontSize: 24,
  },
});
