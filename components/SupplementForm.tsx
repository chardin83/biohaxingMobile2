import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Supplement } from '@/app/domain/Supplement';
import SupplementDropdown from '@/components/SupplementsDropdown';
import LabeledInput from '@/components/ui/LabeledInput';

import AppButton from './ui/AppButton';
import { CancelButton } from './ui/CancelButton';

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
  const [supplement, setSupplement] = useState<Supplement | null>(preselectedSupplement);

  return (
    <View>
      {/* Supplement Dropdown */}
      <View style={[styles.dropdownWrapper, styles.row]}>
        <SupplementDropdown
          selectedTime={selectedTime}
          onSupplementSelect={(selectedSupplement: Supplement) => setSupplement(selectedSupplement)}
          preselectedSupplement={supplement?.name ?? null}
          disabled={isEditing}
        />
      </View>
      {/* Dosage and Unit Inputs on the same row */}
      <View style={styles.row}>
        <LabeledInput
          label={t('supplementForm.dosage')}
          placeholder={t('supplementForm.dosage')}
          value={supplement?.quantity}
          isOptional={false}
          onChangeText={text => setSupplement({ ...supplement, quantity: text } as Supplement)}
          containerStyle={[styles.inputHalf, styles.inputSpacing]}
        />

        <LabeledInput
          label={t('supplementForm.unit')}
          placeholder={t('supplementForm.unit')}
          value={supplement?.unit}
          isOptional={true}
          onChangeText={text => setSupplement({ ...supplement, unit: text } as Supplement)}
          containerStyle={styles.inputHalf}
        />
      </View>

      <View style={styles.buttonColumn}>
        <AppButton
          title={isEditing ? t('general.save') : t('general.add')}
          variant="primary"
          onPress={() => {
            if (supplement?.name && supplement?.quantity.trim() !== '') {
              onSave(supplement);
            }
          }}
        />
        <CancelButton onPress={onCancel} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonColumn: {
    flexDirection: 'column',
    marginTop: 24,
    marginBottom: 10,
  },
  inputSpacing: {
    marginRight: 12,
  },
  inputHalf: {
    flex: 1,
  },
  dropdownWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row', // Arrange inputs in a row
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});

export default SupplementForm;
