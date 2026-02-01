import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedModal } from '@/components/ThemedModal';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import LabeledInput from '@/components/ui/LabeledInput';

export type CreatePlanData = {
  name: string;
  prefferedTime: string; // HH:MM
  notify: boolean;
};

interface CreateTimeSlotModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (plan: CreatePlanData) => void;
  initialName?: string;
  initialTime?: Date;
  onDelete?: () => void;
}

const CreateTimeSlotModal: React.FC<CreateTimeSlotModalProps> = ({
  visible,
  onClose,
  onCreate,
  initialName = '',
  initialTime = new Date(),
  onDelete,
}) => {
  const { t } = useTranslation();
  const [planName, setPlanName] = React.useState(initialName);
  const [time, setTime] = React.useState(initialTime);
  const [showTimePicker, setShowTimePicker] = React.useState(false);

  const isEditing = !!initialName;

  React.useEffect(() => {
    if (visible) {
      setPlanName(initialName);
      setTime(initialTime);
    }
  }, [visible, initialName, initialTime]);

  const handleSave = () => {
    if (!planName.trim()) return;
    const prefferedTime = time.toTimeString().slice(0, 5);
    onCreate({ name: planName.trim(), prefferedTime, notify: false });
    setPlanName('');
    setTime(new Date());
  };

  return (
    <ThemedModal
      visible={visible}
      title={isEditing ? t('plan.editTimeSlot') : t('plan.addTimeSlot')}
      onClose={() => {
        onClose();
        setPlanName('');
        setTime(new Date());
      }}
      onSave={handleSave}
      okLabel={t('general.save')}
      cancelLabel={t('general.cancel')}
    >
      <View style={styles.fullWidth}>
        <LabeledInput
          label={t('plan.timeSlotNameLabel', { defaultValue: 'Namn på tidpunkt' })}
          value={planName}
          onChangeText={setPlanName}
        />

        {Platform.OS === 'android' && (
          <AppButton
            title={`${t('plan.prefferedTime')}: ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            onPress={() => setShowTimePicker(true)}
            variant="secondary"
            style={globalStyles.marginTop8}
          />
        )}

        {Platform.OS === 'ios' && (
          <View>
            <ThemedText type="label">
              {`${t('plan.prefferedTime')}:`}
            </ThemedText>
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour
              display="spinner"
              onChange={(_, selectedTime) => {
                if (selectedTime) setTime(selectedTime);
              }}
              style={styles.fullWidth}
            />
          </View>
        )}

        {showTimePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (event.type === 'set' && selectedTime) {
                setTime(selectedTime);
              }
            }}
          />
        )}

        {isEditing && onDelete && (
          <AppButton
            title={t('general.delete', { defaultValue: 'Ta bort' })}
            onPress={onDelete}
            variant="danger"
            style={globalStyles.marginTop16}
          />
        )}
      </View>
    </ThemedModal>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
});

export default CreateTimeSlotModal;
