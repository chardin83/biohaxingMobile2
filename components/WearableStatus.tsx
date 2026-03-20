import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdapterStatus } from '@/wearables/types';

interface WearableStatusProps {
  readonly status: AdapterStatus;
  readonly style?: any;
}

export function WearableStatus({ status, style }: WearableStatusProps) {
  const { colors } = useTheme();
  const formattedLastSync = status.lastSyncAt
    ? new Date(status.lastSyncAt).toLocaleString()
    : null;

  const getStatusColor = () => {
    switch (status.state) {
      case 'connected':
        return colors.surfaceGreenBorder || 'rgba(100,255,150,0.9)';
      case 'disconnected':
        return colors.gold;
      case 'error':
        return colors.error || 'rgba(255,100,100,0.9)';
      default:
        return colors.textMuted || 'rgba(255,255,255,0.5)';
    }
  };

  const getStatusIcon = () => {
    switch (status.state) {
      case 'connected':
        return '✓';
      case 'disconnected':
        return '○';
      case 'error':
        return '✗';
      default:
        return '•';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.statusRow}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}> 
          {getStatusIcon()} {status.state}
        </Text>
        {status.state === 'connected' && status.source && (
          <Text style={[styles.sourceText, { color: colors.textMuted }]}> • {status.source}</Text>
        )}
      </View>
      {formattedLastSync && (
        <Text style={[styles.syncText, { color: colors.textMuted }]}>Last sync: {formattedLastSync}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    gap: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sourceText: {
    fontSize: 12,
  },
  syncText: {
    fontSize: 11,
  },
});
