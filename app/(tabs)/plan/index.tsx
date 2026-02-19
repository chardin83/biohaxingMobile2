import { useTheme } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Portal } from 'react-native-paper';

import ShowAllButton from '@/app/(tabs)/dashboard/area/[areaId]/details/ShowAllButton';
import { useStorage } from '@/app/context/StorageContext';
import { SupplementPlanEntry } from '@/app/domain/SupplementPlanEntry';
import { Collapsible } from '@/components/Collapsible';
import CreateTimeSlotModal from '@/components/modals/CreateTimeSlotModal';
import { NutritionPlanSection } from '@/components/sections/NutritionPlanSection';
import { OtherPlanSection } from '@/components/sections/OtherPlanSection';
import { PlanMeta } from '@/components/sections/PlanMeta';
import { TrainingPlanSection } from '@/components/sections/TrainingPlanSection';
import SupplementForm from '@/components/SupplementForm';
import SupplementItem from '@/components/SupplementItem';
import { ThemedModal } from '@/components/ThemedModal';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';
import AppButton from '@/components/ui/AppButton';
import Container from '@/components/ui/Container';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PlanEditActions from '@/components/ui/PlanEditActions';
import { PressableCard } from '@/components/ui/PressableCard';
import { useSupplementSaver } from '@/hooks/useSupplementSaver';

import { Plan } from '../../domain/Plan';

// Plan category mapping not currently used; remove to avoid unused warnings

export default function Plans() {
  const params = useLocalSearchParams<{ openCreate?: string }>();
  const { colors } = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isEditingSupplement, setIsEditingSupplement] = useState(false);
  const [planForSupplementEdit, setPlanForSupplementEdit] = useState<Plan | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const [showAllReason, setShowAllReason] = useState(false);

  const { saveSupplementToPlan } = useSupplementSaver();

  const [supplement, setSupplement] = useState<SupplementPlanEntry | null>(null);

  const { plans, setPlans, errorMessage } = useStorage();

  const handleGoToCreatePlan = () => {
    router.push('/(tabs)/plan/create');
  };

  const { t } = useTranslation(['common', 'areas', 'tips']);

  const supplementPlans = plans.supplements;

  // Öppna skapamodal om efterfrågat via route-param
  useEffect(() => {
    if (params.openCreate === '1') {
      setIsEditingPlan(false);
      setSelectedPlan(null);
      setModalVisible(true);
    }
  }, [params.openCreate]);

  const savePlans = (updatedPlans: Plan[]) => {
    setPlans(prev => ({ ...prev, supplements: updatedPlans }));
  };

  // Removed unused handleSavePlan; CreateTimeSlotModal handles creation flow

  const handleRemovePlan = (planName: string) => {
    console.log('Removing plan:', planName);
    const updatedPlans = supplementPlans.filter(plan => plan.name !== planName);
    savePlans(updatedPlans);
  };

  const handleRemoveSupplement = (planName: string, supplementName: string) => {
    const updatedPlans = supplementPlans.map(plan =>
      plan.name === planName
        ? {
          ...plan,
          supplements: plan.supplements.filter(sup => sup.supplement.name !== supplementName),
        }
        : plan
    );
    savePlans(updatedPlans);
  };

  const handleEditSupplement = (planName: string, supplementTitle: string) => {
    const plan = supplementPlans.find(p => p.name === planName) || null;
    setPlanForSupplementEdit(plan);
    const sup = plan?.supplements.find(s => s.supplement.name === supplementTitle) || null;
    setSupplement(sup || null);
    setIsEditingSupplement(true);
  };

  const timeStringToDate = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    now.setHours(hours, minutes, 0, 0);
    return now;
  };

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsEditingPlan(true); // Enter edit mode
    setModalVisible(true); // Open the modal
  };

  const handleNotify = (plan: Plan) => {
    const updatedPlans = supplementPlans.map(p => (p.name === plan.name ? { ...p, notify: !p.notify } : p));
    savePlans(updatedPlans);
  };

  const togglePlanExpanded = (planKey: string) => {
    setExpandedPlans(prev => ({
      ...prev,
      [planKey]: !prev[planKey],
    }));
  };

  const renderPlanRow = (plan: Plan) => {
    const planKey = `${plan.name}-${plan.prefferedTime}`;
    const isExpanded = !!expandedPlans[planKey];
    const supplements = plan.supplements ?? [];
    const supplementCount = supplements.length;
    const baseTitle = `${plan.name} (${plan.prefferedTime})`;
    const displayTitle =
      !isExpanded && supplementCount > 0
        ? `${baseTitle} - ${t('plan.supplementCountLabel', {
          count: supplementCount,
          defaultValue: `${supplementCount} tillskott`,
        })}`
        : baseTitle;

    const editLabel = t('plan.editTimeSlot', { defaultValue: 'Redigera' });
    const headerActions = (
      <PlanEditActions
        onEdit={() => handleEditPlan(plan)}
        editLabel={editLabel}
        onNotifyToggle={() => handleNotify(plan)}
        notifyActive={plan.notify}
        notifyLabel={t('plan.toggleNotifications', { defaultValue: 'Växla notiser' })}
        style={styles.planHeaderActions}
      />
    );

    return (
      <AppBox
        title={displayTitle}
        headerRight={headerActions}
        onPressHeader={() => togglePlanExpanded(planKey)}
        headerAccessibilityLabel={t('plan.toggleSupplements', {
          defaultValue: 'Visa eller dölj innehåll',
        })}
        leading={
          <IconSymbol
            name="chevron.right"
            size={16}
            color={colors.icon}
            style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
          />
        }
      >
        {isExpanded && (
          <View>
            {Array.isArray(plan.supplements) &&
              plan.supplements.map(entry => (
                <SupplementItem
                  key={`${plan.name}-${entry.supplement.id ?? entry.supplement.name}`}
                  planName={plan.name}
                  entry={entry} // <-- skicka hela SupplementPlanEntry
                  onRemoveSupplement={handleRemoveSupplement}
                  onEditSupplement={handleEditSupplement}
                />
              ))}
            {errorMessage && <ThemedText type="caption" style={{ color: colors.error }}>{errorMessage}</ThemedText>}
            <View style={styles.planAddButtonWrapper}>
              <AppButton
                title={t('plan.addSupplement')}
                onPress={() => {
                  setIsEditingSupplement(false);
                  setPlanForSupplementEdit(plan);
                }}
                variant="primary"
              />
            </View>
          </View>
        )}
      </AppBox>
    );
  };

  const renderSupplementPlans = () => {
    if (!supplementPlans.length) {
      return (
        <ThemedText type="default">
          {t('plan.noSupplementSlots', {
            defaultValue: 'Inga tider skapade ännu.',
          })}
        </ThemedText>
      );
    }

    return supplementPlans.map(plan => <View key={`${plan.name}-${plan.prefferedTime}`}>{renderPlanRow(plan)}</View>);
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return isoDate;
    }
    // Anpassa språkkod efter användarens språk om du har det i din app, annars 'sv-SE'
    return date.toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const reasonSummary = plans.reasonSummary?.text ?? '';
  const reasonTooLong = reasonSummary.length > 300;

  // PlanMeta moved outside of Plans component below


  


  return (
    <Container background="gradient">
      <PressableCard style={styles.aiCard} onPress={handleGoToCreatePlan}>
        <ThemedText type="title3" style={styles.aiCardText}>
          ✨ {t('plan.aiCreateTitle')}
        </ThemedText>
        <ThemedText type="default" style={styles.aiCardDescription}>
          {t('plan.aiCreateDescription')}
        </ThemedText>
      </PressableCard>
      {!!plans.reasonSummary?.text && (
        <AppBox
          title={`${t('plan.latestAiCommentTitle')}`}
        >
          <>
            <ThemedText type="explainer">{formatDate(plans.reasonSummary.createdAt)}</ThemedText>
            <ThemedText 
              type="caption" 
              style={styles.reasonSummaryText}
              numberOfLines={showAllReason ? undefined : 5}
            >
              {plans.reasonSummary.text}
            </ThemedText>
            {reasonTooLong && (
              <ShowAllButton
                showAll={showAllReason}
                onPress={() => setShowAllReason(v => !v)}
                accentColor={colors.showAllAccent}
                style={styles.showAllButton}
                showAllText={t('createPlan.showAll')}
              />
            )}
          </>
        </AppBox>
      )}
      <View style={styles.sectionsContainer}>
        <View style={styles.sectionBlock}>
          <Collapsible
            title={t('plan.trainingHeader')}
            contentStyle={styles.collapsibleContentFlush}
            titleType="title3"
          >
            <TrainingPlanSection colors={colors} formatDate={formatDate} />
          </Collapsible>
        </View>
        <View style={styles.sectionBlock}>
          <Collapsible 
            title={t('plan.nutritionHeader')} 
            contentStyle={styles.collapsibleContentFlush}
            titleType="title3"
          >
            <NutritionPlanSection
              colors={colors}
              formatDate={formatDate}
            />
          </Collapsible>
        </View>
        <View style={styles.sectionBlock}>
          <Collapsible 
            title={t('plan.supplementSectionTitle')} 
            contentStyle={styles.collapsibleContentFlush}
            titleType="title3"
          >
            <View>{renderSupplementPlans()}</View>
            <View style={styles.addTimeSlotButtonWrapper}>
              <AppButton
                title={t('plan.addTimeSlot')}
                onPress={() => {
                  setIsEditingPlan(false);
                  setSelectedPlan(null);
                  setPlanForSupplementEdit(null);
                  setSupplement(null);
                  setModalVisible(true);
                }}
                variant="primary"
              />
            </View>
          </Collapsible>
        </View>
        <View style={styles.sectionBlock}>
          <Collapsible
            title={t('plan.otherHeader')}
            contentStyle={styles.collapsibleContentFlush}
            titleType="title3"
          >
            <OtherPlanSection formatDate={formatDate} />
          </Collapsible>
        </View>
      </View>
      <Portal>
        <CreateTimeSlotModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          initialName={isEditingPlan && selectedPlan ? selectedPlan.name : ''}
          initialTime={isEditingPlan && selectedPlan ? timeStringToDate(selectedPlan.prefferedTime) : new Date()}
          onCreate={planData => {
            if (isEditingPlan && selectedPlan) {
              // Uppdatera befintlig plan
              const updatedPlans = supplementPlans.map(plan =>
                plan.name === selectedPlan.name && plan.prefferedTime === selectedPlan.prefferedTime
                  ? { ...plan, name: planData.name, prefferedTime: planData.prefferedTime }
                  : plan
              );
              savePlans(updatedPlans);
            } else {
              // Skapa ny plan
              const newPlan = {
                name: planData.name,
                supplements: [],
                prefferedTime: planData.prefferedTime,
                notify: planData.notify,
              };
              const updatedPlans = [...supplementPlans, newPlan];
              savePlans(updatedPlans);
            }
            setModalVisible(false);
            setIsEditingPlan(false);
            setSelectedPlan(null);
          }}
          onDelete={
            isEditingPlan && selectedPlan
              ? () => {
                handleRemovePlan(selectedPlan.name);
                setModalVisible(false);
                setIsEditingPlan(false);
                setSelectedPlan(null);
              }
              : undefined
          }
        />
      </Portal>

      {/* Modal för att lägga till supplement */}
      {planForSupplementEdit && (
        <ThemedModal
          visible={!!planForSupplementEdit}
          title={
            isEditingSupplement
              ? `${t('plan.editSupplementFor')} ${planForSupplementEdit.name}`
              : `${t('plan.addSupplementFor')} ${planForSupplementEdit.name}`
          }
          onClose={() => {
            setPlanForSupplementEdit(null);
            setSupplement(null);
          }}
          okLabel={t('general.save')}
          onSave={undefined} // SupplementForm hanterar save
          showCancelButton={false}
        >
          <SupplementForm
            selectedTime={timeStringToDate(planForSupplementEdit.prefferedTime || '00:00')}
            isEditing={isEditingSupplement}
            preselectedSupplement={supplement?.supplement ?? null}
            onSave={savedSupplement => {
              // Skapa SupplementPlanEntry här
              const entry: SupplementPlanEntry = {
                supplement: savedSupplement,
                startedAt: isEditingSupplement
                  ? supplement?.startedAt ?? new Date().toISOString()
                  : new Date().toISOString(),
                createdBy: isEditingSupplement ? supplement?.createdBy ?? 'you' : 'you',
                editedAt: isEditingSupplement ? new Date().toISOString() : '',
                editedBy: isEditingSupplement ? 'you' : '',
                planName: planForSupplementEdit.name,
                prefferedTime: planForSupplementEdit.prefferedTime,
                notify: planForSupplementEdit.notify,
                reason: planForSupplementEdit.reason,
              };
              saveSupplementToPlan(planForSupplementEdit, entry, isEditingSupplement);
              setSupplement(null);
              setPlanForSupplementEdit(null);
            }}
            onCancel={() => {
              setPlanForSupplementEdit(null);
              setSupplement(null);
            }}
          />
          <PlanMeta
            startedAt={supplement?.startedAt ?? ''}
            createdBy={supplement?.createdBy}
            t={t}
            formatDate={formatDate}
          />
        </ThemedModal>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  sectionsContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  collapsibleContentFlush: {
    marginLeft: 0,
  },
  planHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planHeaderButton: {
    marginLeft: 12,
    padding: 4,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  planAddButtonWrapper: {
    marginTop: 15,
  },
  addTimeSlotButtonWrapper: {
    marginTop: 20,
    marginBottom: 50,
    width: '80%',
    alignSelf: 'center',
  },
  recommendedDose: {
    marginBottom: 8,
  },
  reasonText: {
    marginBottom: 6,
  },
  aiCard: {
    marginTop: 60,
  },
  aiCardText: {
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  aiCardDescription: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 4,
  },
  reasonSummaryText: {
    opacity: 0.75,
    marginTop: 4,
  },
  showAllButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
});
