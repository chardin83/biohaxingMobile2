import React from "react";
import { View, Text, TextInput, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { ThemedModal } from "@/components/ThemedModal";
import { Colors } from "@/constants/Colors";
import AppButton from "@/components/ui/AppButton";

export type CreatePlanData = {
  name: string;
  prefferedTime: string; // HH:MM
  notify: boolean;
};

interface CreatePlanModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (plan: CreatePlanData) => void;
}

const CreatePlanModal: React.FC<CreatePlanModalProps> = ({ visible, onClose, onCreate }) => {
  const { t } = useTranslation();
  const [planName, setPlanName] = React.useState("");
  const [time, setTime] = React.useState(new Date());
  const [showTimePicker, setShowTimePicker] = React.useState(Platform.OS === "ios");

  const handleSave = () => {
    if (!planName.trim()) return;
    const prefferedTime = time.toTimeString().slice(0, 5);
    onCreate({ name: planName.trim(), prefferedTime, notify: false });
    setPlanName("");
    setTime(new Date());
  };

  return (
    <ThemedModal
      visible={visible}
      title={t("plan.createPlan")}
      onClose={() => {
        onClose();
        setPlanName("");
        setTime(new Date());
      }}
      onSave={handleSave}
      okLabel={t("general.save")}
      cancelLabel={t("general.cancel")}
    >
      <View style={{ width: "100%" }}>
        <TextInput
          style={styles.input}
          placeholder={t("plan.planName")}
          value={planName}
          onChangeText={setPlanName}
        />

        {Platform.OS === "android" && (
          <AppButton
            title={`${t("plan.prefferedTime")}: ${time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
            onPress={() => setShowTimePicker(true)}
            variant="secondary"
            style={styles.timePickerButton}
          />
        )}

        {Platform.OS === "ios" && (
          <Text style={styles.timePickerText}>{t("plan.prefferedTime")}</Text>
        )}

        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour
            display="default"
            onChange={(event, selectedTime) => {
              if (Platform.OS === "android") setShowTimePicker(false);
              if (event.type === "set" && selectedTime) {
                setTime(selectedTime);
              }
            }}
          />
        )}
      </View>
    </ThemedModal>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 2,
    borderColor: Colors.dark.border,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    width: "100%",
    color: Colors.dark.text,
  },
  timePickerText: {
    fontSize: 16,
    color: Colors.dark.text,
    padding: 10,
  },
  timePickerButton: {
    marginTop: 8,
  },
});

export default CreatePlanModal;
