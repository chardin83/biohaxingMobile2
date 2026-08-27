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
  supplementName?: string;
  onArchiveSupplement: () => void;
  onDeleteSupplement: () => void;
  onCancel: () => void;
};

export const SupplementActionsBottomSheet: React.FC<Props> = ({
  bottomSheetRef,
  snapPoints,
  supplementName,
  onArchiveSupplement,
  onDeleteSupplement,
  onCancel,
}) => {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const sheetDesign = useBottomSheetDesign(colors);

  const handleDeletePress = React.useCallback(() => {
    Alert.alert(
      t('plan.supplementActionsDeleteConfirmTitle'),
      t('plan.supplementActionsDeleteConfirmMessage', {
        name: supplementName,
      }),
      [
        {
          text: t('general.cancel'),
          style: 'cancel',
        },
        {
          text: t('plan.supplementActionsDeleteConfirmAction'),
          style: 'destructive',
          onPress: onDeleteSupplement,
        },
      ]
    );
  }, [onDeleteSupplement, supplementName, t]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      index={1}
      backgroundStyle={sheetDesign.backgroundStyle}
      handleComponent={sheetDesign.handleComponent}
      onChange={(index) => {
        if (index === -1) {
          onCancel();
        }
      }}
    >
      <BottomSheetView
        style={[
          styles.supplementActionsSheetContent,
          { backgroundColor: colors.background },
        ]}
      >
        <View
          style={[
            styles.topIconCircle,
            { borderColor: colors.primary },
          ]}
        >
          <IconSymbol
            name="pill"
            size={22}
            color={colors.primary}
          />
        </View>

        <View style={styles.topTextWrap}>
          <ThemedText type="title3" style={styles.topTitle}>
            {t('plan.supplementActionsPromptTitle')}
          </ThemedText>

          <ThemedText type="default" style={styles.topDescription}>
            {supplementName
              ? t('plan.supplementActionsPromptDescriptionWithName', {
                  name: supplementName,
                })
              : t('plan.supplementActionsPromptDescription')}
          </ThemedText>
        </View>

        <TouchableOpacity
          style={[
            styles.supplementActionRow,
            {
              borderColor: colors.primary,
              backgroundColor: colors.cardBackground,
            },
          ]}
          onPress={onArchiveSupplement}
          accessibilityRole="button"
          accessibilityLabel={t('plan.supplementActionsArchiveTitle')}
        >
          <IconSymbol name="archive" size={20} color={colors.icon} />

          <View style={styles.supplementActionTextWrap}>
            <ThemedText
              type="defaultSemiBold"
              style={{ color: colors.primary }}
            >
              {t('plan.supplementActionsArchiveTitle')}
            </ThemedText>

            <View style={styles.subtitleRow}>
              <ThemedText
                type="caption"
                style={styles.supplementActionSubtitle}
              >
                {t('plan.supplementActionsArchiveDescription')}
              </ThemedText>

              <IconSymbol
                name="chevron.right"
                size={16}
                color={colors.primary}
              />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.supplementActionRow,
            styles.supplementActionDanger,
            {
              borderColor: colors.error,
              backgroundColor: colors.cardBackground,
            },
          ]}
          onPress={handleDeletePress}
          accessibilityRole="button"
          accessibilityLabel={t('plan.supplementActionsDeleteTitle')}
        >
          <IconSymbol name="trash" size={20} color={colors.error} />

          <View style={styles.supplementActionTextWrap}>
            <ThemedText
              type="defaultSemiBold"
              style={{ color: colors.error }}
            >
              {t('plan.supplementActionsDeleteTitle')}
            </ThemedText>

            <View style={styles.subtitleRow}>
              <ThemedText
                type="caption"
                style={styles.supplementActionSubtitle}
              >
                {t('plan.supplementActionsDeleteDescription')}
              </ThemedText>

              <IconSymbol
                name="chevron.right"
                size={16}
                color={colors.error}
              />
            </View>
          </View>
        </TouchableOpacity>

        <AppButton
          title={t('general.cancel')}
          variant="secondary"
          onPress={onCancel}
          style={styles.cancelActionButton}
        />
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  supplementActionsSheetContent: {
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

  supplementActionRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  supplementActionTextWrap: {
    flex: 1,
    gap: 2,
  },

  supplementActionSubtitle: {
    flex: 1,
    opacity: 0.8,
    lineHeight: 18,
  },

  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  supplementActionDanger: {
    borderWidth: 1.5,
  },

  cancelActionButton: {
    marginTop: 4,
  },
});

export default SupplementActionsBottomSheet;