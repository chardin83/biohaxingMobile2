
import React from 'react';
import { StyleProp,TextStyle, View, ViewStyle } from 'react-native';

import PlanEditActions from '@/components/ui/PlanEditActions';

interface PlanHeaderActionsProps {
  trainingSettingsKey: string;
  tipTitle: string | null;
  t: (key: string, options?: any) => string;
  openTrainingSettingsModal: (key: string, title?: string | null) => void;
  styles: {
    headerActionsContainer: StyleProp<ViewStyle>;
    chartButton: StyleProp<ViewStyle>;
    chartEmoji: StyleProp<TextStyle>;
    chartEmojiDisabled: StyleProp<TextStyle>;
    planHeaderActions: StyleProp<ViewStyle>;
  };
}

export const PlanHeaderActions: React.FC<PlanHeaderActionsProps> = ({
  trainingSettingsKey,
  tipTitle,
  t,
  openTrainingSettingsModal,
  styles,
}) => {

  return (
    <View style={styles.headerActionsContainer}>
      <PlanEditActions
        onEdit={() => openTrainingSettingsModal(trainingSettingsKey, tipTitle)}
        editLabel={t('plan.editTrainingTargets')}
        style={styles.planHeaderActions}
      />
    </View>
  );
};
