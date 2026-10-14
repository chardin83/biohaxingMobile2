import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { useBottomSheetDesign } from '@/components/ui/BottomSheetDesign';
import DiscreetButton from '@/components/ui/DiscreetButton';
import Notice from '@/components/ui/Notice';

export default function HenryInfoNotice() {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sheet = useRef<BottomSheetModal>(null);
  const design = useBottomSheetDesign(colors);
  const backdrop = useCallback((props: React.ComponentProps<typeof BottomSheetBackdrop>) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />, []);
  return (
    <>
      <Notice message={t('nutritionGoals.personalDetailsNotice')}>
        <View style={styles.link}>
          <DiscreetButton title={t('nutritionGoals.henry.moreInfo')} color={colors.infoColor} rightIcon="chevron.right" onPress={() => sheet.current?.present()} />
        </View>
      </Notice>
      <BottomSheetModal ref={sheet} snapPoints={['80%']} enableDynamicSizing={false} backdropComponent={backdrop} {...design}>
        <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          <ThemedText type="title2">{t('nutritionGoals.henry.title')}</ThemedText>
          {(['rest', 'formula', 'activity', 'estimate'] as const).map(key => (
            <View key={key} style={styles.section}>
              <ThemedText type="title3">{t(`nutritionGoals.henry.${key}.title`)}</ThemedText>
              <ThemedText>{t(`nutritionGoals.henry.${key}.description`)}</ThemedText>
            </View>
          ))}
          <DiscreetButton title={t('nutritionGoals.henry.source')} rightIcon="chevron.right" onPress={() => Linking.openURL('https://pub.norden.org/nord2023-003/appendix.html')} accessibilityRole="link" />
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  link: { alignItems: 'flex-end', marginTop: 8 },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 20 },
  section: { gap: 8 },
});
