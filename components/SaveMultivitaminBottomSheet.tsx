import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { type Supplement } from '@/app/domain/Supplement';

import SupplementForm from './SupplementForm';
import SupplementItem from './SupplementItem';
import { ThemedText } from './ThemedText';
import AppButton from './ui/AppButton';
import { useBottomSheetDesign } from './ui/BottomSheetDesign';
import { CancelButton } from './ui/CancelButton';
import DiscreetButton from './ui/DiscreetButton';
import LabeledInput from './ui/LabeledInput';

type Props = {
  supplements: Supplement[];
  multivitamin?: Supplement;
  onSave: (name: string, components: Supplement[]) => void;
  onCancel: () => void;
};

const SaveMultivitaminBottomSheet: React.FC<Props> = ({ supplements, multivitamin, onSave, onCancel }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const sheetDesign = useBottomSheetDesign(colors);
  const [name, setName] = useState(multivitamin?.name ?? '');
  const [components, setComponents] = useState(supplements);
  const [editingSupplement, setEditingSupplement] = useState<Supplement | null>(null);
  const [addingSupplement, setAddingSupplement] = useState(false);
  const existingComponentIds = useRef(new Set(multivitamin?.components?.map(item => item.id) ?? []));

  useEffect(() => {
    bottomSheetRef.current?.present();
  }, []);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['55%', '85%']}
      enablePanDownToClose
      backgroundStyle={sheetDesign.backgroundStyle}
      handleComponent={sheetDesign.handleComponent}
      onDismiss={onCancel}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="title3">
          {t(multivitamin ? 'plan.editMultivitamin' : 'plan.saveAsMultivitamin')}
        </ThemedText>
        <LabeledInput
          label={t('plan.multivitaminName')}
          value={name}
          onChangeText={setName}
          isOptional={false}
        />
        <ThemedText type="label">{t('plan.multivitaminContents')}</ThemedText>
        <View style={styles.contents}>
          {components.map(supplement => (
            <SupplementItem
              key={supplement.id}
              planName=""
              supplement={supplement}
              badgeLabel={
                !existingComponentIds.current.has(supplement.id)
                  ? t('plan.multivitaminNew')
                  : undefined
              }
              onEditSupplement={(_planName, supplementName) => {
                setEditingSupplement(components.find(item => item.name === supplementName) ?? null);
              }}
              onRemoveSupplement={(_planName, supplementName) => {
                setComponents(current => current.filter(item => item.name !== supplementName));
              }}
            />
          ))}
        </View>
        <View style={styles.addSupplementButton}>
          <DiscreetButton
            title={`+ ${t('plan.addSupplement')}`}
            onPress={() => setAddingSupplement(true)}
            larger
          />
        </View>
        <AppButton
          title={t('general.save')}
          onPress={() => {
            const trimmedName = name.trim();
            if (!trimmedName) return;
            onSave(trimmedName, components);
            bottomSheetRef.current?.dismiss();
          }}
          disabled={!name.trim() || components.length === 0}
        />
        <CancelButton onPress={() => bottomSheetRef.current?.dismiss()} />
      </BottomSheetScrollView>
      {editingSupplement && (
        <SupplementForm
          key={editingSupplement.id}
          selectedTime={new Date()}
          isEditing
          preselectedSupplement={editingSupplement}
          onSave={updatedSupplement => {
            setComponents(current => current.map(item => (
              item.id === editingSupplement.id ? updatedSupplement : item
            )));
            setEditingSupplement(null);
          }}
          onCancel={() => setEditingSupplement(null)}
        />
      )}
      {addingSupplement && (
        <SupplementForm
          key="add-multivitamin-component"
          selectedTime={new Date()}
          isEditing={false}
          preselectedSupplement={null}
          onSave={newSupplement => {
            setComponents(current => (
              current.some(item => item.id === newSupplement.id)
                ? current
                : [...current, newSupplement]
            ));
            setAddingSupplement(false);
          }}
          onCancel={() => setAddingSupplement(false)}
        />
      )}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  contents: {
    gap: 2,
  },
  addSupplementButton: {
    marginTop: -10,
    marginLeft: 6,
    marginBottom: 12,
  },
});

export default SaveMultivitaminBottomSheet;