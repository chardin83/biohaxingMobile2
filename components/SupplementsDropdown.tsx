import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

import { Supplement } from '@/app/domain/Supplement';
import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { useSupplements } from '@/locales/supplements';

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
  const { colors } = useTheme();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(preselectedSupplement);
  const [lastSelectedValue, setLastSelectedValue] = useState<string | null>(preselectedSupplement);

  const supplements = useSupplements();

  useEffect(() => {
    const formattedItems = Array.isArray(supplements)
      ? supplements.map((item: Supplement) => ({
          label: `${item.name} (${item.quantity} ${item.unit}) / ${t('supplementDropdown.day')}`,
          value: item.name,
          supplement: item,
        }))
      : [];
    setItems(formattedItems);
  }, [i18n.language, supplements, t]);

  useEffect(() => {
    setValue(preselectedSupplement);
    setLastSelectedValue(preselectedSupplement);
  }, [preselectedSupplement]);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {selectedTime && (
          <>
            <ThemedText type="label">
              {t('supplementDropdown.chooseSupplement')}
            </ThemedText>
            <DropDownPicker
              open={open}
              value={value}
              items={items}
              setOpen={setOpen}
              setValue={setValue}
              setItems={setItems}
              placeholder={t('supplementDropdown.searchAndAdd')}
              searchable
              searchPlaceholder={t('supplementDropdown.search')}
              disabled={disabled}
              onChangeValue={newValue => {
                if (newValue && newValue !== lastSelectedValue) {
                  setLastSelectedValue(newValue);
                  const selected = items.find(item => item.value === newValue)?.supplement;
                  if (selected) {
                    onSupplementSelect(selected);
                  }
                }
              }}
              style={[
                styles.dropdown,
                {
                  borderColor: colors.borderLight
                },
              ]}
              dropDownContainerStyle={[
                styles.dropdownContainer,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.borderLight,
                },
              ]}
              textStyle={{ color: colors.textWhite }}
              placeholderStyle={[styles.placeholder, { color: colors.textLight }]}
              listItemLabelStyle={{ color: colors.textWhite }}
              searchContainerStyle={{ borderBottomColor: colors.borderLight }}
              searchTextInputStyle={[
                { backgroundColor: colors.background, color: colors.textWhite },
              ]}
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
    width: '100%',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1000,
  },
  dropdown: {
    borderWidth: 1.5,
    borderRadius: globalStyles.borders.borderRadius,
    backgroundColor: 'transparent'
  },
  dropdownContainer: {
    borderRadius: globalStyles.borders.borderRadius,
    maxHeight: 200,
  },
  placeholder: {
    fontStyle: 'italic',
  },
});

export default SupplementDropdown;
