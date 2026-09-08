import { useTheme } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View, ViewProps } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  currentStep?: number;
  totalSteps?: number;
  footer?: React.ReactNode;
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
  currentStep,
  totalSteps,
  footer,
  ...rest
}, ref) => {
  const internalScrollRef = useRef<ScrollView>(null);
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();

  useImperativeHandle(ref, () => ({
    scrollToEnd: (options) => internalScrollRef.current?.scrollToEnd(options),
    scrollTo: (options) => internalScrollRef.current?.scrollTo(options),
  }));

  const { dark, colors } = useTheme();

  const showStepIndicator = showBackButton && !!currentStep && !!totalSteps;
  // Dynamic paddingTop based on backbutton
  let defaultPaddingTop = 40;
  if (showStepIndicator) {
    defaultPaddingTop = 130;
  } else if (showBackButton) {
    defaultPaddingTop = 100;
  }
  // Merge user contentContainerStyle with centerContent and default paddings
  const mergedContentContainerStyle = [
    { paddingHorizontal: 18, paddingBottom: 200, paddingTop: defaultPaddingTop },
    contentContainerStyle,
    centerContent ? styles.centerContent : null
  ];

  const content = (
    <>
      {showBackButton && (
  <View
    style={[
      styles.backButtonWrapper,
      showStepIndicator
        ? [
            styles.backButtonWrapperWithStep,
            { paddingTop: insets.top + 10 },
          ]
        : styles.backButtonWrapperPlain,
    ]}
    pointerEvents="box-none"
  >
    {showStepIndicator && (
      <>
        <View style={styles.headerSurface} />

        <LinearGradient
          pointerEvents="none"
          colors={[
            'rgba(11,16,33,0.98)',
            'rgba(11,16,33,0.68)',
            'rgba(11,16,33,0)',
          ]}
          locations={[0, 0.5, 1]}
          style={styles.headerFade}
        />
      </>
    )}

    <View style={styles.backButtonRow}>
      <BackButton
        onPress={onBackPress}
        style={styles.backButtonInline}
      />

      {showStepIndicator && (
        <Text style={[styles.stepText, { color: colors.text }]}>
          {t('onboarding.stepOf', {
            current: currentStep,
            total: totalSteps,
          })}
        </Text>
      )}
    </View>

    {showStepIndicator && (
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary,
              width: `${(currentStep! / totalSteps!) * 100}%`,
            },
          ]}
        />
      </View>
    )}
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
      {footer && (
        <View
          style={[
            styles.footerWrapper,
            { paddingBottom: insets.bottom + 16 },
          ]}
          pointerEvents="box-none"
        >
          <LinearGradient
            pointerEvents="none"
            colors={[
              'rgba(11,16,33,0)',
              'rgba(11,16,33,0.65)',
              'rgba(11,16,33,0.96)',
            ]}
            locations={[0, 0.55, 1]}
            style={styles.footerFade}
          />{footer && (
            <View
              style={[
                styles.footerWrapper,
                { paddingBottom: insets.bottom + 12 },
              ]}
            >
              <LinearGradient
                pointerEvents="none"
                colors={[
                  'rgba(11,16,33,0)',
                  'rgba(11,16,33,0.72)',
                  'rgba(11,16,33,0.98)',
                ]}
                locations={[0, 0.5, 1]}
                style={styles.footerFade}
              />

              {footer}
            </View>
          )}
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
        locations={gradientLocations as [number, number, ...number[]] | undefined}
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

  paddingHorizontal: 10,

  // viktigt eftersom fade:n går nedanför headern
  overflow: 'visible',
},

backButtonWrapperPlain: {
  top: 50,
},

backButtonWrapperWithStep: {
  top: 0,
  paddingBottom: 16,

  // Själva headerområdet är mörkt
  backgroundColor: 'rgba(11,16,33,0.98)',
},

headerSurface: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(11,16,33,0.98)',
},

headerFade: {
  position: 'absolute',
  left: 0,
  right: 0,

  // Börjar precis vid headerns nederkant
  bottom: -36,
  height: 36,
},

backButtonRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},

backButtonInline: {
  position: 'relative',
  top: 0,
  left: 0,
},

stepText: {
  fontSize: 14,
  fontWeight: '600',
  marginRight: 10,
},

progressTrack: {
  marginTop: 10,
  marginHorizontal: 10,
  height: 6,
  borderRadius: 3,
  overflow: 'hidden',
},

progressFill: {
  height: '100%',
  borderRadius: 3,
},
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,

    zIndex: 10,

    paddingHorizontal: 18,
    paddingTop: 14,

    backgroundColor: 'rgba(11,16,33,0.98)',
  },

  footerFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -48,
    height: 48,
  },
  footerDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,16,33,0.95)',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Container;
