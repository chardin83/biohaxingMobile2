import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Supplement } from '@/app/domain/Supplement';
import { ThemedText } from '@/components/ThemedText';

import { SwipeableRow } from './ui/SwipeableRow';

interface RenderSupplementItemProps {
  planName: string;
  supplement: Supplement;
  onRemoveSupplement: (planName: string, supplementTitle: string) => void;
  onEditSupplement: (planName: string, supplementTitle: string) => void;
}

const SupplementItem: React.FC<RenderSupplementItemProps> = ({
  planName,
  supplement,
  onRemoveSupplement,
  onEditSupplement,
}) => {
  const { colors } = useTheme();

  return (
    <SwipeableRow
      onEdit={() => onEditSupplement(planName, supplement.name)}
      onDelete={() => onRemoveSupplement(planName, supplement.name)}
      containerStyle={styles.swipeableContent}
    >
      <View style={styles.row}>
        <ThemedText type="default" style={[styles.text, { color: colors.text }]}>
          {`${supplement.name} (${supplement.quantity} ${supplement.unit})`}
        </ThemedText>
        <ThemedText type="default" style={[styles.icon, { color: colors.textLight || '#888' }]}>
          ⋮
        </ThemedText>
      </View>
    </SwipeableRow>
  );
};

const styles = StyleSheet.create({
  swipeableContent: {
    height: 50,
    justifyContent: 'center',
    width: '100%',
    borderRadius: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
  },
  icon: {
    fontSize: 18,
    opacity: 0.6,
    marginLeft: 12,
  },
});

export default SupplementItem;
