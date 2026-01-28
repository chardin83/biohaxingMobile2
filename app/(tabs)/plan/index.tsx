import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-paper';

import { Collapsible } from '@/components/Collapsible';
import CreateTimeSlotModal from '@/components/modals/CreateTimeSlotModal';
import TrainingSettingsModal from '@/components/modals/TrainingSettingsModal';
import SupplementForm from '@/components/SupplementForm';
import SupplementItem from '@/components/SupplementItem';
import { ThemedModal } from '@/components/ThemedModal';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';
import AppButton from '@/components/ui/AppButton';
import Badge from '@/components/ui/Badge';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSupplementSaver } from '@/hooks/useSupplementSaver';
import { defaultPlans } from '@/locales/defaultPlans';
import { useSupplementMap } from '@/locales/supplements';
import { Tip, tips } from '@/locales/tips';

import { useStorage } from '../../context/StorageContext';
import { Plan } from '../../domain/Plan';
import { Supplement } from '../../domain/Supplement';
import { colors } from '../../theme/styles';

// Plan category mapping not currently used; remove to avoid unused warnings

export default function Plans() {
  const params = useLocalSearchParams<{ openCreate?: string }>();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isEditingSupplement, setIsEditingSupplement] = useState(false);
  const [planForSupplementEdit, setPlanForSupplementEdit] = useState<Plan | null>(null);
  const [expandedNutritionTips, setExpandedNutritionTips] = useState<Record<string, boolean>>({});
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const [trainingSettingsVisible, setTrainingSettingsVisible] = useState(false);
  const [trainingSettingsTipId, setTrainingSettingsTipId] = useState<string | null>(null);
  const [trainingSettingsTitle, setTrainingSettingsTitle] = useState<string | null>(null);
  const [trainingSessionsInput, setTrainingSessionsInput] = useState('');
  const [trainingDurationInput, setTrainingDurationInput] = useState('');

  const { saveSupplementToPlan } = useSupplementSaver();

  const [supplement, setSupplement] = useState<Supplement | null>(null);
  // Removed time picker state; handled within modal components if needed

  const { plans, setPlans, errorMessage, trainingPlanSettings, setTrainingPlanSettings } = useStorage();

  const { t } = useTranslation(['common', 'areas', 'tips']);
  const supplementMap = useSupplementMap();
  const colorScheme = useColorScheme();
  const badgeIconColor = colorScheme === 'light' ? Colors.light.icon : Colors.dark.icon;

  const supplementPlans = plans.supplements;
  const trainingPlanGoals = useMemo(() => plans.training, [plans.training]);
  const nutritionGoals = plans.nutrition;

  const getRecommendedDoseLabel = React.useCallback(
    (tip?: Tip) => {
      if (!tip?.supplements?.length) return null;
      for (const reference of tip.supplements) {
        if (!reference.id) continue;
        const suppMeta = supplementMap.get(reference.id);
        if (suppMeta?.quantity) {
          const unit = suppMeta.unit ? ` ${suppMeta.unit}` : '';
          const dose = `${suppMeta.quantity}${unit}`.trim();
          if (dose.length > 0) {
            return t('plan.recommendedDose', { dose });
          }
        }
      }
      return null;
    },
    [supplementMap, t]
  );

  const nutritionGroups = useMemo(() => {
    const tipIds = new Set<string>();

    nutritionGoals.forEach(goal => {
      if (goal.tipId) {
        tipIds.add(goal.tipId);
      }
    });

    return Array.from(tipIds).map(tipId => ({ tipId }));
  }, [nutritionGoals]);

  const toggleNutritionFoods = React.useCallback((tipId: string) => {
    setExpandedNutritionTips(prev => ({
      ...prev,
      [tipId]: !prev[tipId],
    }));
  }, []);

  const openTrainingSettingsModal = (tipId: string, trainingTitle?: string | null) => {
    const existing = trainingPlanSettings[tipId];
    setTrainingSessionsInput(existing?.sessionsPerWeek === undefined ? '' : existing.sessionsPerWeek.toString());
    setTrainingDurationInput(
      typeof existing?.sessionDurationMinutes === 'number' ? existing.sessionDurationMinutes.toString() : ''
    );
    setTrainingSettingsTipId(tipId);
    setTrainingSettingsTitle(trainingTitle ?? null);
    setTrainingSettingsVisible(true);
  };

  const closeTrainingSettingsModal = () => {
    setTrainingSettingsVisible(false);
    setTrainingSettingsTipId(null);
    setTrainingSettingsTitle(null);
    setTrainingSessionsInput('');
    setTrainingDurationInput('');
  };

  const handleSaveTrainingSettings = () => {
    if (!trainingSettingsTipId) {
      closeTrainingSettingsModal();
      return;
    }

    const parseNumericInput = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = Number.parseInt(trimmed, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    const sessionsValue = parseNumericInput(trainingSessionsInput);
    const durationValue = parseNumericInput(trainingDurationInput);

    setTrainingPlanSettings(prev => {
      const next = { ...prev };
      if (sessionsValue === undefined && durationValue === undefined) {
        delete next[trainingSettingsTipId];
      } else {
        next[trainingSettingsTipId] = {
          sessionsPerWeek: sessionsValue,
          sessionDurationMinutes: durationValue,
        };
      }
      return next;
    });

    closeTrainingSettingsModal();
  };

  useEffect(() => {
    if (supplementPlans.length === 0) {
      const translatedDefaults = defaultPlans.map(plan => ({
        name: t(`plan.defaultPlan.${plan.key}`),
        supplements: [],
        prefferedTime: plan.time,
        notify: false,
      }));
      setPlans(prev => ({ ...prev, supplements: translatedDefaults }));
    }
  }, [supplementPlans.length, setPlans, t]);

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
            supplements: plan.supplements.filter(sup => sup.name !== supplementName),
          }
        : plan
    );
    savePlans(updatedPlans);
  };

  const handleEditSupplement = (planName: string, supplementTitle: string) => {
    const plan = supplementPlans.find(p => p.name === planName) || null;
    setPlanForSupplementEdit(plan);
    const sup = plan?.supplements.find(s => s.name === supplementTitle) || null;
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
    const leadingIcon = (
      <IconSymbol
        name="chevron.right"
        size={16}
        color={Colors.dark.icon}
        style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
      />
    );

    const headerActions = (
      <View style={styles.planHeaderActions}>
        <TouchableOpacity
          onPress={() => handleNotify(plan)}
          accessibilityRole="button"
          accessibilityLabel={t('plan.toggleNotifications', {
            defaultValue: 'Växla notiser',
          })}
          style={styles.planHeaderButton}
        >
          <IconSymbol
            name={plan.notify ? 'bell.fill' : 'bell.slash'}
            size={18}
            color={plan.notify ? Colors.dark.primary : Colors.dark.icon}
          />
        </TouchableOpacity>
      </View>
    );

    return (
      <SwipeableRow
        onEdit={() => handleEditPlan(plan)}
        onDelete={() => handleRemovePlan(plan.name)}
        containerStyle={styles.planRowContainer}
      >
        <AppBox
          title={displayTitle}
          headerRight={headerActions}
          style={styles.planBox}
          onPressHeader={() => togglePlanExpanded(planKey)}
          headerAccessibilityLabel={t('plan.toggleSupplements', {
            defaultValue: 'Visa eller dölj innehåll',
          })}
          leading={leadingIcon}
        >
          {isExpanded && (
            <View>
              {supplements.map(sup => renderSupplementItem(plan.name, sup))}
              {errorMessage && <Text style={styles.planErrorText}>{errorMessage}</Text>}
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
      </SwipeableRow>
    );
  };

  const renderSupplementPlans = () => {
    if (!supplementPlans.length) {
      return (
        <ThemedText type="default" style={styles.placeholderText}>
          {t('plan.noSupplementSlots', {
            defaultValue: 'Inga tider skapade ännu.',
          })}
        </ThemedText>
      );
    }

    return supplementPlans.map(plan => <View key={`${plan.name}-${plan.prefferedTime}`}>{renderPlanRow(plan)}</View>);
  };

  const renderSupplementItem = (planName: string, suppItem: Supplement) => (
    <SupplementItem
      key={`${planName}-${suppItem.name}`}
      planName={planName}
      supplement={suppItem}
      onRemoveSupplement={handleRemoveSupplement}
      onEditSupplement={handleEditSupplement}
    />
  );

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return isoDate;
    }

    return date.toLocaleDateString();
  };

  const renderTrainingGoals = () => {
    if (!trainingPlanGoals.length) {
      return (
        <ThemedText type="default" style={styles.placeholderText}>
          {t('plan.noActiveTraining')}
        </ThemedText>
      );
    }

    return trainingPlanGoals.map(goal => {
      const tipTitle = goal.tipId ? t(`tips:${goal.tipId}.title`, { defaultValue: goal.tipId }) : null;
      const trainingSettingsKey = goal.tipId ?? goal.mainGoalId;
      const userSettings = trainingPlanSettings[trainingSettingsKey] ?? {};
      const trainingBadges: Array<{
        key: string;
        label: string;
        icon: 'calendar' | 'clock';
      }> = [];

      if (typeof userSettings.sessionsPerWeek === 'number' && !Number.isNaN(userSettings.sessionsPerWeek)) {
        trainingBadges.push({
          key: `${trainingSettingsKey}-sessions`,
          label: t('plan.trainingSessionsPerWeek', {
            count: userSettings.sessionsPerWeek,
            defaultValue: `${userSettings.sessionsPerWeek} pass/vecka`,
          }),
          icon: 'calendar',
        });
      }

      if (
        typeof userSettings.sessionDurationMinutes === 'number' &&
        !Number.isNaN(userSettings.sessionDurationMinutes)
      ) {
        trainingBadges.push({
          key: `${trainingSettingsKey}-duration`,
          label: t('plan.trainingDurationMinutes', {
            minutes: userSettings.sessionDurationMinutes,
            defaultValue: `${userSettings.sessionDurationMinutes} min`,
          }),
          icon: 'clock',
        });
      }

      const editLabel = t('plan.editTrainingSettings', {
        defaultValue: 'Redigera',
      });

      const editAction = (
        <TouchableOpacity
          onPress={() => openTrainingSettingsModal(trainingSettingsKey, tipTitle ?? goal.mainGoalId)}
          accessibilityRole="button"
          accessibilityLabel={editLabel}
          style={styles.trainingEditIcon}
        >
          <IconSymbol name="pencil" size={16} color={Colors.dark.icon} />
        </TouchableOpacity>
      );

      return (
        <AppBox
          key={`${goal.mainGoalId}-${goal.tipId}`}
          title={tipTitle ?? goal.mainGoalId}
          headerRight={editAction}
          style={styles.trainingBox}
        >
          <ThemedText type="default" style={styles.trainingMeta}>
            {t('plan.trainingActiveSince', {
              date: formatDate(goal.startedAt),
            })}
          </ThemedText>
          <View style={styles.trainingSettingsContainer}>
            {trainingBadges.length ? (
              <View style={styles.trainingBadgesRow}>
                {trainingBadges.map(({ key, label, icon }) => (
                  <Badge key={key} variant="overlay" style={styles.trainingBadge}>
                    <IconSymbol name={icon} size={14} color={Colors.dark.icon} style={styles.trainingBadgeIcon} />
                    <ThemedText type="caption" style={styles.trainingBadgeLabel}>
                      {label}
                    </ThemedText>
                  </Badge>
                ))}
              </View>
            ) : (
              <ThemedText type="default" style={styles.trainingSettingsText}>
                {t('plan.trainingSettingsUnset', {
                  defaultValue: 'Inga inställningar sparade',
                })}
              </ThemedText>
            )}
          </View>
        </AppBox>
      );
    });
  };

  const renderNutritionGoals = () => {
    if (!nutritionGroups.length) {
      return null;
    }

    return nutritionGroups.map(({ tipId }) => {
      const tip = tips.find(candidate => candidate.id === tipId);
      const tipTitle = t(`tips:${tipId}.title`, {
        defaultValue: tip?.title ?? tipId,
      });
      const recommendedDoseLabel = getRecommendedDoseLabel(tip);
      const foodItems = (tip?.nutritionFoods ?? []).map(food => {
        const itemKey = food.key;
        const detailKey = food.detailsKey ?? itemKey;
        const name = t(`tips:${tipId}.nutritionFoods.items.${itemKey}.name`, {
          defaultValue: itemKey,
        });
        const details = t(`tips:${tipId}.nutritionFoods.items.${detailKey}.details`, {
          defaultValue: '',
        });
        return {
          key: `${tipId}-${itemKey}-${detailKey}`,
          name,
          details,
        };
      });
      const maxVisibleFoods = 2;
      const isExpanded = !!expandedNutritionTips[tipId];
      const visibleFoodItems = isExpanded ? foodItems : foodItems.slice(0, maxVisibleFoods);
      const hiddenCount = Math.max(foodItems.length - maxVisibleFoods, 0);
      const hasExtraFoods = hiddenCount > 0;
      const arrowRotation = isExpanded ? '90deg' : '0deg';

      return (
        <AppBox key={tipId} title={tipTitle} style={styles.nutritionBox}>
          {recommendedDoseLabel && (
            <ThemedText type="default" style={styles.recommendedDose}>
              {recommendedDoseLabel}
            </ThemedText>
          )}
          {!!foodItems.length && (
            <View style={styles.badgeRow}>
              {visibleFoodItems.map(({ key, name, details }) => (
                <Badge key={`food-${key}`} variant="overlay">
                  <ThemedText type="defaultSemiBold" style={styles.badgeLabel}>
                    {name}
                  </ThemedText>
                  {!!details && isExpanded && (
                    <ThemedText type="default" style={styles.badgeDetail}>
                      {details}
                    </ThemedText>
                  )}
                </Badge>
              ))}
              {hasExtraFoods && (
                <Badge
                  key={`toggle-${tipId}`}
                  variant="overlay"
                  style={styles.toggleBadge}
                  onPress={() => toggleNutritionFoods(tipId)}
                >
                  <ThemedText type="default" style={styles.badgeLabel}>
                    {isExpanded
                      ? t('plan.hideNutritionFoods', {
                          defaultValue: 'Visa färre',
                        })
                      : t('plan.showMoreNutritionFoods', {
                          count: hiddenCount,
                          defaultValue: `${hiddenCount}st`,
                        })}
                  </ThemedText>
                  <IconSymbol
                    name="chevron.right"
                    size={18}
                    color={badgeIconColor}
                    style={[styles.toggleBadgeIcon, { transform: [{ rotate: arrowRotation }] }]}
                  />
                </Badge>
              )}
            </View>
          )}
        </AppBox>
      );
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionsContainer}>
          <View style={styles.sectionBlock}>
            <Collapsible title={t('plan.trainingHeader')} contentStyle={styles.collapsibleContentFlush}>
              {renderTrainingGoals()}
            </Collapsible>
          </View>
          <View style={styles.sectionBlock}>
            <Collapsible title={t('plan.nutritionHeader')} contentStyle={styles.collapsibleContentFlush}>
              {renderNutritionGoals()}
            </Collapsible>
          </View>
          <View style={styles.sectionBlock}>
            <Collapsible title={t('plan.supplementSectionTitle')} contentStyle={styles.collapsibleContentFlush}>
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
        </View>
      </ScrollView>
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
        />
        <TrainingSettingsModal
          visible={trainingSettingsVisible}
          title={t('plan.trainingSettingsTitle', { defaultValue: 'Träningsinställningar' })}
          trainingTitle={trainingSettingsTitle}
          sessionsPlaceholder={t('plan.trainingSessionsPlaceholder', {
            defaultValue: 'Pass per vecka',
          })}
          durationPlaceholder={t('plan.trainingDurationPlaceholder', {
            defaultValue: 'Minuter per pass',
          })}
          sessionsLabel={t('plan.trainingSessionsPlaceholder', {
            defaultValue: 'Pass per vecka',
          })}
          durationLabel={t('plan.trainingDurationPlaceholder', {
            defaultValue: 'Minuter per pass',
          })}
          sessionsValue={trainingSessionsInput}
          durationValue={trainingDurationInput}
          onChangeSessions={setTrainingSessionsInput}
          onChangeDuration={setTrainingDurationInput}
          onSave={handleSaveTrainingSettings}
          onClose={closeTrainingSettingsModal}
          saveLabel={t('general.save')}
          cancelLabel={t('general.cancel')}
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
            preselectedSupplement={supplement}
            onSave={savedSupplement => {
              saveSupplementToPlan(planForSupplementEdit, savedSupplement, isEditingSupplement);
              setSupplement(null);
              setPlanForSupplementEdit(null);
            }}
            onCancel={() => {
              setPlanForSupplementEdit(null);
              setSupplement(null);
            }}
          />
        </ThemedModal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingTop: 140,
  },
  sectionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  collapsibleContentFlush: {
    marginLeft: 0,
  },
  trainingBox: {
    marginBottom: 20,
  },
  nutritionBox: {
    marginBottom: 20,
  },
  planRowContainer: {
    width: '100%',
    paddingHorizontal: 0,
  },
  modalField: {
    marginBottom: 16,
  },
  planBox: {
    marginBottom: 20,
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
  timePickerText: {
    fontSize: 16,
    color: Colors.dark.text,
    padding: 10,
  },
  timePickerButton: {
    backgroundColor: colors.secondary,
    padding: 10,
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    height: 'auto',
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  trainingTip: {
    marginTop: 4,
  },
  trainingMeta: {
    marginTop: 2,
    color: Colors.dark.textMuted,
  },
  trainingSettingsContainer: {
    marginTop: 12,
  },
  trainingBadgesContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  trainingBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  trainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  trainingBadgeIcon: {
    marginRight: 6,
  },
  trainingBadgeLabel: {
    color: Colors.dark.text,
    fontSize: 12,
  },
  trainingSettingsText: {
    flex: 1,
    color: Colors.dark.textLight,
  },
  trainingEditIcon: {
    padding: 6,
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
  planErrorText: {
    color: Colors.dark.error,
    marginTop: 10,
  },
  placeholderText: {
    color: Colors.dark.textMuted,
  },
  recommendedDose: {
    color: Colors.dark.textLight,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  badgeLabel: {
    color: Colors.dark.text,
  },
  badgeDetail: {
    color: Colors.dark.textLight,
    marginTop: 4,
  },
  toggleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBadgeIcon: {
    marginLeft: 6,
  },
});
