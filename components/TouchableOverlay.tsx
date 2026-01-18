import React from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, View } from 'react-native';

type TouchOverlayProps = {
  onTouch: (event: GestureResponderEvent) => void;
};

const TouchOverlay: React.FC<TouchOverlayProps> = ({ onTouch }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable onPressIn={onTouch} style={StyleSheet.absoluteFill} pointerEvents="auto" />
    </View>
  );
};

export default TouchOverlay;
