import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedModal } from '../ThemedModal';
import { ThemedText } from '../ThemedText';
import { DateTimeInput } from '../ui/DateTimeInput';
import LabeledInput from '../ui/LabeledInput';

interface EntryEditModalProps {
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

const EntryEditModal: React.FC<EntryEditModalProps> = ({
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
  const { colors } = useTheme();

  return (
    <ThemedModal visible={visible} title={title} onClose={onClose} onSave={onSave}>
      <View style={styles.content}>
        <LabeledInput label={nameLabel} value={name} onChangeText={onNameChange} autoCapitalize="sentences" autoCorrect={false} autoFocus />
        <View style={styles.time}>
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {timeLabel}
          </ThemedText>
          <DateTimeInput value={recordedAt} showTime showDate={false} onChange={onRecordedAtChange} />
        </View>
      </View>
    </ThemedModal>
  );
};

const styles = StyleSheet.create({
  content: {
    width: '100%',
    gap: 16,
  },
  time: {
    alignItems: 'center',
    gap: 2,
  },
});

export default EntryEditModal;
