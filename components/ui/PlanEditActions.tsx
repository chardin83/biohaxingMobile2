import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleProp, StyleSheet,TouchableOpacity, View, ViewStyle } from 'react-native';

import { IconSymbol } from './IconSymbol';
import PencilEditButton from './PencilEditButton';

type PlanEditActionsProps = {
  onEdit: () => void;
  editLabel: string;
  onNotifyToggle?: () => void;
  notifyActive?: boolean;
  notifyLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const PlanEditActions: React.FC<PlanEditActionsProps> = ({
  onEdit,
  editLabel,
  onNotifyToggle,
  notifyActive,
  notifyLabel,
  style,
}) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.planHeaderActions, style]}>
      <PencilEditButton
        onPress={onEdit}
        accessibilityLabel={editLabel}
        style={styles.button}
      />
      {onNotifyToggle && (
        <TouchableOpacity
          onPress={onNotifyToggle}
          accessibilityRole="button"
          accessibilityLabel={notifyLabel}
          style={styles.button}
        >
          <IconSymbol
            name={notifyActive ? 'bell.fill' : 'bell.slash'}
            size={16}
            color={notifyActive ? colors.primary : colors.icon}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  planHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: -12,
    marginRight: -4,
  },
  button: {
    padding: 6,
  },
});

export default PlanEditActions;