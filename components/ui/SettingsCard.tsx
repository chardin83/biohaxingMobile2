import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { StyleSheet,View } from 'react-native';

type Props = {
  children?: React.ReactNode;
  style?: any;
};

export const SettingsCard: React.FC<Props> = ({ children, style }: Props) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.cardContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
};

export default SettingsCard;

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
    overflow: 'hidden',
  },
});
