import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Supplement } from '@/app/domain/Supplement';
import { ThemedText } from '@/components/ThemedText';

import { SwipeableRow } from './ui/SwipeableRow';

interface SupplementItemProps {
  planName: string;
  supplement: Supplement;
  onRemoveSupplement: (planName: string, supplementTitle: string) => void;
  onEditSupplement?: (planName: string, supplementTitle: string) => void;
  badgeLabel?: string;
}

const SupplementItem: React.FC<SupplementItemProps> = ({
  planName,
  supplement,
  onRemoveSupplement,
  onEditSupplement,
  badgeLabel,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const includedSupplements = supplement.components ?? [];

  return (
    <View style={[styles.itemContainer, { borderColor: colors.textWeak }]}>
      <SwipeableRow
        onEdit={onEditSupplement ? () => onEditSupplement(planName, supplement.name) : undefined}
        onDelete={() => onRemoveSupplement(planName, supplement.name)}
        containerStyle={styles.swipeableContent}
      >
        <View style={styles.row}>
          <View style={styles.textColumn}>
            <View style={styles.textGroup}>
              <ThemedText type="default" style={[styles.text, { color: colors.text }]} numberOfLines={1}>
                {`${supplement.name} (${supplement.quantity} ${supplement.unit})`}
              </ThemedText>
              {badgeLabel ? (
                <View style={[styles.badge, { backgroundColor: colors.accentWeak }]}>
                  <ThemedText type="caption" style={[styles.badgeText, { color: colors.primary }]}>
                    {badgeLabel}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            {includedSupplements.length > 0 ? (
              <ThemedText
                type="caption"
                style={[styles.includedText, { color: colors.textLight }]}
                numberOfLines={1}
              >
                {`${includedSupplements.map(item => item.name).join(', ')}`}
              </ThemedText>
            ) : null}
          </View>
          <ThemedText type="default" style={[styles.icon, { color: colors.textLight}]}> 
            ⋮
          </ThemedText>
        </View>
      </SwipeableRow>
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  swipeableContent: {
    minHeight: 50,
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textGroup: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  textColumn: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  text: {
    flexShrink: 1,
    fontSize: 16,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
  },
  includedText: {
    flexShrink: 1,
  },
  icon: {
    fontSize: 18,
    opacity: 0.6,
    marginLeft: 12,
  },
});

export default SupplementItem;
