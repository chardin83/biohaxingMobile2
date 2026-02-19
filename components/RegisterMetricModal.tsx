import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedModal } from '@/components/ThemedModal';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';

interface RegisterMetricModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  metricName?: string;
  metricValue: string;
  setMetricValue: (v: string) => void;
  metricUnit: string;
  setMetricUnit: (v: string) => void;
  metricNotes: string;
  setMetricNotes: (v: string) => void;
  colors: any;
  units?: Array<{ unit: string; system: string }>; // Pass in units for the current metric
}

export const RegisterMetricModal: React.FC<RegisterMetricModalProps> = ({
  visible,
  onClose,
  onSave,
  metricName,
  metricValue,
  setMetricValue,
  metricUnit,
  setMetricUnit,
  metricNotes,
  setMetricNotes,
  colors,
  units
}) => (
  <ThemedModal visible={visible} onClose={onClose} title="Registrera mätvärde">
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        contentContainerStyle={styles.modalContent}
        keyboardShouldPersistTaps="handled"
        persistentScrollbar
        showsVerticalScrollIndicator
      >
        {metricName && (
          <ThemedText type="defaultSemiBold" style={styles.modalMetricName}>
            {metricName}
          </ThemedText>
        )}
        <View style={styles.inputGroup}>
          <ThemedText type="default" style={styles.inputLabel}>
            Värde
          </ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={metricValue}
            onChangeText={setMetricValue}
            keyboardType="decimal-pad"
            placeholder="Ange värde"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={styles.inputGroup}>
          <ThemedText type="default" style={styles.inputLabel}>
            Enhet
          </ThemedText>
          {units && units.length > 1 ? (
            <View style={[styles.input, { padding: 0, justifyContent: 'center' }]}> 
              <Picker
                selectedValue={metricUnit}
                onValueChange={setMetricUnit}
                style={{ color: colors.text }}
                dropdownIconColor={colors.text}
              >
                {units.map((u) => (
                  <Picker.Item key={u.unit} label={u.unit + (u.system ? ` (${u.system})` : '')} value={u.unit} />
                ))}
              </Picker>
            </View>
          ) : units && units.length === 1 ? (
            <View style={[styles.input, { justifyContent: 'center' }]}> 
              <ThemedText type="defaultSemiBold">{units[0].unit}</ThemedText>
            </View>
          ) : (
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={metricUnit}
              onChangeText={setMetricUnit}
              placeholder="t.ex. mg/dL"
              placeholderTextColor={colors.textMuted}
            />
          )}
        </View>
        <View style={styles.inputGroup}>
          <ThemedText type="default" style={styles.inputLabel}>
            Notering (valfritt)
          </ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
            value={metricNotes}
            onChangeText={setMetricNotes}
            placeholder="T.ex. fastande mätvärde"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>
        <View style={styles.modalButtons}>
          <AppButton onPress={onClose} title="Avbryt" variant="secondary" style={styles.modalButton} />
          <AppButton onPress={onSave} title="Spara" style={styles.modalButton} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </ThemedModal>
);

const styles = StyleSheet.create({
  modalContent: {
    gap: 16,
    flexGrow: 1,
    minHeight: 0,
    justifyContent: 'flex-start',
    paddingBottom: 64,
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
