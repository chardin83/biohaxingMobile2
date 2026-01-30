import React from 'react';
import { ActivityIndicator, StyleSheet,Text, View } from 'react-native';

import { Colors } from '@/app/theme/Colors';

export const Loading = () => (
  <View style={styles.bg}>
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.dark.accentDefault} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.dark.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
    marginTop: 12,
  },
});