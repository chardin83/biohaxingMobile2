import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { useBottomSheetDesign } from './ui/BottomSheetDesign';
import VerdictSelector from './VerdictSelector';

export type VerdictBottomSheetProps = {
  verdictSheetRef: React.RefObject<BottomSheet | null>;
  snapPoints?: string[];
  colors: any;
  currentVerdict?: any;
  onVerdictPress: (v: any) => void;
};

const VerdictBottomSheet: React.FC<VerdictBottomSheetProps> = ({
  verdictSheetRef,
  snapPoints = ['35%', '60%'],
  colors,
  currentVerdict,
  onVerdictPress,
}) => {
  const sheetDesign = useBottomSheetDesign(colors);

  useEffect(() => {
    console.log('VerdictBottomSheet mounted, ref=', !!verdictSheetRef?.current, 'snapPoints=', snapPoints);
  }, [verdictSheetRef, snapPoints]);

  const handleVerdictPress = (v: any) => {
    try {
      onVerdictPress(v);
    } finally {
      try {
        verdictSheetRef.current?.collapse();
      } catch (err) {
        console.warn('Failed to collapse sheet', err);
      }
    }
  };

  return (
    <BottomSheet
      ref={verdictSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableHandlePanningGesture
      enableContentPanningGesture
      handleComponent={sheetDesign.handleComponent}
      backgroundStyle={sheetDesign.backgroundStyle}
      animateOnMount
      index={-1}
      onChange={(index) => console.log('VerdictBottomSheet onChange', index)}
    >
      <BottomSheetView style={styles.content}>
        <VerdictSelector
          currentVerdict={currentVerdict}
          onVerdictPress={handleVerdictPress}
        />
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});

export default VerdictBottomSheet;
