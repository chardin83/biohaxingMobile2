import React, { useEffect } from "react";
import {
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ThemedModal } from "@/components/ThemedModal";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import LabeledInput from "@/components/ui/LabeledInput";

type TrainingSettingsModalProps = {
  visible: boolean;
  title: string;
  sessionsPlaceholder: string;
  durationPlaceholder: string;
  sessionsLabel: string;
  durationLabel: string;
  sessionsValue: string;
  durationValue: string;
  onChangeSessions: (value: string) => void;
  onChangeDuration: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
  saveLabel: string;
  cancelLabel: string;
  trainingTitle?: string | null;
};

const TrainingSettingsModal: React.FC<TrainingSettingsModalProps> = ({
  visible,
  title,
  sessionsPlaceholder,
  durationPlaceholder,
  sessionsLabel,
  durationLabel,
  sessionsValue,
  durationValue,
  onChangeSessions,
  onChangeDuration,
  onSave,
  onClose,
  saveLabel,
  cancelLabel,
  trainingTitle,
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
          {trainingTitle ? (
            <ThemedText type="defaultSemiBold" style={styles.trainingTitle}>
              {trainingTitle}
            </ThemedText>
          ) : null}
          <LabeledInput
            label={sessionsLabel}
            keyboardType="number-pad"
            placeholder={
              sessionsPlaceholder === sessionsLabel ? undefined : sessionsPlaceholder
            }
            value={sessionsValue}
            onChangeText={onChangeSessions}
            containerStyle={styles.fieldBlock}
            returnKeyType="done"
            blurOnSubmit
          />
          <LabeledInput
            label={durationLabel}
            keyboardType="number-pad"
            placeholder={
              durationPlaceholder === durationLabel ? undefined : durationPlaceholder
            }
            value={durationValue}
            onChangeText={onChangeDuration}
            containerStyle={styles.fieldBlock}
            returnKeyType="done"
            blurOnSubmit
          />
        </View>
      </TouchableWithoutFeedback>
    </ThemedModal>
  );
};

export default TrainingSettingsModal;

const styles = StyleSheet.create({
  trainingTitle: {
    marginBottom: 4,
    color: Colors.dark.text,
  },
  content: {
    width: "100%",
  },
  fieldBlock: {
    width: "100%",
    marginTop: 10,
  },
});
