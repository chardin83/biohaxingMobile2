

import { useTheme } from '@react-navigation/native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-paper';

import { useStorage } from '@/app/context/StorageContext';
import { SupplementPlanEntry } from '@/app/domain/SupplementPlanEntry';
import { Collapsible } from '@/components/Collapsible';
import CreateTimeSlotModal from '@/components/modals/CreateTimeSlotModal';
import PlanCategoryIcon from '@/components/plan/PlanCategoryIcon';
import { NutritionPlanSection } from '@/components/sections/plan/NutritionPlanSection';
import { OtherPlanSection } from '@/components/sections/plan/OtherPlanSection';
import { PlanMeta } from '@/components/sections/plan/PlanMeta';
import { TrainingPlanSection } from '@/components/sections/plan/TrainingPlanSection';
import ShowAllButton from '@/components/ShowAllButton';
import SupplementForm from '@/components/SupplementForm';
import SupplementItem from '@/components/SupplementItem';
import { ThemedModal } from '@/components/ThemedModal';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';
import AppButton from '@/components/ui/AppButton';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import DiscreetButton from '@/components/ui/DiscreetButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PlanEditActions from '@/components/ui/PlanEditActions';
import { PressableCard } from '@/components/ui/PressableCard';
import { useSupplementSaver } from '@/hooks/useSupplementSaver';
import { formatDate } from '@/utils/dateUtils';

import { Plan } from '../../domain/Plan';

// Helper: Request notification permissions
async function requestNotificationPermission() {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }
  return false;
}

// Helper: Cancel a notification by id
async function cancelNotificationById(notificationId?: string) {
  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {}
  }
}

// Helper: Schedule notification for a supplement plan and return notificationId
async function scheduleSupplementNotification(plan: Plan): Promise<string | undefined> {
  if (!plan.notify) return undefined;
  const [hours, minutes] = plan.prefferedTime.split(':').map(Number);
  const supplementList = (plan.supplements && plan.supplements.length > 0)
    ? plan.supplements.map(s => s.supplement.name).join(', ')
    : 'Inga tillskott';
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Dags för tillskott ${plan.name}:`,
        body: `${supplementList}`,
        sound: true,
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
        type: 'daily',
      } as Notifications.DailyTriggerInput,
    });
    return id;
  } catch {
    return undefined;
  }
}

const getSupplementTimeIcon = (preferredTime: string): React.ComponentProps<typeof IconSymbol>['name'] => {
  const hour = Number.parseInt((preferredTime || '').split(':')[0] ?? '', 10);

  if (!Number.isFinite(hour)) return 'pill';
  if (hour >= 5 && hour < 11) return 'alarm';
  if (hour >= 11 && hour < 19) return 'sunny';
  if (hour >= 19 && hour < 22) return 'moon';
  return 'moon';
};

// Plan category mapping not currently used; remove to avoid unused warnings

export default function Plans() {
    // Request notification permissions on mount
    useEffect(() => {
      requestNotificationPermission();
    }, []);
  const params = useLocalSearchParams<{ openCreate?: string }>();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    sectionCountBadge: {
      minWidth: 28,
      height: 28,
      borderRadius: 999,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.planSectionBadgeBackground,
      borderWidth: 1,
      borderColor: colors.planSectionBadgeBorder,
      marginRight: 6,
    },
    sectionCountBadgeText: {
      color: colors.planSectionBadgeText,
      fontWeight: '800',
      fontSize: 12,
    },
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
      marginTop: 10,
      marginLeft: -10,
      alignSelf: 'center',
    },
    addTimeSlotButtonWrapper: {
      marginTop: 20,
      marginBottom: 50,
      width: '80%',
      alignSelf: 'center',
    },
    archivedPlansButtonWrapper: {
      marginHorizontal: 20,
      marginBottom: 24,
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
    noSupplementsText: {
      textAlign: 'center',
      marginBottom: 18,
    },
    supplementGoalCard: {
      borderWidth: 0,
      borderLeftWidth: 6,
      borderRadius: 16,
      paddingLeft: 12,
    },
    supplementCardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    supplementCardHeaderMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      paddingVertical: 2,
    },
    supplementCardTitle: {
      textTransform: 'uppercase',
      flexShrink: 1,
    },
    supplementCardHeaderRight: {
      marginLeft: 12,
    },
    supplementChevron: {
      marginTop: 1,
    },
  });

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
    router.push('/plan/create');
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

  // Toggle notification for a plan (and handle time changes)
  const handleNotify = async (plan: Plan) => {
    const updatedPlans = await Promise.all(
      supplementPlans.map(async p => {
        if (p.name === plan.name) {
          // Avboka ev. gammal notis
          await cancelNotificationById(p.notificationId);
          const newNotify = !p.notify;
          let notificationId: string | undefined;
          if (newNotify) {
            notificationId = await scheduleSupplementNotification({ ...p, notify: true });
          }
          return { ...p, notify: newNotify, notificationId };
        }
        return p;
      })
    );
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
    const baseTitle = `${plan.name} ${plan.prefferedTime}`;
    const displayTitle =
      isExpanded
      ? baseTitle
        :`${baseTitle} (${supplementCount})`;
    const supplementTimeIcon = getSupplementTimeIcon(plan.prefferedTime);

    const editLabel = t('plan.editTimeSlot');
    const headerActions = (
      <PlanEditActions
        onEdit={() => handleEditPlan(plan)}
        editLabel={editLabel}
        onNotifyToggle={() => handleNotify(plan)}
        notifyActive={plan.notify}
        notifyLabel={t('plan.toggleNotifications')}
        style={styles.planHeaderActions}
      />
    );

    return (
      <Card
        style={[
          styles.supplementGoalCard,
          { borderLeftColor: colors.planSectionSupplementIcon },
        ]}
      >
        <View style={styles.supplementCardHeaderRow}>
          <TouchableOpacity
            style={styles.supplementCardHeaderMain}
            onPress={() => {
              togglePlanExpanded(planKey);
            }}
            activeOpacity={0.85}
              accessibilityLabel={t('plan.toggleSupplements')}
          >
            <IconSymbol
              name="chevron.right"
              size={16}
              color={colors.icon}
              style={[styles.supplementChevron, { transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }]}
            />
            <IconSymbol name={supplementTimeIcon} size={18} color={colors.planSectionSupplementIcon} />
            <ThemedText type="title3" style={[styles.supplementCardTitle, { color: colors.planSectionSupplementIcon }]}>
              {displayTitle}
            </ThemedText>
          </TouchableOpacity>
          <View style={styles.supplementCardHeaderRight}>{headerActions}</View>
        </View>
        {isExpanded && (
          <View>
            {plan.supplements.length > 0 ?
              plan.supplements.map(entry => (
                <SupplementItem
                  key={`${plan.name}-${entry.supplement.id ?? entry.supplement.name}`}
                  planName={plan.name}
                  supplement={entry.supplement} // <-- skicka hela SupplementPlanEntry
                  onRemoveSupplement={handleRemoveSupplement}
                  onEditSupplement={handleEditSupplement}
                />
              )) : (
                <ThemedText type="explainer" style={styles.noSupplementsText}>
                  {t('plan.noSupplementsInPlan', { plan: plan.name.toLowerCase() })}
                </ThemedText>
              )
              }
            {errorMessage && <ThemedText type="caption" style={{ color: colors.error }}>{errorMessage}</ThemedText>}
            <View style={styles.planAddButtonWrapper}>
              <DiscreetButton
                title={`+ ${t('plan.addSupplement')}`}
                onPress={() => {
                  setIsEditingSupplement(false);
                  setPlanForSupplementEdit(plan);
                }}
              />
            </View>
          </View>
        )}
      </Card>
    );
  };

  const renderSupplementPlans = () => {
    if (!supplementPlans.length) {
      return (
        <ThemedText type="default">
          {t('plan.noSupplementSlots')}
        </ThemedText>
      );
    }

    return supplementPlans.map(plan => <View key={`${plan.name}-${plan.prefferedTime}`}>{renderPlanRow(plan)}</View>);
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
            title={`${t('plan.trainingHeader')}`}
            leftContent={<PlanCategoryIcon category="training" />}
            rightContent={
              <View style={styles.sectionCountBadge}>
                <ThemedText type="caption">
                  {plans.training?.length ?? 0}
                </ThemedText>
              </View>
            }
            chevronPosition="right"
            contentStyle={styles.collapsibleContentFlush}
            titleType="title3"
            initialCollapsed={true}
          >
            <TrainingPlanSection colors={colors} />
          </Collapsible>
        </View>
        <View style={styles.sectionBlock}>
          <Collapsible 
            title={`${t('plan.nutritionHeader')}`} 
            leftContent={<PlanCategoryIcon category="nutrition" />}
            rightContent={
              <View style={styles.sectionCountBadge}>
                <ThemedText type="caption">
                  {plans.nutrition?.length ?? 0}
                </ThemedText>
              </View>
            }
            chevronPosition="right"
            contentStyle={styles.collapsibleContentFlush}
            titleType="title3"
            initialCollapsed={true}
          >
            <NutritionPlanSection
              colors={colors}
            />
          </Collapsible>
        </View>
        <View style={styles.sectionBlock}>
          <Collapsible 
            title={`${t('plan.supplementSectionTitle')}`} 
            leftContent={<PlanCategoryIcon category="supplement" />}
            rightContent={
              <View style={styles.sectionCountBadge}>
                <ThemedText type="caption">
                  {plans.supplements?.length ?? 0}
                </ThemedText>
              </View>
            }
            chevronPosition="right"
            contentStyle={styles.collapsibleContentFlush}
            titleType="title3"
            initialCollapsed={true}
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
            title={`${t('plan.otherHeader')}`}
            leftContent={<PlanCategoryIcon category="other" />}
            rightContent={
              <View style={styles.sectionCountBadge}>
                <ThemedText type="caption">
                  {plans.other?.length ?? 0}
                </ThemedText>
              </View>
            }
            chevronPosition="right"
            contentStyle={styles.collapsibleContentFlush}
            titleType="title3"
            initialCollapsed={true}
          >
            <OtherPlanSection />
          </Collapsible>
        </View>
      </View>
      <View style={styles.archivedPlansButtonWrapper}>
        <AppButton
          title={t('plan.previousPlans')}
          icon="archive"
          variant="secondary"
          onPress={() => router.push('/plan/archive')}
        />
      </View>
      <Portal>
        <CreateTimeSlotModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          initialName={isEditingPlan && selectedPlan ? selectedPlan.name : ''}
          initialTime={isEditingPlan && selectedPlan ? timeStringToDate(selectedPlan.prefferedTime) : new Date()}
          onCreate={async planData => {
            if (isEditingPlan && selectedPlan) {
              // Uppdatera befintlig plan
              const updatedPlans = await Promise.all(
                supplementPlans.map(async plan => {
                  if (plan.name === selectedPlan.name && plan.prefferedTime === selectedPlan.prefferedTime) {
                    // Avboka ev. gammal notis
                    await cancelNotificationById(plan.notificationId);
                    let notificationId = plan.notificationId;
                    if (plan.notify) {
                      notificationId = await scheduleSupplementNotification({
                        ...plan,
                        name: planData.name,
                        prefferedTime: planData.prefferedTime,
                      });
                    }
                    return { ...plan, name: planData.name, prefferedTime: planData.prefferedTime, notificationId };
                  }
                  return plan;
                })
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
              let notificationId;
              if (planData.notify) {
                notificationId = await scheduleSupplementNotification({ ...newPlan, notificationId: undefined });
              }
              const updatedPlans = [...supplementPlans, { ...newPlan, notificationId }];
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
          {isEditingSupplement && (  
            <PlanMeta
            startedAt={supplement?.startedAt ?? ''}
            createdBy={supplement?.createdBy}
          />)}
        
        </ThemedModal>
      )}
    </Container>
  );
}

