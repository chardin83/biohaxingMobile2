import { useTheme } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';

import AppButton from './ui/AppButton';

interface ThemedModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave?: () => void;
  onSaveDisabled?: boolean;
  okLabel?: string;
  onSaveGlow?: boolean;

  onSecondarySave?: () => void;
  ok2Label?: string;

  cancelLabel?: string;
  showCancelButton?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const ThemedModal = ({
  visible,
  title,
  onClose,
  onSave,
  onSaveDisabled = false,
  onSaveGlow = false,
  onSecondarySave,
  okLabel,
  ok2Label,
  cancelLabel,
  showCancelButton = true,
  children,
  style,
}: ThemedModalProps) => {
  const { t } = useTranslation();
  const { colors, dark } = useTheme();

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <BlurView
        intensity={25}
        tint={dark ? 'dark' : 'light'}
        style={styles.overlay}
      >
        <View
          style={[
            styles.modal,
            {
              backgroundColor: colors.modalBackground,
              borderColor: colors.border,
            },
            style,
          ]}
        >
          <ThemedText type="title2" style={[styles.title, { color: colors.primary }]}>
            {title}
          </ThemedText>

          {children}

          {(onSecondarySave || onSave || showCancelButton) && (
            <View style={styles.buttonRow}>
              <LinearGradient
                colors={[colors.borderLight, 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.buttonRowFade}
                pointerEvents="none"
              />
              {showCancelButton && (
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.cancelTextButton}
                  accessibilityRole="button"
                  accessibilityLabel={cancelLabel ?? t('general.cancel')}
                >
                  <ThemedText type="defaultSemiBold" style={[styles.cancelText, { color: colors.textLight }]}>
                    {cancelLabel ?? t('general.cancel')}
                  </ThemedText>
                </TouchableOpacity>
              )}
              {onSecondarySave && (
                <AppButton onPress={onSecondarySave} title={ok2Label ?? t('general.secondary')} variant="primary" />
              )}
              {onSave && (
                <AppButton
                  onPress={onSave}
                  title={okLabel ?? t('general.save')}
                  variant="primary"
                  disabled={onSaveDisabled}
                  glow={onSaveGlow}
                />
              )}
            </View>
          )}
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    borderRadius: globalStyles.borders.borderRadius,
    borderWidth: 2,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    maxHeight: '90%',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonRow: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 24,
  },
  buttonRowFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    opacity: 0.55,
  },
  cancelTextButton: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.78,
  },
  cancelText: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
