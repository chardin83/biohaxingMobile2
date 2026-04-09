import { useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { Colors } from '@/app/theme/Colors';
import { globalStyles } from '@/app/theme/globalStyles';
import BackButton from '@/components/BackButton';

type GradientKey = keyof typeof Colors.dark.gradients;
type ContainerProps = ViewProps & {
  style?: any;
  background?: 'gradient' | 'default';
  gradientKey?: GradientKey;
  gradientLocations?: number[];
  showBackButton?: boolean;
  onBackPress?: () => void;
  centerContent?: boolean;
  contentContainerStyle?: any;
  scrollable?: boolean;
};

export type ContainerScrollRef = {
  scrollToEnd(options?: { animated?: boolean }): void;
  scrollTo(options: { x?: number; y?: number; animated?: boolean }): void;
};

const Container = forwardRef<ContainerScrollRef, ContainerProps>(({
  children,
  style,
  background = 'default',
  gradientKey = 'sunrise',
  gradientLocations,
  showBackButton = false,
  onBackPress,
  centerContent = false,
  contentContainerStyle,
  scrollable = true,
  ...rest
}, ref) => {
  const internalScrollRef = useRef<ScrollView>(null);

  useImperativeHandle(ref, () => ({
    scrollToEnd: (options) => internalScrollRef.current?.scrollToEnd(options),
    scrollTo: (options) => internalScrollRef.current?.scrollTo(options),
  }));

  const { dark, colors } = useTheme();

  // Dynamic paddingTop based on backbutton
  const defaultPaddingTop = showBackButton ? 100 : 35;
  // Merge user contentContainerStyle with centerContent and default paddings
  const mergedContentContainerStyle = [
    { paddingHorizontal: 18, paddingBottom: 100, paddingTop: defaultPaddingTop },
    contentContainerStyle,
    centerContent ? styles.centerContent : null
  ];

  const content = (
    <>
      {showBackButton && (
        <View style={styles.backButtonWrapper}>
          <BackButton onPress={onBackPress} />
        </View>
      )}
      {scrollable ? (
        <ScrollView
          ref={internalScrollRef}
          style={style}
          contentContainerStyle={mergedContentContainerStyle}
          {...rest}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[style, ...mergedContentContainerStyle]} {...rest}>
          {children}
        </View>
      )}
    </>
  );

  // Use theme-aware gradients and background
  const themeGradients = dark ? Colors.dark.gradients : Colors.light.gradients;
  const themeBackground = colors.background;

  if (background === 'gradient') {
    const gradient = themeGradients[gradientKey] || themeGradients.sunrise;
    return (
      <LinearGradient
        colors={gradient.colors as any}
        locations={gradientLocations as [number, number, ...number[]] | undefined }
        start={gradient.start}
        end={gradient.end}
        style={globalStyles.flex1}
      >
        {content}
      </LinearGradient>
    );
  }
  return <View style={[globalStyles.flex1, { backgroundColor: themeBackground }]}>{content}</View>;
});

const styles = StyleSheet.create({
  backButtonWrapper: {
    zIndex: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Container;
