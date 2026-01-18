import React, { useEffect,useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

import { Supplement } from "@/app/domain/Supplement";
import { Colors } from "@/constants/Colors";
import { useSupplements } from "@/locales/supplements";

interface SupplementDropdownProps {
  selectedTime: Date;
  preselectedSupplement: string | null;
  onSupplementSelect: (supplement: Supplement) => void;
  disabled: boolean;
}

const SupplementDropdown: React.FC<SupplementDropdownProps> = ({
  selectedTime,
  onSupplementSelect,
  preselectedSupplement,
  disabled,
}) => {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(preselectedSupplement);
  const [lastSelectedValue, setLastSelectedValue] = useState<string | null>(
    preselectedSupplement
  );

  const supplements = useSupplements();

  useEffect(() => {
    const formattedItems = Array.isArray(supplements)
      ? supplements.map((item: Supplement) => ({
          label: `${item.name} (${item.quantity} ${item.unit}) / ${t(
            "supplementDropdown.day"
          )}`,
          value: item.name,
          supplement: item,
        }))
      : [];
    setItems(formattedItems);
  }, [i18n.language]);

  useEffect(() => {
    setValue(preselectedSupplement);
    setLastSelectedValue(preselectedSupplement);
  }, [preselectedSupplement]);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        {selectedTime && (
          <>
            <Text style={styles.label}>
              {t("supplementDropdown.chooseSupplement")}
            </Text>
            <DropDownPicker
              open={open}
              value={value}
              items={items}
              setOpen={setOpen}
              setValue={setValue}
              setItems={setItems}
              placeholder={t("supplementDropdown.searchAndAdd")}
              searchable
              searchPlaceholder={t("supplementDropdown.search")}
              disabled={disabled}
              onChangeValue={(newValue) => {
                if (newValue && newValue !== lastSelectedValue) {
                  setLastSelectedValue(newValue);
                  const selected = items.find(
                    (item) => item.value === newValue
                  )?.supplement;
                  if (selected) {
                    onSupplementSelect(selected);
                  }
                }
              }}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
              placeholderStyle={styles.placeholder}
              listItemLabelStyle={styles.listItem}
              searchContainerStyle={styles.searchContainer}
              searchTextInputStyle={styles.searchInput}
              zIndex={3000}
              listMode="SCROLLVIEW"
              autoScroll
            />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    width: "100%",
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1000,
  },
  label: {
    fontSize: 16,
    color: Colors.dark.textLight,
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: "transparent",
    borderColor: Colors.dark.borderLight,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  dropdownContainer: {
    backgroundColor: Colors.dark.secondary,
    borderColor: Colors.dark.borderLight,
    borderRadius: 12,
    maxHeight: 200,
  },
  dropdownText: {
    color: Colors.dark.textWhite,
  },
  placeholder: {
    color: Colors.dark.textLight,
    fontStyle: "italic",
  },
  listItem: {
    color: Colors.dark.textWhite,
  },
  searchContainer: {
    borderBottomColor: Colors.dark.borderLight,
  },
  searchInput: {
    backgroundColor: Colors.dark.background,
    color: Colors.dark.textWhite,
  },
});

export default SupplementDropdown;
