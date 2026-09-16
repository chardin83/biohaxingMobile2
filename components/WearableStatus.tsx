import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useWearable } from '@/wearables/wearableProvider';

interface WearableStatusProps {
  readonly style?: ViewStyle;
}

export function WearableStatus({ style }: WearableStatusProps) {
  const { colors } = useTheme();
  const { status, isSyncing } = useWearable();
  const { t } = useTranslation();

  const formattedLastSync = status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : null;

  const getStatusColor = () => {
    switch (status.state) {
      case 'connected':
        return colors.surfaceGreenBorder;
      case 'disconnected':
        return colors.gold;
      case 'error':
        return colors.error;
      default:
        return colors.textMuted;
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
        {isSyncing ? (
          <Text style={[styles.statusText, { color: colors.primary }]}>↻ Synkar...</Text>
        ) : (
          <>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusIcon()} {t(`common:wearableStatus.${status.state}`)}
            </Text>
            {status.state === 'connected' && status.source && (
              <Text style={[styles.sourceText, { color: colors.textMuted }]}>
                {' • '}
                {status.source}
              </Text>
            )}
          </>
        )}
      </View>

      {formattedLastSync && (
        <Text style={[styles.syncText, { color: colors.textMuted }]}>
          {t('common:wearableStatus.lastSync')}: {formattedLastSync}
        </Text>
      )}

      {status.state === 'error' && status.message && <Text style={[styles.errorText, { color: colors.error }]}>{status.message}</Text>}
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
  errorText: {
    fontSize: 11,
    textAlign: 'center',
  },
});
