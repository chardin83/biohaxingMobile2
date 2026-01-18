import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet,View } from "react-native";

import { Supplement } from "@/app/domain/Supplement";
import SupplementDropdown from "@/components/SupplementsDropdown";
import LabeledInput from "@/components/ui/LabeledInput";

import AppButton from "./ui/AppButton";

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
        <LabeledInput
          label={t("supplementForm.dosage")}
          placeholder={t("supplementForm.dosage")}
          value={supplement?.quantity}
          onChangeText={(text) =>
            setSupplement({ ...supplement, quantity: text } as Supplement)
          }
          containerStyle={styles.inputHalf}
        />
        <LabeledInput
          label={t("supplementForm.unit")}
          placeholder={t("supplementForm.unit")}
          value={supplement?.unit}
          onChangeText={(text) =>
            setSupplement({ ...supplement, unit: text } as Supplement)
          }
          containerStyle={styles.inputHalf}
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
  inputHalf: {
    flex: 1,
    marginHorizontal: 5,
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
    flex: 1,
    marginHorizontal: 5,
  },
});

export default SupplementForm;
