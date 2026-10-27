import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { CancelButton } from './CancelButton';
import { DeleteButton } from './DeleteButton';
import { SaveButton } from './SaveButton';

type SaveDeleteCancelButtonsProps = {
  onSave: () => void;
  onDelete?: () => void;
  onCancel: () => void;
  saveTitle?: string;
  deleteTitle?: string;
  saveDisabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SaveDeleteCancelButtons({ onSave, onDelete, onCancel, saveTitle, deleteTitle, saveDisabled = false, busy = false, style }: Readonly<SaveDeleteCancelButtonsProps>) {
  return (
    <View style={[styles.column, style]}>
      <SaveButton onPress={onSave} title={saveTitle} disabled={saveDisabled} busy={busy} style={styles.button} />
      {onDelete && <DeleteButton onPress={onDelete} title={deleteTitle} disabled={busy} style={styles.button} />}
      <CancelButton onPress={onCancel} disabled={busy} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', gap: 12, marginTop: 8, marginBottom: 12 },
  button: { width: '100%' },
});
