import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';

import AppButton from './ui/AppButton';

interface ThemedModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave?: () => void;
  okLabel?: string;

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
  onSecondarySave,
  okLabel,
  ok2Label,
  cancelLabel,
  showCancelButton = true,
  children,
  style,
}: ThemedModalProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            {
              backgroundColor: colors.secondary,
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
              {onSecondarySave && (
                <AppButton onPress={onSecondarySave} title={ok2Label ?? t('general.secondary')} variant="primary" />
              )}
              {onSave && <AppButton onPress={onSave} title={okLabel ?? t('general.save')} variant="primary" />}
              {showCancelButton && (
                <AppButton onPress={onClose} title={cancelLabel ?? t('general.cancel')} variant="secondary" />
              )}
            </View>
          )}
        </View>
      </View>
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
    padding: 24,
    width: '90%',
    alignItems: 'center',
    borderWidth: 1,
    maxHeight: '90%',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
    gap: 3,
  },
});
