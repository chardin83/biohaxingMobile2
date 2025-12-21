import React, { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import SupplementDropdown from "@/components/SupplementsDropdown";
import { Supplement } from "@/app/domain/Supplement";
import AppButton from "./ui/AppButton";
import { Colors } from "@/constants/Colors";

interface SupplementFormProps {
  selectedTime: Date;
  isEditing: boolean;
  preselectedSupplement: Supplement | null;
  onSave: (supplement: Supplement) => void;
  onCancel: () => void;
}

const SupplementForm: React.FC<SupplementFormProps> = ({
  selectedTime,
  isEditing,
  preselectedSupplement,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [supplement, setSupplement] = useState<Supplement | null>(
    preselectedSupplement
  );

  return (
    <View>
      {/* Supplement Dropdown */}
      <View style={[styles.dropdownWrapper, styles.row]}>
        <SupplementDropdown
          selectedTime={selectedTime}
          onSupplementSelect={(selectedSupplement: Supplement) =>
            setSupplement(selectedSupplement)
          }
          preselectedSupplement={supplement?.name ?? null}
          disabled={isEditing}
        />
      </View>
      {/* Dosage and Unit Inputs on the same row */}
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.inputHalf]}
          placeholder={t("supplementForm.dosage")}
          value={supplement?.quantity}
          onChangeText={(text) =>
            setSupplement({ ...supplement, quantity: text } as Supplement)
          }
        />
        <TextInput
          style={[styles.input, styles.inputHalf]}
          placeholder={t("supplementForm.unit")}
          value={supplement?.unit}
          onChangeText={(text) =>
            setSupplement({ ...supplement, unit: text } as Supplement)
          }
        />
      </View>
      <View style={styles.row}>
        {/* Save Button */}
        <View style={styles.button}>
          <AppButton
            title={isEditing ? t("general.save") : t("general.add")}
            variant="primary"
            onPress={() => {
              if (supplement?.name && supplement?.quantity.trim() !== "") {
                onSave(supplement);
              }
            }}
          />
        </View>
        <View style={styles.button}>
          <AppButton
            title={t("general.cancel")}
            variant="secondary"
            onPress={onCancel}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 2,
    borderColor: Colors.dark.border,
    color: Colors.dark.text,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  inputHalf: {
    flex: 1, // Take up half the row width
    marginHorizontal: 5, // Add spacing between inputs
  },
  dropdownWrapper: {
    width: "100%",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row", // Arrange inputs in a row
    justifyContent: "space-between",
    marginBottom: 10,
  },
  button: {
    flex: 1, // Each button takes equal space
    marginHorizontal: 5, // Add spacing between buttons
  },
});

export default SupplementForm;
