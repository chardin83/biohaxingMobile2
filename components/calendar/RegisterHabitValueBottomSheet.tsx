import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';

import { useBottomSheetDesign } from '../ui/BottomSheetDesign';
import LabeledBottomSheetInput from '../ui/LabeledBottomSheetInput';

type RegisterHabitValueBottomSheetProps = {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  isVisible: boolean;
  title: string;
  unit: string;
  initialValue?: number;
  onSave: (value: number) => void;
  onClose: () => void;
};

export const RegisterHabitValueBottomSheet: React.FC<RegisterHabitValueBottomSheetProps> = ({
  bottomSheetRef,
  isVisible,
  title,
  unit,
  initialValue,
  onSave,
  onClose,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const sheetDesign = useBottomSheetDesign(colors);
  const snapPoints = useMemo(() => ['35%'], []);

  const [value, setValue] = useState('');

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    setValue(initialValue != null && initialValue > 0 ? String(initialValue) : '');

    requestAnimationFrame(() => {
      bottomSheetRef.current?.present();
    });
  }, [isVisible, initialValue, bottomSheetRef]);

  const handleSave = () => {
    const parsed = Number.parseFloat(value.replace(',', '.'));

    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    onSave(parsed);
  };

  const handleChange = (index: number) => {
    if (index === -1) {
      onClose();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleChange}
      animateOnMount
      handleIndicatorStyle={{
        backgroundColor: colors.text,
      }}
      backgroundStyle={sheetDesign.backgroundStyle}
      handleComponent={sheetDesign.handleComponent}
    >
      <BottomSheetScrollView style={styles.content} contentContainerStyle={styles.container} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
        <ThemedText type="title2">{title}</ThemedText>
        <View style={styles.valueRow}>
          <LabeledBottomSheetInput
            label={t('otherLoggerTab.registerToday')}
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            autoFocus
            isOptional={false}
            suffix={unit}
          />
        </View>
        <AppButton title={t('common:general.save')} onPress={handleSave} disabled={value.trim().length === 0} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 2,
  },

  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 24,
  },

  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 18,
  },
});
