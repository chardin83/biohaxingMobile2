import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, ViewStyle } from 'react-native';

import AppButton from './AppButton';

type SaveButtonProps = {
  onPress: () => void;
  title?: string;
  disabled?: boolean;
  busy?: boolean;
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function SaveButton({ onPress, title, disabled = false, busy = false, glow = false, style, accessibilityHint }: Readonly<SaveButtonProps>) {
  const { t } = useTranslation();

  return <AppButton title={title ?? t('general.save')} onPress={onPress} disabled={disabled || busy} busy={busy} glow={glow} style={style} accessibilityHint={accessibilityHint} />;
}
