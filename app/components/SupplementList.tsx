import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CreateTimeSlotModal, { CreatePlanData } from '@/components/modals/CreateTimeSlotModal';
import SupplementForm from '@/components/SupplementForm';
import { SupplementWarnings } from '@/components/SupplementWarnings';
import { ThemedText } from '@/components/ThemedText';
import AddButton from '@/components/ui/AddButton';
import AppBox from '@/components/ui/AppBox';
import AppButton from '@/components/ui/AppButton';
import { useBottomSheetDesign } from '@/components/ui/BottomSheetDesign';
import { CancelButton } from '@/components/ui/CancelButton';
import DiscreetButton from '@/components/ui/DiscreetButton';

import { useStorage } from '../context/StorageContext';
import type { Plan } from '../domain/Plan';
import { Supplement } from '../domain/Supplement';
import { SupplementPlanEntry } from '../domain/SupplementPlanEntry';

interface SupplementListProps {
  supplements: Supplement[];
  plannedSupplements: { ids: Set<string>; names: Set<string> };
  supplementPlans: any[];
}

const SupplementList: React.FC<SupplementListProps> = ({ supplements, plannedSupplements, supplementPlans }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { saveSupplementToPlan } = useStorage();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetDesign = useBottomSheetDesign(colors);
  const addToPlanRef = React.useRef<BottomSheetModal>(null);
  const openingCreatePlan = React.useRef(false);
  const openingDosagePlan = React.useRef<Plan | null>(null);
  const [dosagePlan, setDosagePlan] = React.useState<Plan | null>(null);
  const [expandedSupplements, setExpandedSupplements] = React.useState<string[]>([]);
  const [addToPlanVisible, setAddToPlanVisible] = React.useState(false);
  const [pendingSupplement, setPendingSupplement] = React.useState<Supplement | null>(null);
  const [createPlanVisible, setCreatePlanVisible] = React.useState(false);

  React.useEffect(() => {
    if (addToPlanVisible) addToPlanRef.current?.present();
    else addToPlanRef.current?.dismiss();
  }, [addToPlanVisible]);

  const renderBackdrop = React.useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  const toggleSupplementInfo = (supplementId: string) => {
    setExpandedSupplements(prev => (prev.includes(supplementId) ? prev.filter(id => id !== supplementId) : [...prev, supplementId]));
  };

  const handleOpenAddToPlan = (supp: Supplement) => {
    setPendingSupplement(supp);
    setAddToPlanVisible(true);
  };

  const handleChoosePlan = (plan: Plan) => {
    if (!pendingSupplement) return;
    openingDosagePlan.current = plan;
    setAddToPlanVisible(false);
  };

  if (!supplements.length) return null;
  return (
    <AppBox title={t('supplementList.title')}>
      {supplements.map((supplement: Supplement) => {
        const supplementId = supplement.id || supplement.name;
        const alreadyPlanned = plannedSupplements.ids.has(supplement.id) || plannedSupplements.names.has(supplement.name);
        const isExpanded = !!supplement.description && expandedSupplements.includes(supplementId);

        return (
          <View key={supplementId} style={[styles.supplementContainer, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.supplementRow}>
              <View style={styles.supplementNameColumn}>
                <ThemedText type="default" style={[{ color: colors.textLight }]} numberOfLines={isExpanded ? undefined : 1} ellipsizeMode="tail">
                  {supplement.name}
                </ThemedText>
                {supplement.description ? (
                  <Pressable accessibilityRole="button" onPress={() => toggleSupplementInfo(supplementId)} style={styles.supplementInfoRow}>
                    <Icon source={isExpanded ? 'information' : 'information-outline'} size={14} color={colors.primary} />
                    <ThemedText type="caption" style={[styles.supplementInfoText, { color: colors.primary }]}>
                      {isExpanded ? t('common:supplementList.lessInfo') : t('common:supplementList.moreInfo')}
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
              <AddButton
                added={alreadyPlanned}
                onClick={() => handleOpenAddToPlan(supplement)}
                accessibilityLabel={t('common:supplementList.addToPlan')}
                allowToggle={false}
              />
            </View>
            {supplement.description && isExpanded && <ThemedText type="default">{supplement.description}</ThemedText>}
          </View>
        );
      })}

      {/* Bottom sheet: välj tidpunkt + lista planer */}
      <BottomSheetModal
        ref={addToPlanRef}
        snapPoints={['65%', '90%']}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={sheetDesign.backgroundStyle}
        handleComponent={sheetDesign.handleComponent}
        onDismiss={() => {
          setAddToPlanVisible(false);
          if (openingCreatePlan.current) {
            openingCreatePlan.current = false;
            setCreatePlanVisible(true);
            return;
          }
          if (openingDosagePlan.current) {
            setDosagePlan(openingDosagePlan.current);
            openingDosagePlan.current = null;
            return;
          }
          setPendingSupplement(null);
        }}
      >
        <BottomSheetScrollView contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + 24 }]}>
          <ThemedText type="title2" accessibilityRole="header">
            {t('plan.addSupplement')}
          </ThemedText>
          <ThemedText type="title3">{pendingSupplement?.name}</ThemedText>
          <SupplementWarnings supplement={pendingSupplement} />
          <ThemedText type="default">{t('supplementList.chooseTime')}</ThemedText>
          {supplementPlans.map(p => (
            <View key={p.name} style={styles.supplementPlanItem}>
              <AppButton title={`${p.name} (${p.prefferedTime})`} onPress={() => handleChoosePlan(p)} variant="primary" />
            </View>
          ))}
          <View style={styles.supplementPlanItem}>
            <AppButton
              title={t('plan.addTimeSlot')}
              onPress={() => {
                openingCreatePlan.current = true;
                setAddToPlanVisible(false);
              }}
              variant="secondary"
            />
          </View>
          <CancelButton onPress={() => setAddToPlanVisible(false)} />
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Modal: skapa ny plan inline */}
      <CreateTimeSlotModal
        visible={createPlanVisible}
        onClose={() => {
          // Stäng endast create-modal
          setCreatePlanVisible(false);
          setPendingSupplement(null);
        }}
        onCreate={(newPlan: CreatePlanData) => {
          setCreatePlanVisible(false);
          if (pendingSupplement) setDosagePlan({ ...newPlan, supplements: [] });
        }}
      />
      {dosagePlan && pendingSupplement && (
        <SupplementForm
          selectedTime={(() => {
            const date = new Date();
            const [hours, minutes] = dosagePlan.prefferedTime.split(':').map(Number);
            date.setHours(hours, minutes, 0, 0);
            return date;
          })()}
          isEditing={false}
          lockSupplement
          preselectedSupplement={pendingSupplement}
          onCancel={() => {
            setDosagePlan(null);
            setPendingSupplement(null);
          }}
          onSave={async selectedSupplement => {
            const entry: SupplementPlanEntry = {
              supplement: selectedSupplement,
              startedAt: new Date().toISOString(),
              createdBy: 'local',
              planName: dosagePlan.name,
              prefferedTime: dosagePlan.prefferedTime,
              notify: dosagePlan.notify,
            };
            const savedPlan = await saveSupplementToPlan(dosagePlan, entry, false);
            if (!savedPlan) return false;
            setDosagePlan(null);
            setPendingSupplement(null);
          }}
        />
      )}
      <View style={[styles.planLink, { borderTopColor: colors.borderLight }]}>
        <DiscreetButton
          title={t('supplementList.mySupplements')}
          color={colors.primary}
          icon="checklist"
          rightIcon="chevron.right"
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/plan', params: { openSection: 'supplements' } })}
        />
      </View>
    </AppBox>
  );
};

const styles = StyleSheet.create({
  planLink: { alignItems: 'flex-end', marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  sheetContent: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
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
