import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, ViewStyle } from 'react-native';

import AppButton from './AppButton';

type DeleteButtonProps = {
  onPress: () => void;
  title?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function DeleteButton({ onPress, title, disabled = false, style }: Readonly<DeleteButtonProps>) {
  const { t } = useTranslation();
  return <AppButton title={title ?? t('general.delete')} onPress={onPress} variant="danger" disabled={disabled} style={style} />;
}
