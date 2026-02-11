import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleProp, TextStyle, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

type ShowAllButtonProps = {
  showAll: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accentColor: string;
  showAllText?: string;
  showLessText?: string;
};

export default function ShowAllButton({
  showAll,
  onPress,
  style,
  textStyle,
  accentColor,
  showAllText,
  showLessText,
}: ShowAllButtonProps) {
  const { t } = useTranslation();
  const showAllLabel = showAllText ?? t('general.showAll');
  const showLessLabel = showLessText ?? t('general.showLess');
  return (
    <Pressable onPress={onPress} style={style}>
      <ThemedText type="caption" style={[textStyle, { color: accentColor }]}>
        {showAll ? showLessLabel : showAllLabel}
      </ThemedText>
    </Pressable>
  );
}