import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { useBottomSheetDesign } from '@/components/ui/BottomSheetDesign';
import { IconSymbol } from '@/components/ui/IconSymbol';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  snapPoints: string[];
  onArchivePlan: () => void;
  onDeletePlan: () => void;
  onCancel: () => void;
};

export const PlanActionsBottomSheet: React.FC<Props> = ({
  bottomSheetRef,
  snapPoints,
  onArchivePlan,
  onDeletePlan,
  onCancel,
}) => {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const sheetDesign = useBottomSheetDesign(colors);

  const handleDeletePress = React.useCallback(() => {
    Alert.alert(
      t('plan.planActionsDeleteConfirmTitle'),
      t('plan.planActionsDeleteConfirmMessage'),
      [
        {
          text: t('general.cancel'),
          style: 'cancel',
        },
        {
          text: t('plan.planActionsDeleteConfirmAction'),
          style: 'destructive',
          onPress: onDeletePlan,
        },
      ]
    );
  }, [onDeletePlan, t]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={sheetDesign.backgroundStyle}
      handleComponent={sheetDesign.handleComponent}
      animateOnMount={false}
    >
      <BottomSheetView style={[styles.planActionsSheetContent, { backgroundColor: colors.background }]}> 
        <View style={[styles.topIconCircle, { borderColor: colors.primary }]}> 
          <IconSymbol name="trash" size={22} color={colors.primary} />
        </View>

        <View style={styles.topTextWrap}>
          <ThemedText type="title3" style={styles.topTitle}>
            {t('plan.planActionsPromptTitle')}
          </ThemedText>
          <ThemedText type="default" style={styles.topDescription}>
            {t('plan.planActionsPromptDescription')}
          </ThemedText>
        </View>

        <TouchableOpacity
          style={[styles.planActionRow, { borderColor: colors.primary, backgroundColor: colors.cardBackground }]}
          onPress={onArchivePlan}
          accessibilityRole="button"
          accessibilityLabel={t('plan.planActionsArchiveTitle')}
        >
          <IconSymbol name="archive" size={20} color={colors.icon} />
          <View style={styles.planActionTextWrap}>
            <ThemedText type="defaultSemiBold" style={{ color: colors.primary }}>{t('plan.planActionsArchiveTitle')}</ThemedText>
            <View style={styles.subtitleRow}>
              <ThemedText type="caption" style={styles.planActionSubtitle}>
                {t('plan.planActionsArchiveDescription')}
              </ThemedText>
              <IconSymbol name="chevron.right" size={16} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planActionRow, styles.planActionDanger, { borderColor: colors.error, backgroundColor: colors.cardBackground }]}
          onPress={handleDeletePress}
          accessibilityRole="button"
          accessibilityLabel={t('plan.planActionsDeleteTitle')}
        >
          <IconSymbol name="trash" size={20} color={colors.error} />
          <View style={styles.planActionTextWrap}>
            <ThemedText type="defaultSemiBold" style={{ color: colors.error }}>{t('plan.planActionsDeleteTitle')}</ThemedText>
            <View style={styles.subtitleRow}>
              <ThemedText type="caption" style={styles.planActionSubtitle}> 
                {t('plan.planActionsDeleteDescription')}
              </ThemedText>
              <IconSymbol name="chevron.right" size={16} color={colors.error} />
            </View>
          </View>
        </TouchableOpacity>

        <AppButton title={t('general.cancel')} variant="secondary" onPress={onCancel} style={styles.cancelActionButton} />
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  planActionsSheetContent: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  topIconCircle: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  topTextWrap: {
    alignItems: 'center',
    marginBottom: 2,
  },
  topTitle: {
    textAlign: 'center',
  },
  topDescription: {
    textAlign: 'center',
    opacity: 0.82,
    lineHeight: 20,
    marginTop: 2,
  },
  planActionRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  planActionTextWrap: {
    flex: 1,
    gap: 2,
  },
  planActionSubtitle: {
    flex: 1,
    opacity: 0.8,
    lineHeight: 18,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planActionDanger: {
    borderWidth: 1.5,
  },
  cancelActionButton: {
    marginTop: 4,
  },
});

export default PlanActionsBottomSheet;