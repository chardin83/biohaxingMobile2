import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';

import { useBottomSheetDesign } from './ui/BottomSheetDesign';
import VerdictSelector from './VerdictSelector';

export type VerdictBottomSheetProps = {
  verdictSheetRef: React.RefObject<BottomSheetModal | null>;
  snapPoints?: string[];
  colors: any;
  currentVerdict?: any;
  onVerdictPress: (v: any) => void;
  onDismiss?: () => void;
};

const VerdictBottomSheet: React.FC<VerdictBottomSheetProps> = ({
  verdictSheetRef,
  snapPoints = ['85%'],
  colors,
  currentVerdict,
  onVerdictPress,
  onDismiss,
}) => {
  const sheetDesign = useBottomSheetDesign(colors);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  const handleVerdictPress = (v: any) => {
    try {
      onVerdictPress(v);
    } finally {
      try {
        verdictSheetRef.current?.dismiss();
      } catch (err) {
        console.warn('Failed to dismiss sheet', err);
      }
    }
  };

  return (
    <BottomSheetModal
      ref={verdictSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableHandlePanningGesture
      enableContentPanningGesture
      handleComponent={sheetDesign.handleComponent}
      backgroundStyle={sheetDesign.backgroundStyle}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      onDismiss={onDismiss}
    >
      <BottomSheetView style={styles.content}>
        <VerdictSelector currentVerdict={currentVerdict} onVerdictPress={handleVerdictPress} />
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});

export default VerdictBottomSheet;
