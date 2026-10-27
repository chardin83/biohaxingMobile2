import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Supplement } from '@/app/domain/Supplement';
import SupplementDropdown from '@/components/SupplementsDropdown';
import { SupplementWarnings } from '@/components/SupplementWarnings';
import { ThemedText } from '@/components/ThemedText';
import TextInput, { TextInputRow } from '@/components/ui/inputs/TextInput';

import AppButton from './ui/AppButton';
import { useBottomSheetDesign } from './ui/BottomSheetDesign';
import { CancelButton } from './ui/CancelButton';
import { DateTimeInput } from './ui/inputs/DateTimeInput';
import { InputLabel } from './ui/inputs/InputLabel';

interface SupplementFormProps {
  selectedTime: Date;
  isEditing: boolean;
  lockSupplement?: boolean;
  preselectedSupplement: Supplement | null;
  onSelectedTimeChange?: (time: Date) => void;
  footer?: React.ReactNode;
  onSave: (supplement: Supplement) => void | boolean | Promise<void | boolean>;
  onCancel: () => void;
}

const SupplementForm: React.FC<SupplementFormProps> = ({
  selectedTime,
  isEditing,
  lockSupplement = false,
  preselectedSupplement,
  onSelectedTimeChange,
  footer,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const sheetDesign = useBottomSheetDesign(colors);
  const [supplement, setSupplement] = useState<Supplement | null>(preselectedSupplement);
  const [isSaving, setIsSaving] = useState(false);
  const [hasFixedUnit, setHasFixedUnit] = useState(Boolean(preselectedSupplement?.id && preselectedSupplement.unit?.trim()));
  const [showValidation, setShowValidation] = useState(false);
  const savingRef = useRef(false);
  const selectionIsValid = Boolean(supplement?.id && supplement.name?.trim());
  const quantity = supplement?.quantity?.trim() ?? '';
  const numericQuantity = Number(quantity.replace(',', '.'));
  const doseIsValid = quantity !== '' && Number.isFinite(numericQuantity) && numericQuantity > 0;
  const unitIsValid = Boolean(supplement?.unit?.trim());
  const selectionError = showValidation && !selectionIsValid ? t('labeledInput.requiredError') : undefined;
  let doseError: string | undefined;
  if (showValidation && !doseIsValid) {
    doseError = quantity === '' ? t('labeledInput.requiredError') : t('supplementForm.invalidDosage');
  }
  const unitError = showValidation && !unitIsValid ? t('labeledInput.requiredError') : undefined;

  const handleSave = async () => {
    if (savingRef.current) return;
    setShowValidation(true);
    if (!supplement || !selectionIsValid || !doseIsValid || !unitIsValid) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      const saved = await onSave(supplement);
      if (saved !== false) bottomSheetRef.current?.dismiss();
    } catch (error) {
      console.error('Failed to save supplement:', error);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };
  const canEditSelectedTime = Boolean(onSelectedTimeChange);

  useEffect(() => {
    bottomSheetRef.current?.present();
  }, []);

  const closeForm = () => {
    bottomSheetRef.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['65%', '90%']}
      enablePanDownToClose={!isSaving}
      backgroundStyle={sheetDesign.backgroundStyle}
      handleComponent={sheetDesign.handleComponent}
      onDismiss={onCancel}
    >
      <BottomSheetScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
        <DateTimeInput
          value={selectedTime}
          onChange={onSelectedTimeChange ?? (() => undefined)}
          showTime
          showDate={false}
          buttonIcon="clock"
          disabled={!canEditSelectedTime}
        />
        <View style={[styles.dropdownWrapper, styles.row]}>
          <SupplementDropdown
            selectedTime={selectedTime}
            onSupplementSelect={(selectedSupplement: Supplement) => {
              setSupplement(selectedSupplement);
              setHasFixedUnit(Boolean(selectedSupplement.id && selectedSupplement.unit?.trim()));
            }}
            errorText={selectionError}
            preselectedSupplement={supplement?.name ?? null}
            disabled={isEditing || lockSupplement}
          />
        </View>
        <TextInputRow helperText={t('supplementForm.exampleDosage')}>
          <TextInput
            label={t('supplementForm.dosage')}
            placeholder={t('supplementForm.dosage')}
            value={supplement?.quantity}
            keyboardType="decimal-pad"
            isOptional={false}
            errorText={doseError}
            onChangeText={text => setSupplement({ ...supplement, quantity: text } as Supplement)}
            containerStyle={styles.inputHalf}
          />

          {hasFixedUnit ? (
            <View style={styles.inputHalf}>
              <InputLabel label={t('supplementForm.unit')} isOptional={false} />
              <View style={[styles.lockedUnitRow, { backgroundColor: colors.secondaryBackground }]}>
                <ThemedText type="defaultSemiBold">{supplement?.unit}</ThemedText>
                <ThemedText type="explainer" style={{ color: colors.textMuted }}>
                  {t('general.fixed', { defaultValue: 'Fast' })}
                </ThemedText>
              </View>
            </View>
          ) : (
            <TextInput
              label={t('supplementForm.unit')}
              isOptional={false}
              errorText={unitError}
              placeholder={t('supplementForm.unit')}
              value={supplement?.unit}
              onChangeText={text => setSupplement({ ...supplement, unit: text } as Supplement)}
              containerStyle={styles.inputHalf}
            />
          )}
        </TextInputRow>

        <SupplementWarnings supplement={supplement} />
        <View style={styles.buttonColumn}>
          <AppButton
            title={isEditing ? t('general.save') : t('general.add')}
            variant="primary"
            disabled={isSaving}
            busy={isSaving}
            onPress={handleSave}
          />
          <CancelButton onPress={closeForm} disabled={isSaving} />
        </View>
        {footer}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  sheetContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  buttonColumn: {
    flexDirection: 'column',
    marginTop: 24,
    marginBottom: 10,
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
  lockedUnitRow: {
    borderRadius: 8,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});

export default SupplementForm;
