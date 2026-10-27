import { useTheme } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';

import type { IconSymbolName } from './ui/icon-symbol-map';
import { IconSymbol } from './ui/IconSymbol';
import { SaveCancelButtons } from './ui/SaveCancelButtons';

interface ThemedModalProps {
  visible: boolean;
  title: React.ReactNode;
  titleColor?: string;
  iconName?: IconSymbolName;
  iconColor?: string;
  onClose: () => void;
  onSave?: () => void;
  onSaveDisabled?: boolean;
  okLabel?: string;
  onSaveGlow?: boolean;

  showCancelButton?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const ThemedModal = ({
  visible,
  title,
  titleColor,
  iconName,
  iconColor,
  onClose,
  onSave,
  onSaveDisabled = false,
  onSaveGlow = false,
  okLabel,
  showCancelButton = true,
  children,
  style,
}: ThemedModalProps) => {
  const { colors, dark } = useTheme();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <BlurView intensity={25} tint={dark ? 'dark' : 'light'} style={styles.overlay}>
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[
            styles.modal,
            {
              backgroundColor: colors.modalBackground,
              borderColor: colors.border,
            },
            style,
          ]}
        >
          {iconName && <IconSymbol name={iconName} size={40} color={iconColor ?? colors.warning} />}
          <ThemedText accessibilityRole="header" type="title2" style={[styles.title, { color: titleColor ?? colors.primary }]}>
            {title}
          </ThemedText>

          {children}

          {(onSave || showCancelButton) && (
            <View style={styles.buttonRow}>
              <LinearGradient
                colors={[colors.borderLight, 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.buttonRowFade}
                pointerEvents="none"
              />
              <SaveCancelButtons
                onCancel={onClose}
                onSave={onSave}
                showCancelButton={showCancelButton}
                saveTitle={okLabel}
                saveDisabled={onSaveDisabled}
                saveGlow={onSaveGlow}
                style={styles.actions}
              />
            </View>
          )}
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  actions: { width: '100%' },
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
    flexWrap: 'wrap',
    gap: 12,
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
});
