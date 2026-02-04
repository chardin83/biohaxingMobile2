import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';

import { IconSymbol } from '@/components/ui/IconSymbol';

interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

const ACTION_WIDTH = 160;

interface RightActionsProps {
  drag: any;
  onEdit?: () => void;
  onDelete?: () => void;
}

const RightActions = ({ drag, onEdit, onDelete }: RightActionsProps) => {
  const { colors } = useTheme();
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + ACTION_WIDTH }],
  }));

  return (
    <Reanimated.View style={[styles.rightActionContainer, animatedStyle]}>
      {onEdit && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.secondaryBackground },
          ]}
          onPress={onEdit}
        >
          <IconSymbol name="pencil" color={colors.text} size={24} />
        </TouchableOpacity>
      )}
      {onDelete && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.delete },
          ]}
          onPress={onDelete}
        >
          <IconSymbol name="trash" color="white" size={24} />
        </TouchableOpacity>
      )}
    </Reanimated.View>
  );
};

export const SwipeableRow = ({ children, onEdit, onDelete, containerStyle }: SwipeableRowProps) => {
  const renderRightActions = (progress: any, drag: any) => {
    return <RightActions drag={drag} onEdit={onEdit} onDelete={onDelete} />;
  };

  return (
    <ReanimatedSwipeable
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <View style={[styles.rowContent, containerStyle]}>{children}</View>
    </ReanimatedSwipeable>
  );
};

const styles = StyleSheet.create({
  rowContent: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 64,
    justifyContent: 'center',
  },
  rightActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  actionButton: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: 10,
  },
});
