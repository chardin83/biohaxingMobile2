import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import CreateTimeSlotModal, { CreatePlanData } from '@/components/modals/CreateTimeSlotModal';
import { ThemedModal } from '@/components/ThemedModal';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { useSupplementSaver } from '@/hooks/useSupplementSaver';

import { Supplement } from '../domain/Supplement';

interface SupplementListProps {
  supplements: Supplement[];
  plannedSupplements: { ids: Set<string>; names: Set<string> };
  supplementPlans: any[];
}

const SupplementList: React.FC<SupplementListProps> = ({
  supplements,
  plannedSupplements,
  supplementPlans,
}) => {
  const { t } = useTranslation();
  const { saveSupplementToPlan } = useSupplementSaver();
  const { colors } = useTheme();
  const [expandedSupplements, setExpandedSupplements] = React.useState<string[]>([]);
  const [addToPlanVisible, setAddToPlanVisible] = React.useState(false);
  const [pendingSupplement, setPendingSupplement] = React.useState<Supplement | null>(null);
  const [createPlanVisible, setCreatePlanVisible] = React.useState(false);

  const toggleSupplementInfo = (supplementId: string) => {
    setExpandedSupplements(prev =>
      prev.includes(supplementId) ? prev.filter(id => id !== supplementId) : [...prev, supplementId]
    );
  };

  const handleOpenAddToPlan = (supp: Supplement) => {
    setPendingSupplement(supp);
    setAddToPlanVisible(true);
  };

  const handleAddSupplementToPlan = (plan: any) => {
    if (!pendingSupplement) return;
    saveSupplementToPlan(
      { name: plan.name, prefferedTime: plan.prefferedTime, supplements: plan.supplements ?? [], notify: plan.notify },
      pendingSupplement,
      false
    );
    setAddToPlanVisible(false);
    setPendingSupplement(null);
  };

  if (!supplements.length) return null;
  return (
    <>
      {supplements.map((supplement: Supplement) => {
        const supplementId = supplement.id || supplement.name;
        const alreadyPlanned =
          plannedSupplements.ids.has(supplement.id) || plannedSupplements.names.has(supplement.name);
        const isExpanded = !!supplement.description && expandedSupplements.includes(supplementId);

        return (
          <View key={supplementId} style={[styles.supplementContainer, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.supplementRow}>
              <View style={styles.supplementNameColumn}>
                <ThemedText
                  type="default"
                  style={[{ color: colors.textLight }]}
                  numberOfLines={isExpanded ? undefined : 1}
                  ellipsizeMode="tail"
                >
                  {supplement.name}
                </ThemedText>
                {supplement.description ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => toggleSupplementInfo(supplementId)}
                    style={styles.supplementInfoRow}
                  >
                    <Icon
                      source={isExpanded ? 'information' : 'information-outline'}
                      size={14}
                      color={colors.primary}
                    />
                    <ThemedText type="caption" style={[styles.supplementInfoText, { color: colors.primary }]}>
                      {isExpanded ? t('common:goalDetails.lessInfo') : t('common:goalDetails.moreInfo')}
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
              {alreadyPlanned ? (
                <View style={styles.supplementCheck}>
                  <Icon source="check" size={22} color={colors.primary} />
                </View>
              ) : (
                <AppButton
                  title="+"
                  accessibilityLabel={t('common:goalDetails.addToPlan')}
                  onPress={() => handleOpenAddToPlan(supplement)}
                  variant="primary"
                />
              )}
            </View>
            {supplement.description && isExpanded && (
              <ThemedText type="default">
                {supplement.description}
              </ThemedText>
            )}
          </View>
        );
      })}

      {/* Modal: välj tidpunkt + lista planer */}
      <ThemedModal
        visible={addToPlanVisible}
        title={t('plan.addSupplement')}
        onClose={() => {
          setAddToPlanVisible(false);
          setPendingSupplement(null);
        }}
        showCancelButton
      >
        <View>
          <ThemedText type="default">
            {t('dayEdit.chooseTime')}
          </ThemedText>
          {supplementPlans.map(p => (
            <View key={p.name} style={styles.supplementPlanItem}>
              <AppButton
                title={`${p.name} (${p.prefferedTime})`}
                onPress={() => handleAddSupplementToPlan(p)}
                variant="primary"
              />
            </View>
          ))}
          <View style={styles.supplementPlanItem}>
            <AppButton
              title={t('plan.addTimeSlot')}
              onPress={() => {
                setAddToPlanVisible(false);
                setCreatePlanVisible(true);
              }}
              variant="secondary"
            />
          </View>
        </View>
      </ThemedModal>

      {/* Modal: skapa ny plan inline */}
      <CreateTimeSlotModal
        visible={createPlanVisible}
        onClose={() => {
          setCreatePlanVisible(false);
          setAddToPlanVisible(true);
        }}
        onCreate={(newPlan: CreatePlanData) => {
          if (pendingSupplement) {
            saveSupplementToPlan(
              { name: newPlan.name, prefferedTime: newPlan.prefferedTime, supplements: [], notify: newPlan.notify },
              pendingSupplement,
              false
            );
          }
          setCreatePlanVisible(false);
          setAddToPlanVisible(true);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  supplementContainer: {
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  supplementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  supplementNameColumn: {
    flex: 1,
    marginRight: 12,
  },
  supplementCheck: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  supplementInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  supplementInfoText: {
    marginLeft: 4,
  },
  supplementPlanItem: {
    marginBottom: 8,
  },
});

export default SupplementList;
