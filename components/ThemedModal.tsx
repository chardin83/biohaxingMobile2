import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { borders } from '@/app/theme/styles';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

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

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={[styles.modal, style]}>
          <ThemedText type="title" style={styles.title}>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: borders.radius,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    maxHeight: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // För att sprida ut knapparna
    alignItems: 'center',
    width: '100%', // så de radas upp i hela bredden
    marginTop: 24,
    gap: 3, // valfritt
  },
});
