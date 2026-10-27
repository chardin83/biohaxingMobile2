import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { ThemedText } from '../ThemedText';
import { useBottomSheetDesign } from '../ui/BottomSheetDesign';
import BottomSheetTextInput from '../ui/inputs/BottomSheetTextInput';
import { DateTimeInput } from '../ui/inputs/DateTimeInput';
import { SaveCancelButtons } from '../ui/SaveCancelButtons';

interface EntryEditBottomSheetProps {
  visible: boolean;
  title: string;
  nameLabel: string;
  timeLabel: string;
  name: string;
  recordedAt: Date;
  onNameChange: (name: string) => void;
  onRecordedAtChange: (recordedAt: Date) => void;
  onClose: () => void;
  onSave: () => void;
}

const EntryEditBottomSheet: React.FC<EntryEditBottomSheetProps> = ({
  visible,
  title,
  nameLabel,
  timeLabel,
  name,
  recordedAt,
  onNameChange,
  onRecordedAtChange,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const sheetDesign = useBottomSheetDesign(colors);
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  React.useEffect(() => {
    if (!visible) {
      bottomSheetRef.current?.dismiss();
      return;
    }
    const frame = requestAnimationFrame(() => bottomSheetRef.current?.present());
    return () => cancelAnimationFrame(frame);
  }, [visible]);
  const [showValidation, setShowValidation] = React.useState(false);
  React.useEffect(() => { setShowValidation(false); }, [visible]);
  const nameError = showValidation && !name.trim() ? t('labeledInput.requiredError') : undefined;
  const timeIsValid = Number.isFinite(recordedAt.getTime());
  const timeHasError = showValidation && !timeIsValid;
  const handleSave = () => {
    setShowValidation(true);
    if (!name.trim() || !timeIsValid) return;
    onSave();
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      maxDynamicContentSize={480}
      enablePanDownToClose
      onDismiss={onClose}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={sheetDesign.backgroundStyle}
      handleComponent={sheetDesign.handleComponent}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="title3" accessibilityRole="header">{title}</ThemedText>
        <BottomSheetTextInput label={nameLabel} value={name} onChangeText={onNameChange} isOptional={false} errorText={nameError} autoCapitalize="sentences" autoCorrect={false} />
        <DateTimeInput label={timeLabel} value={recordedAt} hasError={timeHasError} showTime showDate={false} onChange={onRecordedAtChange} />
        <SaveCancelButtons onSave={handleSave} onCancel={onClose} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
});

export default EntryEditBottomSheet;
