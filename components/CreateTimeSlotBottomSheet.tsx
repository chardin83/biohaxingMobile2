import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { useBottomSheetDesign } from '@/components/ui/BottomSheetDesign';
import { CancelButton } from '@/components/ui/CancelButton';
import { DateTimeInput } from '@/components/ui/DateTimeInput';
import LabeledInput from '@/components/ui/LabeledInput';
import { getTimeSlotNameKey } from '@/utils/timeSlotName';

const SNAP_POINTS = ['50%', '75%', '90%'];

export type CreatePlanData = {
  name: string;
  prefferedTime: string;
  notify: boolean;
};

type Props = Readonly<{
  visible: boolean;
  onClose: () => void;
  onCreate: (plan: CreatePlanData) => void | Promise<void>;
  initialName?: string;
  initialTime?: Date;
  onDelete?: () => void;
  children?: React.ReactNode;
}>;

export default function CreateTimeSlotBottomSheet({ visible, onClose, onCreate, initialName = '', initialTime, onDelete, children }: Props) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const design = useBottomSheetDesign(colors);
  const sheetRef = React.useRef<BottomSheetModal>(null);
  const wasVisible = React.useRef(false);
  const externalClose = React.useRef(false);
  const manualName = React.useRef(Boolean(initialName));
  const [time, setTime] = React.useState(() => initialTime ?? new Date());
  const [planName, setPlanName] = React.useState(() => initialName || t(`plan.defaultPlan.${getTimeSlotNameKey(initialTime ?? new Date())}`));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (visible && !wasVisible.current) {
      const nextTime = initialTime ?? new Date();
      manualName.current = Boolean(initialName);
      setTime(nextTime);
      setPlanName(initialName || t(`plan.defaultPlan.${getTimeSlotNameKey(nextTime)}`));
      externalClose.current = false;
      sheetRef.current?.present();
    } else if (!visible && wasVisible.current) {
      externalClose.current = true;
      sheetRef.current?.dismiss();
    }
    wasVisible.current = visible;
  }, [visible, initialName, initialTime, t]);

  const renderBackdrop = React.useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      enableContentPanningGesture={false}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={design.backgroundStyle}
      handleComponent={design.handleComponent}
      onDismiss={() => {
        if (!externalClose.current) onClose();
      }}
    >
      <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <ThemedText type="title2" accessibilityRole="header">
          {t(initialName ? 'plan.editTimeSlot' : 'plan.addTimeSlot')}
        </ThemedText>
        <DateTimeInput
          value={time}
          showTime
          showDate={false}
          timeLabel={t('plan.prefferedTime')}
          onPickerOpenChange={isOpen => {
            if (Platform.OS === 'ios' && isOpen) sheetRef.current?.snapToIndex(1);
          }}
          onChange={nextTime => {
            setTime(nextTime);
            if (!manualName.current) setPlanName(t(`plan.defaultPlan.${getTimeSlotNameKey(nextTime)}`));
          }}
        />
        <LabeledInput
          label={t('plan.timeSlotNameLabel')}
          value={planName}
          isOptional={false}
          onChangeText={name => {
            manualName.current = true;
            setPlanName(name);
          }}
        />
        {children}
        <AppButton
          title={t('general.save')}
          disabled={saving || !planName.trim()}
          onPress={async () => {
            if (saving || !planName.trim()) return;
            setSaving(true);
            try {
              await onCreate({
                name: planName.trim(),
                prefferedTime: `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`,
                notify: false,
              });
            } finally {
              setSaving(false);
            }
          }}
        />
        {initialName && onDelete && <AppButton title={t('general.delete')} onPress={onDelete} variant="danger" />}
        <CancelButton onPress={() => sheetRef.current?.dismiss()} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 20, paddingTop: 8, gap: 16 } });
