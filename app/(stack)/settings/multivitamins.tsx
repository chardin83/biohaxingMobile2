import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import SaveMultivitaminBottomSheet from '@/components/SaveMultivitaminBottomSheet';
import SupplementItem from '@/components/SupplementItem';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';

export default function MultivitaminsPage() {
  const { t } = useTranslation();
  const { customSupplements, plans, setCustomSupplements, setPlans } = useStorage();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const editingMultivitamin = customSupplements.find(item => item.id === editingId);

  const confirmDelete = (multivitaminId: string, multivitaminName: string) => {
    const planCount = plans.supplements.filter(plan => plan.supplements.some(
      entry => entry.supplement.id === multivitaminId
    )).length;
    const message = planCount > 0
      ? t('settings.deleteMultivitaminUsedMessage', { count: planCount })
      : t('settings.deleteMultivitaminMessage');

    Alert.alert(
      t('settings.deleteMultivitaminTitle', { name: multivitaminName }),
      message,
      [
        { text: t('general.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteMultivitaminAction'),
          style: 'destructive',
          onPress: () => {
            setCustomSupplements(current => current.filter(item => item.id !== multivitaminId));
            if (planCount > 0) {
              setPlans(current => ({
                ...current,
                supplements: current.supplements.map(plan => ({
                  ...plan,
                  supplements: plan.supplements.filter(entry => entry.supplement.id !== multivitaminId),
                })),
              }));
            }
          },
        },
      ]
    );
  };

  return (
    <Container background="default" showBackButton>
      <ThemedText type="title2">{t('settings.myMultivitamins')}</ThemedText>
      <ThemedText type="label" style={styles.subtitle}>
        {t('settings.myMultivitaminsSubtitle')}
      </ThemedText>
      {customSupplements.length > 0 ? (
        <View style={styles.list}>
          {customSupplements.map(multivitamin => (
            <SupplementItem
              key={multivitamin.id}
              planName=""
              supplement={multivitamin}
              onEditSupplement={() => setEditingId(multivitamin.id)}
              onRemoveSupplement={() => confirmDelete(multivitamin.id, multivitamin.name)}
            />
          ))}
        </View>
      ) : (
        <ThemedText type="default" style={styles.emptyText}>
          {t('settings.myMultivitaminsEmpty')}
        </ThemedText>
      )}
      {editingMultivitamin ? (
        <SaveMultivitaminBottomSheet
          supplements={editingMultivitamin.components ?? []}
          multivitamin={editingMultivitamin}
          onSave={(name, components) => {
            setCustomSupplements(current => current.map(item => (
              item.id === editingMultivitamin.id
                ? { ...item, name, components, description: components.map(component => component.name).join(', ') }
                : item
            )));
            setEditingId(null);
          }}
          onCancel={() => setEditingId(null)}
        />
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 4, marginBottom: 16 },
  list: { width: '100%' },
  emptyText: { marginTop: 24 },
});