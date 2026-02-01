// components/ui/AppBox.tsx
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';

type Props = {
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  onPressHeader?: () => void;
  headerAccessibilityLabel?: string;
  leading?: React.ReactNode;
};

export default function AppBox({
  title,
  children,
  headerRight,
  onPressHeader,
  headerAccessibilityLabel,
  leading,
}: Readonly<Props>) {
  const { colors } = useTheme();

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
            <ThemedText type="title3" style={[styles.boxTitle, { color: colors.primary }]}>
              {title}
            </ThemedText>
          </TouchableOpacity>
          {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
        </View>
      );
    }

    return (
      <View style={styles.headerRow}>
        <View style={styles.headerMain}>
          {leading ? <View style={styles.leading}>{leading}</View> : null}
          <ThemedText type="title3" style={[styles.boxTitle, { color: colors.primary }]}>
            {title}
          </ThemedText>
        </View>
        {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
      </View>
    );
  };

  return (
    <Card transparent={true}>
      {renderHeader()}
      {typeof children === 'string' || typeof children === 'number' ? (
        <ThemedText type="default" style={[styles.boxText, { color: colors.textLight }]}>
          {children}
        </ThemedText>
      ) : (
        children
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  boxTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  boxText: {
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
