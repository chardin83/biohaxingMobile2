import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput,TouchableOpacity, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { RegisterMetricModal } from '@/components/RegisterMetricModal';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { metrics, tipMetricLinks } from '@/locales/metrics';

type MetricsBottomSheetProps = {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  tipId: string | null;
  planTipId?: string;
};

export const MetricsBottomSheet: React.FC<MetricsBottomSheetProps> = ({ bottomSheetRef, tipId, planTipId }) => {
  const { t } = useTranslation(['metrics']);
  const { colors } = useTheme();
  const { addMetricEntry, getMetricsForPlanTip } = useStorage();
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null); // For detail view
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [modalMetricId, setModalMetricId] = useState<string | null>(null); // For modal
  const [metricValue, setMetricValue] = useState('');
  const [metricUnit, setMetricUnit] = useState('');
  const [metricNotes, setMetricNotes] = useState('');

  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  const handleOpenAddModal = (metricId: string) => {
    setModalMetricId(metricId);
    const metric = metrics[metricId];
    if (metric && metric.units.length > 0) {
      setMetricUnit(metric.units[0].unit);
    } else {
      setMetricUnit('');
    }
    setAddModalVisible(true);
  };

  const handleSaveMetric = () => {
    if (!modalMetricId || !metricValue) return;

    const value = parseFloat(metricValue);
    if (isNaN(value)) return;

    console.log('Sparar metricEntry', { metricId: modalMetricId, value, unit: metricUnit, planTipId });

    addMetricEntry({
      metricId: modalMetricId,
      value,
      unit: metricUnit,
      recordedAt: new Date().toISOString(),
      notes: metricNotes || undefined,
      planTipId,
    });

    setAddModalVisible(false);
    setMetricValue('');
    setMetricNotes('');
    setModalMetricId(null);
  };

  const handleCloseAddModal = () => {
    setAddModalVisible(false);
    setMetricValue('');
    setMetricNotes('');
    setModalMetricId(null);
  };

  React.useEffect(() => {
    console.log('[MetricsBottomSheet] tipId changed:', tipId);
  }, [tipId]);

  if (!tipId) {
    console.log('[MetricsBottomSheet] tipId is null, returning null');
    return null;
  }

  const metricLinks = tipMetricLinks[tipId];
  console.log('[MetricsBottomSheet] metricLinks:', metricLinks);
  if (!metricLinks || metricLinks.length === 0) {
    console.log('[MetricsBottomSheet] no metric links, returning null');
    return null;
  }

  let detailView = null;
  if (selectedMetricId) {
    const metric = metrics[selectedMetricId];
    if (!metric) {
      setSelectedMetricId(null);
    } else {
      // Hämta redan registrerade värden för denna metric kopplat till denna planTipId
      const registeredEntries = planTipId ? getMetricsForPlanTip(planTipId).filter(e => e.metricId === selectedMetricId) : [];
      console.log('registeredEntries', registeredEntries, 'planTipId', planTipId, 'selectedMetricId', selectedMetricId);
      detailView = (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          enablePanDownToClose
          backgroundStyle={{ backgroundColor: colors.background }}
          animateOnMount
          index={-1}
        >
          <BottomSheetView style={[styles.contentContainer, { backgroundColor: colors.background }]}> 
            <View style={styles.headerWithBack}>
              <TouchableOpacity
                onPress={() => setSelectedMetricId(null)}
                style={styles.backButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <IconSymbol name="chevron.left" size={24} color={colors.text} />
              </TouchableOpacity>
              <ThemedText type="title3" style={styles.title}>
                {t(`metrics:${selectedMetricId}.name`)}
              </ThemedText>
            </View>

            <ThemedText type="default" style={styles.description}>
              {t(`metrics:${selectedMetricId}.description`)}
            </ThemedText>

            <AppButton
              onPress={() => handleOpenAddModal(selectedMetricId)}
              style={styles.addButton}
              title="+ Registrera nytt värde"
            />

            {/* Tabell över redan registrerade värden */}
            {registeredEntries.length > 0 && (
              <View style={{ marginVertical: 12 }}>
                <ThemedText type="defaultSemiBold" style={{ marginBottom: 4 }}>
                  Registrerade värden
                </ThemedText>
                <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' }}>
                  <View style={{ flexDirection: 'row', backgroundColor: colors.cardBackground }}>
                    <ThemedText style={{ flex: 1, padding: 8 }} type="caption">Datum</ThemedText>
                    <ThemedText style={{ flex: 1, padding: 8 }} type="caption">Värde</ThemedText>
                    <ThemedText style={{ flex: 1, padding: 8 }} type="caption">Enhet</ThemedText>
                    <ThemedText style={{ flex: 2, padding: 8 }} type="caption">Notering</ThemedText>
                  </View>
                  {registeredEntries.map((entry, i) => (
                    <View key={i} style={{ flexDirection: 'row', backgroundColor: i % 2 === 0 ? colors.background : colors.cardBackground }}>
                      <ThemedText style={{ flex: 1, padding: 8 }} type="caption">{entry.recordedAt.slice(0, 10)}</ThemedText>
                      <ThemedText style={{ flex: 1, padding: 8 }} type="caption">{entry.value}</ThemedText>
                      <ThemedText style={{ flex: 1, padding: 8 }} type="caption">{entry.unit}</ThemedText>
                      <ThemedText style={{ flex: 2, padding: 8 }} type="caption">{entry.notes || ''}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <ThemedText type="defaultSemiBold" style={styles.unitsTitle}>
              Enheter
            </ThemedText>
            <View style={styles.metricsContainer}>
              {metric.units.map((unit, index) => (
                <View key={index} style={[styles.unitItem, { backgroundColor: colors.cardBackground }]}> 
                  <View style={styles.unitRow}>
                    <ThemedText type="defaultSemiBold">
                      {unit.unit}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>
                      {unit.system}
                    </ThemedText>
                  </View>
                  {unit.precision !== undefined && (
                    <ThemedText type="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
                      Precision: {unit.precision} decimaler
                    </ThemedText>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  Källa
                </ThemedText>
                <ThemedText type="defaultSemiBold" style={{ marginTop: 4 }}>
                  {metric.source}
                </ThemedText>
              </View>
              {metric.suggestedFrequency && (
                <View style={styles.metaItem}>
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>
                    Rekommenderad frekvens
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={{ marginTop: 4 }}>
                    {metric.suggestedFrequency}
                  </ThemedText>
                </View>
              )}
            </View>
          </BottomSheetView>
        </BottomSheet>
      );
    }
  }

  return (
    <>
      {selectedMetricId ? detailView : (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          enablePanDownToClose
          backgroundStyle={{ backgroundColor: colors.background }}
          animateOnMount
          index={-1}
        >
          <BottomSheetView style={[styles.contentContainer, { backgroundColor: colors.background }]}> 
            <ThemedText type="title3" style={styles.title}>
              Intressanta mätvärden
            </ThemedText>
            <View style={styles.metricsContainer}>
              {metricLinks.map(link => {
                const metric = metrics[link.metricId];
                if (!metric) return null;
                return (
                  <TouchableOpacity
                    key={link.metricId}
                    onPress={() => setSelectedMetricId(link.metricId)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.metricItem, { backgroundColor: colors.cardBackground }]}> 
                      <View style={styles.metricItemContent}>
                        <ThemedText type="defaultSemiBold">
                          {t(`metrics:${link.metricId}.name`)}
                        </ThemedText>
                        <ThemedText type="caption" style={styles.metricDescription}>
                          {t(`metrics:${link.metricId}.description`)}
                        </ThemedText>
                        <ThemedText type="caption" style={[styles.metricKind, { color: colors.text }]}> 
                          {link.kind}
                        </ThemedText>
                      </View>
                      <IconSymbol name="chevron.right" size={20} color={colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetView>
        </BottomSheet>
      )}
      <RegisterMetricModal
        visible={addModalVisible}
        onClose={handleCloseAddModal}
        onSave={handleSaveMetric}
        metricName={modalMetricId ? t(`metrics:${modalMetricId}.name`) : undefined}
        metricValue={metricValue}
        setMetricValue={setMetricValue}
        metricUnit={metricUnit}
        setMetricUnit={setMetricUnit}
        metricNotes={metricNotes}
        setMetricNotes={setMetricNotes}
        colors={colors}
        units={modalMetricId && metrics[modalMetricId]?.units ? metrics[modalMetricId].units : []}
      />
    </>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    marginBottom: 16,
  },
  metricsContainer: {
    gap: 12,
  },
  metricItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricItemContent: {
    flex: 1,
  },
  metricDescription: {
    marginTop: 4,
  },
  metricKind: {
    marginTop: 4,
    textTransform: 'capitalize',
  },
  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 8,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  unitsTitle: {
    marginBottom: 12,
    marginTop: 16,
  },
  unitItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  unitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    marginTop: 20,
    gap: 16,
  },
  metaItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButton: {
    marginTop: 12,
    marginBottom: 8,
  },
  modalContent: {
    gap: 16,
  },
  modalMetricName: {
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
});
