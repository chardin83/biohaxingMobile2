import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

import { AnalysisScanner } from './AnalysisScanner';

interface ImageAnalysisScannerProps {
  source: ImageSourcePropType;
  height?: number;
  active?: boolean;
}

export const ImageAnalysisScanner: React.FC<ImageAnalysisScannerProps> = ({ source, height = 300, active = true }) => {
  const { colors } = useTheme();
  return (
    <AnalysisScanner height={height} active={active}>
      <Image source={source} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.overlayLight }]} />
    </AnalysisScanner>
  );
};
