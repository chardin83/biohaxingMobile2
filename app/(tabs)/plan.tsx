import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Modal,
  TextInput,
  View,
  TouchableOpacity,
  Text,
  Platform,
  FlatList,
} from "react-native";
import { Collapsible } from "@/components/Collapsible";
import { ThemedText } from "@/components/ThemedText";
import { useTranslation } from "react-i18next";
import DateTimePicker from "@react-native-community/datetimepicker";
import { IconSymbol } from "@/components/ui/IconSymbol";
import SupplementItem from "@/components/SupplementItem";
import SupplementForm from "@/components/SupplementForm";
import { Portal } from "react-native-paper";
import { colors } from "../theme/styles";
import { useStorage } from "../context/StorageContext";
import { useSupplementSaver } from "@/hooks/useSupplementSaver";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import { ThemedModal } from "@/components/ThemedModal";
import { Supplement } from "../domain/Supplement";
import { Plan } from "../domain/Plan";
import AppButton from "@/components/ui/AppButton";
import Badge from "@/components/ui/Badge";
import { Colors } from "@/constants/Colors";
import { defaultPlans } from "@/locales/defaultPlans";
import { useLocalSearchParams } from "expo-router";
import { areas } from "@/locales/areas";
import { tips, Tip } from "@/locales/tips";
import { useSupplementMap } from "@/locales/supplements";
import { useColorScheme } from "@/hooks/useColorScheme";
// Removed unused CreatePlanModal import; using ThemedModal for create/edit

const PLAN_CATEGORY_BY_TIP_ID = new Map(
  tips
    .filter((tip) => tip.planCategory)
    .map((tip) => [tip.id, tip.planCategory!])
);

export default function Plans() {
  const params = useLocalSearchParams<{ openCreate?: string }>();
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanTime, setNewPlanTime] = useState(new Date());
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isEditingSupplement, setIsEditingSupplement] = useState(false);
  const [planForSupplementEdit, setPlanForSupplementEdit] =
    useState<Plan | null>(null);
  const [expandedNutritionTips, setExpandedNutritionTips] = useState<
    Record<string, boolean>
  >({});

  const { saveSupplementToPlan } = useSupplementSaver();

  const [supplement, setSupplement] = useState<Supplement | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === "ios");

  const { plans, setPlans, errorMessage, activeGoals } = useStorage();

  const { t } = useTranslation(["common", "areas", "tips"]);
  const supplementMap = useSupplementMap();
  const colorScheme = useColorScheme();
  const badgeIconColor =
    colorScheme === "light" ? Colors.light.icon : Colors.dark.icon;

  const resolvePlanCategory = (tipId?: string, goalCategory?: string) => {
    if (goalCategory === "training" || goalCategory === "nutrition") {
      return goalCategory;
    }
    if (tipId) {
      return PLAN_CATEGORY_BY_TIP_ID.get(tipId);
    }
    return undefined;
  };

  const trainingGoals = useMemo(
    () =>
      activeGoals.filter((goal) =>
        resolvePlanCategory(goal.tipId, goal.planCategory) === "training"
      ),
    [activeGoals]
  );

  const nutritionGoals = useMemo(
    () =>
      activeGoals.filter((goal) =>
        resolvePlanCategory(goal.tipId, goal.planCategory) === "nutrition"
      ),
    [activeGoals]
  );

  const getRecommendedDoseLabel = React.useCallback(
    (tip?: Tip) => {
      if (!tip?.supplements?.length) return null;
      for (const reference of tip.supplements) {
        if (!reference.id) continue;
        const supplement = supplementMap.get(reference.id);
        if (supplement?.quantity) {
          const unit = supplement.unit ? ` ${supplement.unit}` : "";
          const dose = `${supplement.quantity}${unit}`.trim();
          if (dose.length > 0) {
            return t("plan.recommendedDose", { dose });
          }
        }
      }
      return null;
    },
    [supplementMap, t]
  );

  const nutritionGroups = useMemo(() => {
    const tipIds = new Set<string>();

    nutritionGoals.forEach((goal) => {
      if (goal.tipId) {
        tipIds.add(goal.tipId);
      }
    });

    return Array.from(tipIds).map((tipId) => ({ tipId }));
  }, [nutritionGoals]);

  const toggleNutritionFoods = React.useCallback((tipId: string) => {
    setExpandedNutritionTips((prev) => ({
      ...prev,
      [tipId]: !prev[tipId],
    }));
  }, []);

  useEffect(() => {
    if (plans.length === 0) {
      const translatedDefaults = defaultPlans.map((plan) => ({
        name: t(`plan.defaultPlan.${plan.key}`),
        supplements: [],
        prefferedTime: plan.time,
        notify: false,
      }));
      setPlans(translatedDefaults);
    }
  }, [plans.length, setPlans, t]);

  // Öppna skapamodal om efterfrågat via route-param
  useEffect(() => {
    if (params.openCreate === "1") {
      setIsEditingPlan(false);
      setSelectedPlan(null);
      setModalVisible(true);
    }
  }, [params.openCreate]);

  const savePlans = (updatedPlans: Plan[]) => {
    setPlans(updatedPlans);
  };

  const handleSavePlan = () => {
    if (newPlanName.trim() === "") return;

    if (isEditingPlan && selectedPlan) {
      const updatedPlans = plans.map((plan) =>
        plan.name === selectedPlan.name
          ? {
              ...plan,
              name: newPlanName,
              prefferedTime: newPlanTime.toTimeString().slice(0, 5),
            }
          : plan
      );
      savePlans(updatedPlans);
    } else {
      // Adding a new plan
      const newPlan: Plan = {
        name: newPlanName.trim(),
        supplements: [],
        prefferedTime: newPlanTime.toTimeString().slice(0, 5),
        notify: false,
      };
      const updatedPlans = [...plans, newPlan];
      savePlans(updatedPlans);
    }

    // Close modal and reset state after saving
    setModalVisible(false);
    setIsEditingPlan(false);
    setSelectedPlan(null);
    setNewPlanName("");
    setNewPlanTime(new Date());
    setShowTimePicker(Platform.OS === "ios");
  };

  const handleRemovePlan = (planName: string) => {
    console.log("Removing plan:", planName);
    const updatedPlans = plans.filter((plan) => plan.name !== planName);
    savePlans(updatedPlans);
  };

  const handleRemoveSupplement = (planName: string, supplementName: string) => {
    const updatedPlans = plans.map((plan) =>
      plan.name === planName
        ? {
            ...plan,
            supplements: plan.supplements.filter(
              (sup) => sup.name !== supplementName
            ),
          }
        : plan
    );
    savePlans(updatedPlans);
  };

  const handleEditSupplement = (planName: string, supplementTitle: string) => {
    const plan = plans.find((p) => p.name === planName) || null;
    setPlanForSupplementEdit(plan);
    const sup = plan?.supplements.find((s) => s.name === supplementTitle) || null;
    setSupplement(sup || null);
    setIsEditingSupplement(true);
  };

  const timeStringToDate = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const now = new Date();
    now.setHours(hours, minutes, 0, 0);
    return now;
  };

  const handleEditPlan = (plan: Plan) => {
    setNewPlanName(plan.name);
    setNewPlanTime(timeStringToDate(plan.prefferedTime));
    setSelectedPlan(plan);
    setIsEditingPlan(true); // Enter edit mode
    setModalVisible(true); // Open the modal
  };

  const handleNotify = (plan: Plan) => {
    const updatedPlans = plans.map((p) =>
      p.name === plan.name ? { ...p, notify: !p.notify } : p
    );
    savePlans(updatedPlans);
  };

  const renderPlanItem = ({ item: plan }: { item: Plan }) => (
    <SwipeableRow
      onEdit={() => handleEditPlan(plan)}
      onDelete={() => handleRemovePlan(plan.name)}
      containerStyle={styles.collapsibleContainer}
    >
      <Collapsible
        title={`${plan.name} (${plan.prefferedTime})`}
        rightContent={
          <TouchableOpacity onPress={() => handleNotify(plan)}>
            <IconSymbol
              name={plan.notify ? "bell.fill" : "bell.slash"}
              size={20}
              color={plan.notify ? Colors.dark.primary : "gray"}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        }
      >
        {plan.supplements?.map((supplement) =>
          renderSupplementItem(plan.name, supplement)
        )}
        {errorMessage && (
          <Text style={{ color: Colors.dark.error, marginTop: 10 }}>
            {errorMessage}
          </Text>
        )}
        <View style={{ marginBottom: 10, marginTop: 15 }}>
          <AppButton
            title={t("plan.addSupplement")}
            onPress={() => {
              setIsEditingSupplement(false);
              setPlanForSupplementEdit(plan);
            }}
            variant="primary"
          />
        </View>
      </Collapsible>
    </SwipeableRow>
  );

  const renderSupplementItem = (planName: string, supplement: Supplement) => (
    <SupplementItem
      key={`${planName}-${supplement.name}`}
      planName={planName}
      supplement={supplement}
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
    if (!trainingGoals.length) {
      return (
        <ThemedText type="default" style={styles.placeholderText}>
          {t("plan.noActiveTraining")}
        </ThemedText>
      );
    }

    return trainingGoals.map((goal) => {
      const areaMeta = areas.find((area) => area.id === goal.mainGoalId);
      const areaTitle = areaMeta
        ? t(`areas:${areaMeta.id}.title`)
        : goal.mainGoalId;
      const tipTitle = goal.tipId
        ? t(`tips:${goal.tipId}.title`, { defaultValue: goal.tipId })
        : null;

      return (
        <View key={`${goal.mainGoalId}-${goal.tipId}`} style={styles.trainingItem}>
          <ThemedText type="defaultSemiBold">{areaTitle}</ThemedText>
          {!!tipTitle && (
            <ThemedText type="default" style={styles.trainingTip}>
              {tipTitle}
            </ThemedText>
          )}
          <ThemedText type="default" style={styles.trainingMeta}>
            {t("plan.trainingActiveSince", {
              date: formatDate(goal.startedAt),
            })}
          </ThemedText>
        </View>
      );
    });
  };

  const renderNutritionGoals = () => {
    if (!nutritionGroups.length) {
      return null;
    }

    return nutritionGroups.map(({ tipId }) => {
      const tip = tips.find((candidate) => candidate.id === tipId);
      const tipTitle = t(`tips:${tipId}.title`, {
        defaultValue: tip?.title ?? tipId,
      });
      const recommendedDoseLabel = getRecommendedDoseLabel(tip);
      const foodItems = (tip?.nutritionFoods ?? []).map((food) => {
        const itemKey = food.key;
        const detailKey = food.detailsKey ?? itemKey;
        const name = t(`tips:${tipId}.nutritionFoods.items.${itemKey}.name`, {
          defaultValue: itemKey,
        });
        const details = t(`tips:${tipId}.nutritionFoods.items.${detailKey}.details`, {
          defaultValue: "",
        });
        return {
          key: `${tipId}-${itemKey}-${detailKey}`,
          name,
          details,
        };
      });
      const maxVisibleFoods = 2;
      const isExpanded = !!expandedNutritionTips[tipId];
      const visibleFoodItems = isExpanded
        ? foodItems
        : foodItems.slice(0, maxVisibleFoods);
      const hiddenCount = Math.max(foodItems.length - maxVisibleFoods, 0);
      const hasExtraFoods = hiddenCount > 0;
      const arrowRotation = isExpanded ? "90deg" : "0deg";

      return (
        <View key={tipId} style={styles.nutritionTipBlock}>
          <ThemedText type="defaultSemiBold" style={styles.nutritionTipTitle}>
            {tipTitle}
          </ThemedText>
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
                      ? t("plan.hideNutritionFoods", {
                          defaultValue: "Visa färre",
                        })
                      : t("plan.showMoreNutritionFoods", {
                          count: hiddenCount,
                          defaultValue: `+${hiddenCount}`,
                        })}
                  </ThemedText>
                  <IconSymbol
                    name="chevron.right"
                    size={14}
                    color={badgeIconColor}
                    style={[
                      styles.toggleBadgeIcon,
                      { transform: [{ rotate: arrowRotation }] },
                    ]}
                  />
                </Badge>
              )}
            </View>
          )}
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={plans}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        renderItem={renderPlanItem}
        ListHeaderComponent={
          <View style={styles.sectionsContainer}>
            <View style={styles.sectionBlock}>
              <Collapsible title={t("plan.trainingHeader")}>
                {renderTrainingGoals()}
              </Collapsible>
            </View>
            <View style={styles.sectionBlock}>
              <Collapsible title={t("plan.nutritionHeader")}>
                {renderNutritionGoals()}
              </Collapsible>
            </View>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t("plan.supplementSectionTitle")}
            </ThemedText>
          </View>
        }
        ListFooterComponent={
          <View
            style={{
              marginTop: 20,
              marginBottom: 50,
              width: "80%",
              alignSelf: "center",
            }}
          >
            <AppButton
              title={t("plan.addTimeSlot")}
              onPress={() => {
                // Rensa allt för att garantera rätt modal visas
                setIsEditingPlan(false);
                setSelectedPlan(null);
                setPlanForSupplementEdit(null);
                setSupplement(null);
                setModalVisible(true);
              }}
              variant="primary"
            />
          </View>
        }
        contentContainerStyle={styles.flatListContent}
      />
      <Portal>
        <ThemedModal
          visible={modalVisible}
          title={isEditingPlan ? t("plan.editPlan") : t("plan.addTimeSlot")}
          onSave={handleSavePlan}
          onClose={() => setModalVisible(false)}
          okLabel={t("general.save")}
          cancelLabel={t("general.cancel")}
        >
          <TextInput
            style={styles.input}
            placeholder={t("plan.planName")}
            value={newPlanName}
            onChangeText={setNewPlanName}
          />

          {Platform.OS === "android" && (
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={styles.timePickerButton}
            >
              <Text style={styles.timePickerText}>
                {t("plan.prefferedTime")}:{" "}
                {newPlanTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>
          )}

          {Platform.OS === "ios" && (
            <Text style={styles.timePickerText}>{t("plan.prefferedTime")}</Text>
          )}

          {showTimePicker && (
            <DateTimePicker
              value={newPlanTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (event.type === "set" && selectedTime) {
                  setNewPlanTime(selectedTime);
                }
              }}
            />
          )}
        </ThemedModal>
      </Portal>

      {/* Modal för att lägga till supplement */}
      {planForSupplementEdit && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!planForSupplementEdit}
          onRequestClose={() => setPlanForSupplementEdit(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ThemedText type="default" style={{ marginBottom: 20 }}>
                {isEditingSupplement
                  ? `${t("plan.editSupplementFor")} ${
                      planForSupplementEdit.name
                    }`
                  : `${t("plan.addSupplementFor")} ${
                      planForSupplementEdit.name
                    }`}
              </ThemedText>

              <SupplementForm
                selectedTime={timeStringToDate(
                  planForSupplementEdit.prefferedTime || "00:00"
                )}
                isEditing={isEditingSupplement}
                preselectedSupplement={supplement}
                onSave={(savedSupplement) => {
                  saveSupplementToPlan(
                    planForSupplementEdit,
                    savedSupplement,
                    isEditingSupplement
                  );
                  setSupplement(null);
                  setPlanForSupplementEdit(null);
                }}
                onCancel={() => {
                  setPlanForSupplementEdit(null);
                  setSupplement(null);
                }}
              />
            </View>
          </View>
        </Modal>
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
  sectionBlock: {
    marginBottom: 18,
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 4,
  },
  flatListContent: {
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    height: "auto",
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.dark.border,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    width: "100%",
    color: Colors.dark.text,
  },
  trainingItem: {
    paddingVertical: 10,
    borderBottomColor: Colors.dark.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  trainingTip: {
    marginTop: 4,
  },
  trainingMeta: {
    marginTop: 2,
    color: Colors.dark.textMuted,
  },
  placeholderText: {
    color: Colors.dark.textMuted,
  },
  nutritionTipBlock: {
    paddingVertical: 12,
    borderBottomColor: Colors.dark.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nutritionTipTitle: {
    marginBottom: 4,
  },
  recommendedDose: {
    color: Colors.dark.textLight,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBadgeIcon: {
    marginLeft: 6,
  },
});
