import React, { useEffect } from "react";
import {
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ThemedModal } from "@/components/ThemedModal";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";

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
          <View style={styles.fieldBlock}>
            <ThemedText type="caption" style={styles.label}>
              {sessionsLabel}
            </ThemedText>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder={
                sessionsPlaceholder === sessionsLabel ? undefined : sessionsPlaceholder
              }
              value={sessionsValue}
              onChangeText={onChangeSessions}
              returnKeyType="done"
              blurOnSubmit
            />
          </View>
          <View style={styles.fieldBlock}>
            <ThemedText type="caption" style={styles.label}>
              {durationLabel}
            </ThemedText>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder={
                durationPlaceholder === durationLabel ? undefined : durationPlaceholder
              }
              value={durationValue}
              onChangeText={onChangeDuration}
              returnKeyType="done"
              blurOnSubmit
            />
          </View>
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
  label: {
    marginBottom: 6,
    color: Colors.dark.textLight,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.dark.border,
    borderRadius: 5,
    padding: 10,
    width: "100%",
    color: Colors.dark.text,
  },
});
