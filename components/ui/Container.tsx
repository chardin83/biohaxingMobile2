import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/Colors';

const Container: React.FC<ViewProps & { style?: any }> = ({ children, style, ...rest }) => (
  <ScrollView style={[styles.container, style]} {...rest}>
    {children}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    paddingTop: 100,
  },
});

export default Container;
