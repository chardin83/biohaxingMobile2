import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Portal } from 'react-native-paper';

import { ThemedText } from '@/components/ThemedText';
import { useBottomSheetDesign } from '@/components/ui/BottomSheetDesign';
import { SettingsCardLink } from '@/components/ui/SettingsCardLink';
import type { MetricId } from '@/locales/metrics';

import { MetricValuesBottomSheet } from './MetricValuesBottomSheet';

export type MetricSourceLink = {
  readonly metricId: MetricId;
  readonly label: string;
};

type Props = {
  readonly bottomSheetRef: React.RefObject<BottomSheet | null>;
  readonly title: string;
  readonly sources: readonly MetricSourceLink[];
};

export function MetricSourcesBottomSheet({ bottomSheetRef, title, sources }: Props) {
  const { colors } = useTheme();
  const design = useBottomSheetDesign(colors);
  const valuesRef = React.useRef<BottomSheet>(null);
  const [selectedSource, setSelectedSource] = React.useState<MetricSourceLink | null>(null);
  const pendingOpen = React.useRef(false);
  const snapPoints = React.useMemo(() => ['45%', '80%'], []);

  const handleClose = React.useCallback((index: number) => {
    if (index === -1 && pendingOpen.current) {
      pendingOpen.current = false;
      valuesRef.current?.snapToIndex(1);
    }
  }, []);

  return (
    <>
      <Portal>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          enablePanDownToClose
          backgroundStyle={design.backgroundStyle}
          handleComponent={design.handleComponent}
          onChange={handleClose}
        >
          <BottomSheetScrollView contentContainerStyle={styles.content}>
            <ThemedText type="title3">{title}</ThemedText>
            <SettingsCardLink
              showIcon={false}
              rows={sources.map(source => ({
                key: source.metricId,
                title: source.label,
                onPress: () => {
                  setSelectedSource(source);
                  pendingOpen.current = true;
                  bottomSheetRef.current?.close();
                },
              }))}
            />
          </BottomSheetScrollView>
        </BottomSheet>
      </Portal>
      <MetricValuesBottomSheet bottomSheetRef={valuesRef} metricId={selectedSource?.metricId ?? null} metricName={selectedSource?.label} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
});
