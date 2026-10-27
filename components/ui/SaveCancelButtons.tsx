import React from 'react';
import { StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';

import { CancelButton } from './CancelButton';
import { SaveButton } from './SaveButton';

type SaveCancelButtonsProps = {
  onCancel: () => void;
  onSave?: () => void;
  showCancelButton?: boolean;
  saveGlow?: boolean;
  saveDisabled?: boolean;
  saveTitle?: string;
  layout?: 'row' | 'column';
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SaveCancelButtons({ onCancel, onSave, saveTitle, layout = 'row', showCancelButton = true, saveGlow = false, saveDisabled = false, busy = false, style }: Readonly<SaveCancelButtonsProps>) {
  const { fontScale, width } = useWindowDimensions();
  const stacked = layout === 'column' || fontScale >= 1.4 || width < 360;

  const cancelButton = showCancelButton && <CancelButton onPress={onCancel} disabled={busy} style={stacked ? styles.stackedButton : styles.button} />;
  const saveButton = onSave && <SaveButton title={saveTitle} onPress={onSave} disabled={saveDisabled} busy={busy} glow={saveGlow} style={stacked ? styles.stackedButton : styles.button} />;

  if (!onSave && !showCancelButton) return null;

  return (
    <View style={[styles.row, stacked && styles.stackedRow, style]}>
      {stacked ? saveButton : cancelButton}
      {stacked ? cancelButton : saveButton}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  stackedRow: { flexDirection: 'column', alignItems: 'stretch' },
  stackedButton: { width: '100%' },
  button: {
    flex: 1,
  },
});
