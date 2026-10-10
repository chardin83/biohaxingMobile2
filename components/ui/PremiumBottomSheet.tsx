import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomSheetDesign } from './BottomSheetDesign';
import PremiumOffer, { type PremiumPlan } from './PremiumOffer';

export type { PremiumPlan } from './PremiumOffer';
export type PremiumBottomSheetRef = { present: () => void; dismiss: () => void };
type Props = Readonly<{ onStartPremium?: (plan: PremiumPlan) => void }>;

const PremiumBottomSheet = forwardRef<PremiumBottomSheetRef, Props>(({ onStartPremium }, ref) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const modalRef = useRef<BottomSheetModal>(null);
  const sheetDesign = useBottomSheetDesign(colors);
  const dismiss = () => modalRef.current?.dismiss();
  useImperativeHandle(ref, () => ({ present: () => modalRef.current?.present(), dismiss: () => modalRef.current?.dismiss() }), []);
  const backdrop = useCallback((props: React.ComponentProps<typeof BottomSheetBackdrop>) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />, []);

  return <BottomSheetModal ref={modalRef} snapPoints={['85%', '95%']} enableDynamicSizing={false} enablePanDownToClose backdropComponent={backdrop} backgroundStyle={sheetDesign.backgroundStyle} handleComponent={sheetDesign.handleComponent}>
    <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <PremiumOffer onStartPremium={onStartPremium} onDismiss={dismiss} />
    </BottomSheetScrollView>
  </BottomSheetModal>;
});
PremiumBottomSheet.displayName = 'PremiumBottomSheet';
export default PremiumBottomSheet;

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 12 },
});
