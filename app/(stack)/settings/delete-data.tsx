import { useTheme } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { clearChat } from '@/app/context/chatEvents';
import { getHealthSettingsStorageSize, getKnowledgeSettingsStorageSize, getSharingStorageSize } from '@/app/context/storage/app/appStorage';
import { getDrinkStorageSize } from '@/app/context/storage/drinks/drinkStorage';
import { getHabitStorageSize } from '@/app/context/storage/habits/habitStorage';
import { getMetricStorageSize } from '@/app/context/storage/metrics/metricStorage';
import { getNutritionStorageSize } from '@/app/context/storage/nutrition/nutritionStorage';
import { getPlanStorageSize } from '@/app/context/storage/plans/planStorage';
import { PlansByCategory } from '@/app/context/storage/plans/planTypes';
import { getSupplementCustomStorageSize, getSupplementTakenDatesStorageSize } from '@/app/context/storage/supplements/supplementStorage';
import { getTrainingStorageSize } from '@/app/context/storage/training/trainingStorage';
import { getUserProfileStorageSize } from '@/app/context/storage/userProfile/userProfileStorage';
import { clearUserProfile } from '@/app/context/storage/userProfile/userProfileStore';
import { getKnowledgeXpStorageSize, getNutritionXpStorageSize } from '@/app/context/storage/xp/xpStorage';
import { useStorage } from '@/app/context/StorageContext';
import { type Supplement } from '@/app/domain/Supplement';
import { type SupplementPlanEntry } from '@/app/domain/SupplementPlanEntry';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { Checkbox } from '@/components/ui/Checkbox';
import Container from '@/components/ui/Container';
import InfoNotice from '@/components/ui/InfoNotice';
import Notice from '@/components/ui/Notice';
import SettingIcon from '@/components/ui/SettingIcon';

const DELETE_OPTION_KEYS = {
  plans: 'plans',
  supplements: 'supplements',
  healthData: 'healthData',
  logs: 'logs',
  knowledge: 'knowledge',
  personal: 'personal',
  sharing: 'sharing',
} as const;

export const pruneCustomSupplementReferences = (plans: PlansByCategory, customSupplements: Supplement[]): PlansByCategory => {
  const customSupplementIds = new Set(customSupplements.map(item => item.id));

  return {
    ...plans,
    supplements: plans.supplements.map(plan => ({
      ...plan,
      supplements: plan.supplements.filter((entry: SupplementPlanEntry) => {
        const isCustomSupplement = customSupplementIds.has(entry.supplement.id) || Boolean(entry.supplement.components);

        return !isCustomSupplement;
      }),
    })),
  };
};

export const formatStorageSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
};

export default function DeleteDataPage() {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const router = useRouter();
  const {
    customSupplements,
    setPlans,
    clearArchivedPlans,
    setHasVisitedChat,
    setMyAreas,
    clearMetricEntries,
    clearDailyNutritionTracking,
    setWeeklyNutritionTracking,
    setTrainingPlanSettings,
    clearDailyTrainingTracking,
    clearDailyHabitTracking,
    clearDailyDrinkTracking,
    setViewedTips,
    setShareHealthPlan,
    clearSupplementTakenDates,
    clearSupplementCustom,
    clearNutritionXP,
    clearEducationXP,
    setHealthSyncEnabled,
    setHasCompletedOnboarding,
    setOnboardingStep,
  } = useStorage();

  const [selected, setSelected] = React.useState<Record<string, boolean>>({
    [DELETE_OPTION_KEYS.plans]: false,
    [DELETE_OPTION_KEYS.supplements]: false,
    [DELETE_OPTION_KEYS.healthData]: false,
    [DELETE_OPTION_KEYS.logs]: false,
    [DELETE_OPTION_KEYS.knowledge]: false,
    [DELETE_OPTION_KEYS.personal]: false,
    [DELETE_OPTION_KEYS.sharing]: false,
  });
  const [showDeletionConfirmation, setShowDeletionConfirmation] = React.useState(false);

  type DeleteOptionKey = (typeof DELETE_OPTION_KEYS)[keyof typeof DELETE_OPTION_KEYS];

  const [storageSizes, setStorageSizes] = React.useState<Record<DeleteOptionKey, number>>({
    plans: 0,
    supplements: 0,
    healthData: 0,
    logs: 0,
    knowledge: 0,
    personal: 0,
    sharing: 0,
  });

  React.useEffect(() => {
    const loadStorageSizes = async () => {
      const [
        plans,
        supplementsCustom,
        supplementsTakenDates,
        metrics,
        healthSettings,
        training,
        habits,
        nutrition,
        drinks,
        nutritionXp,
        knowledgeSettings,
        knowledgeXp,
        personal,
        sharing,
      ] = await Promise.all([
        getPlanStorageSize(),
        getSupplementCustomStorageSize(),
        getSupplementTakenDatesStorageSize(),
        getMetricStorageSize(),
        getHealthSettingsStorageSize(),
        getTrainingStorageSize(),
        getHabitStorageSize(),
        getNutritionStorageSize(),
        getDrinkStorageSize(),
        getNutritionXpStorageSize(),
        getKnowledgeSettingsStorageSize(),
        getKnowledgeXpStorageSize(),
        getUserProfileStorageSize(),
        getSharingStorageSize(),
      ]);

      setStorageSizes({
        plans,
        supplements: supplementsCustom,
        healthData: metrics + healthSettings,
        logs: training + habits + nutrition + drinks + nutritionXp + supplementsTakenDates,
        knowledge: knowledgeSettings + knowledgeXp,
        personal,
        sharing,
      });
    };

    loadStorageSizes().catch(error => {
      console.error('Failed to load storage sizes', error);
    });
  }, []);

  const toggleOption = (key: string) => {
    setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allSelected = Object.values(selected).every(Boolean);

  const selectAll = () => {
    if (allSelected) {
      setSelected({
        [DELETE_OPTION_KEYS.plans]: false,
        [DELETE_OPTION_KEYS.supplements]: false,
        [DELETE_OPTION_KEYS.healthData]: false,
        [DELETE_OPTION_KEYS.logs]: false,
        [DELETE_OPTION_KEYS.knowledge]: false,
        [DELETE_OPTION_KEYS.personal]: false,
        [DELETE_OPTION_KEYS.sharing]: false,
      });
      return;
    }

    setSelected({
      [DELETE_OPTION_KEYS.plans]: true,
      [DELETE_OPTION_KEYS.supplements]: true,
      [DELETE_OPTION_KEYS.healthData]: true,
      [DELETE_OPTION_KEYS.logs]: true,
      [DELETE_OPTION_KEYS.knowledge]: true,
      [DELETE_OPTION_KEYS.personal]: true,
      [DELETE_OPTION_KEYS.sharing]: true,
    });
  };

  const hasSelected = Object.values(selected).some(Boolean);

  const deleteSelectedData = React.useCallback(async () => {
    if (selected.plans) {
      setPlans({
        supplements: [],
        training: [],
        nutrition: [],
        other: [],
        reasonSummary: { text: '', createdAt: '' },
      });

      setShareHealthPlan(false);
      await clearArchivedPlans();
      setTrainingPlanSettings({});
    } else if (selected.supplements) {
      setPlans(current => pruneCustomSupplementReferences(current, customSupplements));
    }

    if (selected.supplements) {
      clearSupplementCustom();
    }

    if (selected.healthData) {
      clearMetricEntries();
      setHealthSyncEnabled(false);
    }

    if (selected.logs) {
      clearDailyTrainingTracking();
      clearDailyHabitTracking();
      setWeeklyNutritionTracking({});
      clearDailyNutritionTracking();
      clearDailyDrinkTracking();
      clearSupplementTakenDates();

      clearNutritionXP();
    }

    if (selected.knowledge) {
      setMyAreas([]);
      setViewedTips([]);
      setHasVisitedChat(false);
      clearEducationXP();
    }

    if (selected.personal) {
      await clearUserProfile();
    }

    if (selected.sharing) {
      setHasVisitedChat(false);
      setShareHealthPlan(false);
      await clearChat();
    }
  }, [
    clearArchivedPlans,
    clearEducationXP,
    clearNutritionXP,
    customSupplements,
    selected,
    clearSupplementCustom,
    clearDailyHabitTracking,
    setHasVisitedChat,
    setHealthSyncEnabled,
    clearMetricEntries,
    setMyAreas,
    setPlans,
    setShareHealthPlan,
    clearSupplementTakenDates,
    clearDailyNutritionTracking,
    clearDailyTrainingTracking,
    clearDailyDrinkTracking,
    setTrainingPlanSettings,
    setViewedTips,
    setWeeklyNutritionTracking,
  ]);

  const handleDelete = () => {
    if (!hasSelected) {
      return;
    }

    Alert.alert(t('privacy.deleteData.confirmTitle'), t('privacy.deleteData.confirmMessage'), [
      { text: t('general.cancel'), style: 'cancel' },
      {
        text: t('privacy.deleteData.removeSelected'),
        style: 'destructive',
        onPress: async () => {
          const hasBiometricHardware = await LocalAuthentication.hasHardwareAsync();
          const isBiometricEnrolled = await LocalAuthentication.isEnrolledAsync();

          if (!hasBiometricHardware || !isBiometricEnrolled) {
            Alert.alert(t('privacy.deleteData.biometricUnavailableTitle'), t('privacy.deleteData.biometricUnavailableMessage'));
            return;
          }

          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: t('privacy.deleteData.biometricPrompt'),
            cancelLabel: t('general.cancel'),
            fallbackLabel: t('general.cancel'),
          });

          if (!result.success) {
            return;
          }

          try {
            await deleteSelectedData();
          } catch (error) {
            console.error('Failed to delete selected data', error);
            Alert.alert(t('privacy.deleteData.errorTitle'), t('privacy.deleteData.errorMessage'));
            return;
          }

          if (allSelected) {
            setHasCompletedOnboarding(false);
            setOnboardingStep(0);
            router.replace('/(onboarding)/onboardingwelcome');
            return;
          }

          setShowDeletionConfirmation(true);
        },
      },
    ]);
  };

  const options = [
    {
      key: DELETE_OPTION_KEYS.plans,
      label: t('privacy.deleteData.plans'),
      description: t('privacy.deleteData.plansDescription'),
      iconName: 'checklist',
    },
    {
      key: DELETE_OPTION_KEYS.supplements,
      label: t('privacy.deleteData.supplements'),
      description: t('privacy.deleteData.supplementsDescription'),
      iconName: 'pill',
    },
    {
      key: DELETE_OPTION_KEYS.healthData,
      label: t('privacy.deleteData.healthData'),
      description: t('privacy.deleteData.healthDataDescription'),
      iconName: 'heart',
    },
    {
      key: DELETE_OPTION_KEYS.logs,
      label: t('privacy.deleteData.logs'),
      description: t('privacy.deleteData.logsDescription'),
      iconName: 'calendar',
    },
    {
      key: DELETE_OPTION_KEYS.knowledge,
      label: t('privacy.deleteData.knowledge'),
      description: t('privacy.deleteData.knowledgeDescription'),
      iconName: 'lightbulb',
    },
    {
      key: DELETE_OPTION_KEYS.personal,
      label: t('privacy.deleteData.personal'),
      description: t('privacy.deleteData.personalDescription'),
      iconName: 'person',
    },
    {
      key: DELETE_OPTION_KEYS.sharing,
      label: t('privacy.deleteData.sharing'),
      description: t('privacy.deleteData.sharingDescription'),
      iconName: 'privacy',
    },
  ] as const;

  return (
    <Container background="default" showBackButton>
      <View style={styles.headerRow}>
        <ThemedText type="title2">{t('privacy.deleteData.title')}</ThemedText>
      </View>

      <ThemedText type="label" style={styles.sectionTitle} uppercase>
        {t('privacy.deleteData.subtitle')}
      </ThemedText>
      <View style={[styles.list, { borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={selectAll}
          style={[
            styles.optionRow,
            styles.selectAllCard,
            {
              borderColor: colors.border,
              backgroundColor: colors.cardBackground,
            },
          ]}
        >
          <View style={styles.selectAllRow}>
            <Checkbox checked={allSelected} onPress={selectAll} style={styles.selectAllCheckbox} />
            <ThemedText type="defaultSemiBold">{t('privacy.deleteData.selectAll')}</ThemedText>
          </View>
        </TouchableOpacity>
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.key}
            onPress={() => toggleOption(option.key)}
            style={[
              styles.optionRow,
              index === options.length - 1 ? styles.optionRowLast : styles.optionRowMiddle,
              {
                borderBottomColor: colors.border,
                borderColor: colors.border,
                backgroundColor: colors.cardBackground,
              },
            ]}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionLeft}>
                <Checkbox checked={!!selected[option.key]} onPress={() => toggleOption(option.key)} style={styles.optionCheckbox} />
                <SettingIcon size={36} iconName={option.iconName} />
                <View style={styles.optionText}>
                  <ThemedText type="defaultSemiBold" style={styles.optionLabel}>
                    {option.label}
                  </ThemedText>
                  <ThemedText type="caption" style={styles.optionDescription}>
                    {option.description}
                    {' · '}
                    {formatStorageSize(storageSizes[option.key] ?? 0)}
                  </ThemedText>
                </View>
              </View>
              {(option.key === DELETE_OPTION_KEYS.logs || option.key === DELETE_OPTION_KEYS.knowledge) && (
                <View style={styles.infoNoticeWrapper}>
                  <InfoNotice
                    message={t(option.key === DELETE_OPTION_KEYS.logs ? 'privacy.deleteData.logsXpNotice' : 'privacy.deleteData.knowledgeXpNotice')}
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <ThemedText type="caption" style={styles.helper}>
        {t('privacy.deleteData.helper', { count: Object.values(selected).filter(Boolean).length })}
      </ThemedText>

      <AppButton
        title={t('privacy.deleteData.removeSelected')}
        onPress={handleDelete}
        disabled={!hasSelected}
        style={[styles.deleteButton, !hasSelected && styles.deleteButtonDisabled]}
        variant="danger"
      />

      {showDeletionConfirmation && (
        <Notice
          title="Data raderad"
          variant="success"
          message="Vald data har tagits bort"
          onDismiss={() => setShowDeletionConfirmation(false)}
          dismissAccessibilityLabel="Dölj bekräftelse"
        />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginTop: 8,
    marginLeft: 16,
    fontWeight: '700',
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectAllCheckbox: {
    marginTop: 0,
  },
  list: {
    gap: 0,
    borderRadius: 0,
    borderWidth: 0,
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 0,
    marginVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  selectAllCard: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  optionRowMiddle: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  optionRowLast: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  optionContent: {
    flex: 1,
  },
  infoNoticeWrapper: {
    marginLeft: 34,
  },
  optionCheckbox: {
    marginTop: 0,
  },
  optionLabel: {
    flexShrink: 1,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionDescription: {
    opacity: 0.7,
    flexShrink: 1,
  },
  chevron: {
    marginLeft: 12,
    opacity: 0.6,
  },
  helper: {
    marginTop: 16,
    opacity: 0.7,
  },
  deleteButton: {
    marginTop: 20,
  },
  deleteButtonDisabled: {
    opacity: 0.45,
  },
  deleteButtonText: {
    color: '#fff',
  },
});
