import { useTheme } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { ThemedText } from '../ThemedText';
import AppButton from '../ui/AppButton';
import { IconSymbol } from '../ui/IconSymbol';

interface NutritionImageAnalysisButtonProps {
  onImageSelected: (file: { uri: string; name: string; type: string }) => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
  glow?: boolean;
  buttonVariant?: 'primary' | 'secondary' | 'danger';
  style?: StyleProp<ViewStyle>;
}

const NutritionImageAnalysisButton: React.FC<NutritionImageAnalysisButtonProps> = ({
  onImageSelected,
  isLoading = false,
  disabled = false,
  label,
  glow = false,
  buttonVariant = 'primary',
  style,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const progress = React.useRef(new Animated.Value(0)).current;

  const analysisContent = isLoading ? (
    <View style={styles.analysisContent}>
      <View style={styles.steps}>
        <View style={styles.step}>
          <IconSymbol name="checkCircle" size={16} color={colors.accentStrong} />

          <ThemedText type="caption">{t('nutritionLogger.analysisImage')}</ThemedText>
        </View>

        <View style={styles.step}>
          <IconSymbol name="checkboxBlankOutline" size={16} color={colors.textMuted} />

          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('nutritionLogger.analysisNutrition')}
          </ThemedText>
        </View>

        <View style={styles.step}>
          <IconSymbol name="checkboxBlankOutline" size={16} color={colors.textMuted} />

          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('nutritionLogger.analysisPreparingResult')}
          </ThemedText>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: colors.accentVeryWeak }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: colors.accentStrong,
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-80, 180],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </View>
    </View>
  ) : null;

  React.useEffect(() => {
    if (!isLoading) {
      progress.stopAnimation();
      progress.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [isLoading, progress]);

  const handlePick = async (fromCamera: boolean) => {
    const permission = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();

    const granted = (permission as any).granted ?? (permission as any).status === 'granted';

    if (!granted) {
      Alert.alert(t('permissions.title'), t('permissions.message'));
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          base64: false,
          quality: 0.45,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          base64: false,
          quality: 0.45,
        });

    if (!result.canceled && result.assets?.length) {
      const image = result.assets[0];
      const uri = image.uri;

      const name = (image as any).fileName ?? (image as any).name ?? (uri ? uri.split('/').pop() : undefined) ?? `photo_${Date.now()}.jpg`;

      const mimeType = (image as any).mimeType;

      let type = 'image/jpeg';

      if (typeof mimeType === 'string' && mimeType.trim().length > 0) {
        type = mimeType;
      } else if ((image as any).type && typeof (image as any).type === 'string') {
        type = (image as any).type;
      }

      onImageSelected({ uri, name, type });
    }
  };

  const showOptions = () => {
    Alert.alert(t('imagePicker.title'), undefined, [
      {
        text: t('imagePicker.takePhoto'),
        onPress: () => {
          handlePick(true).catch(console.error);
        },
      },
      {
        text: t('imagePicker.chooseFromLibrary'),
        onPress: () => {
          handlePick(false).catch(console.error);
        },
      },
      {
        text: t('general.cancel'),
        style: 'cancel',
      },
    ]);
  };

  return (
    <AppButton
      title={isLoading ? t('dayEdit.analyzing') : (label ?? t('dayEdit.pickImage'))}
      onPress={showOptions}
      disabled={isLoading || disabled}
      variant={buttonVariant}
      glow={glow}
      icon="camera"
      rightIcon="sparkles"
      content={analysisContent}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  analysisContent: {
    width: '100%',
    marginTop: 12,
    gap: 12,
  },

  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 22,
  },

  progressBar: {
    width: 80,
    height: '100%',
    borderRadius: 2,
  },

  steps: {
    gap: 6,
  },

  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default NutritionImageAnalysisButton;
