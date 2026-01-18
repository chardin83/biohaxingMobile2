// components/ui/AppBox.tsx
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { Colors } from '@/constants/Colors';

type Props = {
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPressHeader?: () => void;
  headerAccessibilityLabel?: string;
  leading?: React.ReactNode;
};

export default function AppBox({
  title,
  children,
  headerRight,
  style,
  onPressHeader,
  headerAccessibilityLabel,
  leading,
}: Readonly<Props>) {
  const renderHeader = () => {
    if (onPressHeader) {
      return (
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.headerMain, styles.headerMainInteractive]}
            onPress={onPressHeader}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={headerAccessibilityLabel}
          >
            {leading ? <View style={styles.leading}>{leading}</View> : null}
            <Text style={styles.boxTitle}>{title}</Text>
          </TouchableOpacity>
          {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
        </View>
      );
    }

    return (
      <View style={styles.headerRow}>
        <View style={styles.headerMain}>
          {leading ? <View style={styles.leading}>{leading}</View> : null}
          <Text style={styles.boxTitle}>{title}</Text>
        </View>
        {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
      </View>
    );
  };

  return (
    <View style={[styles.box, style]}>
      {renderHeader()}
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text style={styles.boxText}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 10,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  boxTitle: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  boxText: {
    color: Colors.dark.textLight,
    fontSize: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerMainInteractive: {
    paddingVertical: 2,
  },
  leading: {
    marginRight: 8,
  },
  headerRight: {
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
