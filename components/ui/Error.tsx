import React from 'react';
import { StyleSheet,Text, View } from 'react-native';

import { Colors } from '@/app/theme/Colors';

export const Error = ({ error }: { error: string }) => (
  <View style={styles.bg}>
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Error: {error}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.dark.background },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.dark.error,
    fontSize: 16,
  },
});