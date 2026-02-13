import React, { useEffect } from 'react';
import { Keyboard, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedModal } from '@/components/ThemedModal';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import LabeledInput from '@/components/ui/LabeledInput';

type NutritionSettingsModalProps = {
  visible: boolean;
  title: string;
  commentPlaceholder: string;
  commentLabel: string;
  commentValue: string;
  onChangeComment: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
  saveLabel: string;
  cancelLabel: string;
  deleteLabel: string;
  nutritionTitle?: string | null;
};

const NutritionSettingsModal: React.FC<NutritionSettingsModalProps> = ({
  visible,
  title,
  commentPlaceholder,
  commentLabel,
  commentValue,
  onChangeComment,
  onSave,
  onClose,
  onDelete,
  saveLabel,
  cancelLabel,
  deleteLabel,
  nutritionTitle,
}) => {
  useEffect(() => {
    if (!visible) {
      Keyboard.dismiss();
    }
  }, [visible]);

  return (
    <ThemedModal
      visible={visible}
      title={title}
      onSave={onSave}
      onClose={onClose}
      okLabel={saveLabel}
      cancelLabel={cancelLabel}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.content}>
          {nutritionTitle ? (
            <ThemedText type="title3" style={styles.nutritionTitle}>
              {nutritionTitle}
            </ThemedText>
          ) : null}
          <LabeledInput
            label={commentLabel}
            placeholder={commentPlaceholder === commentLabel ? undefined : commentPlaceholder}
            value={commentValue}
            onChangeText={onChangeComment}
            containerStyle={styles.fieldBlock}
            returnKeyType="done"
            blurOnSubmit
            multilineInput
          />
          {onDelete ? (
            <AppButton
              title={deleteLabel}
              onPress={onDelete}
              variant="danger"
              style={globalStyles.marginTop16}
            />
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    </ThemedModal>
  );
};

export default NutritionSettingsModal;

const styles = StyleSheet.create({
  nutritionTitle: {
    marginBottom: 4,
  },
  content: {
    width: '100%',
  },
  fieldBlock: {
    width: '100%',
    marginTop: 10,
  },
});