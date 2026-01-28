import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import BackButton from '@/components/BackButton';
import { Colors } from '@/constants/Colors';

type GradientKey = keyof typeof Colors.dark.gradients;
type ContainerProps = ViewProps & {
  style?: any;
  background?: 'gradient' | 'default';
  gradientKey?: GradientKey;
  gradientLocations?: number[];
  showBackButton?: boolean;
  onBackPress?: () => void;
  centerContent?: boolean;
};

const Container: React.FC<ContainerProps> = ({ children, style, background = 'default', gradientKey = 'sunrise', gradientLocations, showBackButton = false, onBackPress, centerContent = false, contentContainerStyle, ...rest }) => {
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
      <ScrollView
        style={style}
        contentContainerStyle={mergedContentContainerStyle}
        {...rest}
      >
        {children}
      </ScrollView>
    </>
  );
  if (background === 'gradient') {
    const gradient = Colors.dark.gradients[gradientKey] || Colors.dark.gradients.sunrise;
    return (
      <LinearGradient
        colors={gradient.colors as any}
        locations={gradientLocations as [number, number, ...number[]] || gradient.locations}
        start={gradient.start}
        end={gradient.end}
        style={{ flex: 1 }}
      >
        {content}
      </LinearGradient>
    );
  }
  return <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>{content}</View>;
};

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
