import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';

import CreateTimeSlotModal, { CreatePlanData } from '@/components/modals/CreateTimeSlotModal';
import { ThemedModal } from '@/components/ThemedModal';
import AppButton from '@/components/ui/AppButton';
import { Colors } from '@/constants/Colors';
import { useSupplementSaver } from '@/hooks/useSupplementSaver';

interface SupplementListProps {
  supplements: any[];
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
  const [expandedSupplements, setExpandedSupplements] = React.useState<string[]>([]);
  const [addToPlanVisible, setAddToPlanVisible] = React.useState(false);
  const [pendingSupplement, setPendingSupplement] = React.useState<any | null>(null);
  const [createPlanVisible, setCreatePlanVisible] = React.useState(false);

  const toggleSupplementInfo = (supplementId: string) => {
    setExpandedSupplements(prev =>
      prev.includes(supplementId) ? prev.filter(id => id !== supplementId) : [...prev, supplementId]
    );
  };

  const handleOpenAddToPlan = (supp: any) => {
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
      {supplements.map((supplement: any) => {
        const supplementId = supplement.id || supplement.name;
        const alreadyPlanned =
          plannedSupplements.ids.has(supplement.id) || plannedSupplements.names.has(supplement.name);
        const isExpanded = !!supplement.description && expandedSupplements.includes(supplementId);

        return (
          <View key={supplementId} style={styles.supplementContainer}>
            <View style={styles.supplementRow}>
              <View style={styles.supplementNameColumn}>
                <Text
                  style={styles.supplementText}
                  numberOfLines={isExpanded ? undefined : 1}
                  ellipsizeMode="tail"
                >
                  {supplement.name}
                </Text>
                {supplement.description ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => toggleSupplementInfo(supplementId)}
                    style={styles.supplementInfoRow}
                  >
                    <Icon
                      source={isExpanded ? 'information' : 'information-outline'}
                      size={14}
                      color={Colors.dark.primary}
                    />
                    <Text style={styles.supplementInfoText}>
                      {isExpanded ? t('common:goalDetails.lessInfo') : t('common:goalDetails.moreInfo')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              {alreadyPlanned ? (
                <View style={styles.supplementCheck}>
                  <Icon source="check" size={22} color={Colors.dark.primary} />
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
              <Text style={styles.supplementDescription}>{supplement.description}</Text>
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
          <Text style={styles.supplementDescription}>{t('dayEdit.chooseTime')}</Text>
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
    borderBottomColor: Colors.dark.border,
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
  supplementText: {
    color: Colors.dark.textLight,
    fontSize: 16,
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
    color: Colors.dark.primary,
    fontSize: 12,
    marginLeft: 4,
  },
  supplementDescription: {
    color: Colors.dark.textLight,
    fontSize: 14,
    marginTop: 6,
  },

  supplementPlanItem: {
    marginBottom: 8,
  },
});

export default SupplementList;
