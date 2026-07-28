import { BottomSheetHandle } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

type BottomSheetColors = {
  background: string;
  textMuted?: string;
  borderLight?: string;
};

export function useBottomSheetDesign(colors: BottomSheetColors) {
  const borderColor = colors.borderLight ?? 'rgba(0, 0, 0, 0.12)';
  const indicatorColor = colors.textMuted ?? colors.borderLight ?? '#a8a8a8';

  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    }),
    [colors.background]
  );

  const handleComponent = useCallback((props: React.ComponentProps<typeof BottomSheetHandle>) => {
    return (
      <BottomSheetHandle
        {...props}
        style={[
          props.style,
          styles.handle,
          {
            backgroundColor: colors.background,
            borderTopColor: borderColor,
          },
        ]}
        indicatorStyle={[props.indicatorStyle, styles.handleIndicator, { backgroundColor: indicatorColor }]}
      >
        <View pointerEvents="none" style={[styles.handleNotch, { backgroundColor: colors.background, borderColor }]} />
      </BottomSheetHandle>
    );
  }, [borderColor, colors.background, indicatorColor]);

  return {
    backgroundStyle,
    handleComponent,
  };
}

const styles = StyleSheet.create({
  handle: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    height: 22,
  },
  handleNotch: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    width: 72,
    height: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  handleIndicator: {
    width: 34,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
});