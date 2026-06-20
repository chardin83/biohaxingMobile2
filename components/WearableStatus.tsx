import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { syncWearableMetricsToStorage } from '@/wearables/syncMetricsToStorage';
import { AdapterStatus, SleepSummary } from '@/wearables/types';
import { createWearableAdapter } from '@/wearables/wearableAdapter';

interface WearableStatusProps {
  readonly status: AdapterStatus;
  readonly style?: any;
  readonly onSync?: (data: SleepSummary[]) => void;
}

export function WearableStatus({ status, style, onSync }: WearableStatusProps) {
  const { colors } = useTheme();
  const [localLastSync, setLocalLastSync] = useState<string | null>(null);
  const { upsertMetricEntries, healthSyncEnabled, setErrorMessage } = useStorage();
  let formattedLastSync: string | null = null;
  if (status.lastSyncAt) {
    formattedLastSync = new Date(status.lastSyncAt).toLocaleString();
  } else if (localLastSync) {
    formattedLastSync = new Date(localLastSync).toLocaleString();
  }

  useEffect(() => {
    let mounted = true;
    const adapter = createWearableAdapter();

    if (!adapter) {
      return;
    }

    (async () => {
      try {
        if (!healthSyncEnabled) {
          return;
        }

        await syncWearableMetricsToStorage(adapter, upsertMetricEntries, 90);
        if (!mounted) return;
        setLocalLastSync(new Date().toISOString());
        if (onSync) onSync([]); // optional: consumer callback — no payload by default
      } catch (e) {
        console.debug('[WearableStatus] HealthKit sync failed', e);
        if (setErrorMessage) setErrorMessage(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [healthSyncEnabled, upsertMetricEntries, setErrorMessage, onSync]);

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
