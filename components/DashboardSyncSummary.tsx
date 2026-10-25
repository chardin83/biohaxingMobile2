import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { EMPTY_PLANS } from '@/app/context/storage/plans/planTypes';
import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import { CloseButton } from '@/components/ui/CloseButton';
import { CountdownCircle } from '@/components/ui/CountdownCircle';
import type { IconSymbolName } from '@/components/ui/icon-symbol-map';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ONBOARDING_FINISH_STEPS } from '@/constants/onboarding';
import { getPlannedGoalCategories, type GoalCategory } from '@/services/targetProgress/plannedGoalCategories';
import { toDateKey } from '@/utils/dateUtils';
import { getPendingNutritionSetupTipId } from '@/utils/pendingNutritionSetup';
import { useWearable } from '@/wearables/wearableProvider';

function useDashboardSummary() {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const { automaticHabitSummary, plans, onboardingStep, setOnboardingStep, hideHealthSyncPrompt, dailyNutritionTracking, userProfile } = useStorage();
  const { syncError } = useWearable();
  const [dismissed, setDismissed] = React.useState(false);
  const [welcomeStep, setWelcomeStep] = React.useState<number | null>(null);
  const pendingWelcome = onboardingStep === ONBOARDING_FINISH_STEPS.withAI || onboardingStep === ONBOARDING_FINISH_STEPS.withoutAI;
  React.useEffect(() => {
    if (pendingWelcome && welcomeStep === null) {
      setWelcomeStep(onboardingStep);
      setOnboardingStep(ONBOARDING_FINISH_STEPS.welcomeDismissed);
    }
  }, [pendingWelcome, welcomeStep, onboardingStep, setOnboardingStep]);
  const hasOnboardingWelcome = welcomeStep !== null || pendingWelcome;
  const hasAIPlan = (welcomeStep ?? onboardingStep) === ONBOARDING_FINISH_STEPS.withAI;
  const showOnboardingWelcome = hasOnboardingWelcome;
  const dismiss = () => {
    setDismissed(true);
    if (hasOnboardingWelcome) setOnboardingStep(ONBOARDING_FINISH_STEPS.welcomeDismissed);
  };
  const showFirstMeal = !Object.values(dailyNutritionTracking ?? {}).some(day => day.entries.some(entry => entry.type !== 'drink'));
  const isPending = !automaticHabitSummary?.isReady;
  const plannedCategories = React.useMemo(() => getPlannedGoalCategories(plans ?? EMPTY_PLANS), [plans]);
  const hasProgress = !isPending && !syncError && (automaticHabitSummary?.newGoalsCount ?? 0) > 0;
  const isWelcome = !isPending && !syncError && !hasProgress && plannedCategories.size === 0;
  const isUpToDate = !isPending && !syncError && !isWelcome && (automaticHabitSummary?.newGoalsCount ?? 0) === 0;
  const pendingSetupTipId = React.useMemo(() => getPendingNutritionSetupTipId((plans ?? EMPTY_PLANS).nutrition, userProfile), [plans, userProfile]);
  React.useEffect(() => {
    if (pendingSetupTipId) setDismissed(false);
  }, [pendingSetupTipId]);
  const suggestions = getSummaryActions(showFirstMeal, hideHealthSyncPrompt, plannedCategories, pendingSetupTipId);
  const actions = hasProgress ? suggestions.filter(action => action === 'setup') : suggestions;
  const { accent, text: foreground, background: cardBackground, border: cardBorder, iconBackground } = colors.dashboardSync;
  const { titleKey, descriptionKey, headingIcon } = getSummaryHeading(isPending, !!syncError, isWelcome, isUpToDate);
  const title = t(titleKey);
  return {
    t,
    actions,
    pendingSetupTipId,
    dismissed,
    dismiss,
    setDismissed,
    showOnboardingWelcome,
    hasAIPlan,
    showFirstMeal,
    setOnboardingStep,
    hideHealthSyncPrompt,
    isPending,
    hasProgress,
    isWelcome,
    isUpToDate,
    automaticHabitSummary,
    syncError,
    title,
    descriptionKey,
    headingIcon,
    accent,
    foreground,
    cardBackground,
    cardBorder,
    iconBackground,
  };
}

type SummaryActionKey = 'setup' | 'meal' | 'health' | GoalCategory | 'manual';

function getSummaryActions(
  showFirstMeal: boolean,
  hideHealthSyncPrompt: boolean,
  plannedCategories: ReadonlySet<GoalCategory>,
  pendingSetupTipId?: string
): SummaryActionKey[] {
  const actions: SummaryActionKey[] = [];
  if (pendingSetupTipId) actions.push('setup');
  if (showFirstMeal) actions.push('meal');
  if (!hideHealthSyncPrompt) actions.push('health');
  for (const category of ['nutrition', 'other', 'training'] as const) {
    if (!plannedCategories.has(category)) actions.push(category);
  }
  if (actions.length === 0) actions.push('manual');
  return actions.slice(0, 2);
}

type SummaryState = ReturnType<typeof useDashboardSummary>;

export function DashboardSyncSummary() {
  const state = useDashboardSummary();
  if (state.dismissed) return null;
  if (state.showOnboardingWelcome && !state.hasProgress) return <OnboardingSummary state={state} />;
  return <SyncSummary state={state} />;
}

function OnboardingSummary({ state }: Readonly<{ state: SummaryState }>) {
  const { t, hasAIPlan, cardBackground, cardBorder, iconBackground, accent, foreground, dismiss } = state;
  return (
    <View style={[styles.container, { backgroundColor: cardBackground, borderColor: cardBorder }]} testID="dashboard-sync-summary">
      <View style={styles.heading}>
        <View style={[styles.iconCircle, { backgroundColor: iconBackground }]}>
          <IconSymbol name="lotus" size={30} color={accent} />
        </View>
        <View style={styles.headingText}>
          <ThemedText style={[styles.title, { color: foreground }]}>{t('dashboard.sync.welcomeTitle')}</ThemedText>
          <ThemedText style={[styles.description, { color: foreground }]}>
            {t(hasAIPlan ? 'dashboard.sync.aiPlanReady' : 'dashboard.sync.welcomeDescription')}
          </ThemedText>
        </View>
        <CloseButton onPress={dismiss} color={accent} />
      </View>
      <SummaryCountdown state={state} />
      <SummaryActions actions={state.actions} pendingSetupTipId={state.pendingSetupTipId} />
    </View>
  );
}

function SyncSummary({ state }: Readonly<{ state: SummaryState }>) {
  const { cardBackground, cardBorder, iconBackground, accent, dismiss, isPending, headingIcon } = state;
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: cardBackground,
          borderColor: cardBorder,
        },
      ]}
      testID="dashboard-sync-summary"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.heading}>
        <View style={[styles.iconCircle, { backgroundColor: iconBackground }]}>
          {isPending ? <ActivityIndicator color={accent} testID="dashboard-sync-spinner" /> : <IconSymbol name={headingIcon} size={30} color={accent} />}
        </View>
        <View style={styles.headingText}>
          <SummaryInformation state={state} />
        </View>
        <CloseButton onPress={dismiss} color={accent} />
      </View>

      <SummaryCountdown state={state} />
      <SummaryActions actions={state.actions} pendingSetupTipId={state.pendingSetupTipId} />
    </View>
  );
}

function SummaryInformation({ state }: Readonly<{ state: SummaryState }>) {
  const { t, title, descriptionKey, foreground, hasProgress, automaticHabitSummary } = state;
  const router = useRouter();
  const countText = t('dashboard.sync.newHabitGoals', { count: automaticHabitSummary?.newGoalsCount ?? 0 });
  const description = hasProgress ? `${t(descriptionKey)} ${countText}` : t(descriptionKey);
  const content = (
    <>
      <ThemedText selectable={!hasProgress} style={[styles.title, { color: foreground }]}>
        {title}
      </ThemedText>
      <ThemedText selectable={!hasProgress} style={[styles.description, { color: foreground }]}>
        {description}
      </ThemedText>
    </>
  );
  if (!hasProgress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      accessibilityHint={t('dashboard.sync.openProgressHint')}
      onPress={() => router.push('/(stack)/journal/habits/progress')}
      style={styles.progressInformation}
    >
      {content}
    </Pressable>
  );
}

function SummaryActions({ actions, pendingSetupTipId }: Readonly<{ actions: SummaryActionKey[]; pendingSetupTipId?: string }>) {
  return (
    <>
      {actions.map(action => (
        <DashboardAction key={action} action={action} pendingSetupTipId={pendingSetupTipId} />
      ))}
    </>
  );
}

function DashboardAction({ action, pendingSetupTipId }: Readonly<{ action: SummaryActionKey; pendingSetupTipId?: string }>) {
  const { t } = useTranslation('common');
  const router = useRouter();
  if (action === 'setup') {
    if (!pendingSetupTipId) return null;
    return (
      <SummaryAction
        icon="settings"
        title={t('dashboard.sync.completeSetupTitle')}
        description={t('dashboard.sync.completeSetupDescription')}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/journal',
            params: {
              selectedDate: toDateKey(new Date()),
              openTab: 'meal',
              focusTipId: pendingSetupTipId,
              focusRequestId: String(Date.now()),
            },
          })
        }
      />
    );
  }
  if (action === 'meal')
    return (
      <SummaryAction
        icon="meal"
        title={t('dashboard.sync.firstMealTitle')}
        onPress={() => router.push({ pathname: '/(tabs)/journal', params: { openTab: 'meal', selectedDate: toDateKey(new Date()) } })}
      />
    );
  if (action === 'health')
    return (
      <SummaryAction
        icon={Platform.OS === 'android' ? 'smartphone' : 'applelogo'}
        title={t(`dashboard.sync.connectHealth.${Platform.OS === 'android' ? 'android' : 'apple'}`)}
        description={t('dashboard.sync.connectHealth.description')}
        onPress={() => router.push('/(stack)/settings/health-sync')}
      />
    );
  if (action === 'manual')
    return (
      <SummaryAction
        icon="calendar"
        title={t('dashboard.sync.manualTitle')}
        description={t('dashboard.sync.manualDescription')}
        onPress={() => router.push('/(tabs)/journal')}
      />
    );
  return (
    <SummaryAction
      icon={categoryIcons[action]}
      title={t(`dashboard.sync.addGoal.${action}`)}
      onPress={() => router.push({ pathname: '/(tabs)/search', params: { planCategories: action, targetPeriods: 'daily,weekly', goalIntro: action } })}
    />
  );
}

function SummaryCountdown({ state }: Readonly<{ state: SummaryState }>) {
  if (state.isPending || state.syncError || state.hasProgress || state.actions[0] !== 'manual') return null;
  return (
    <View style={styles.countdown}>
      <CountdownCircle onComplete={() => state.setDismissed(true)} accessibilityLabel={state.t('dashboard.sync.closingCountdown')} />
    </View>
  );
}

function getSummaryHeading(isPending: boolean, hasError: boolean, isWelcome: boolean, isUpToDate: boolean) {
  let titleKey = 'dashboard.sync.progressTitle';
  if (isPending) titleKey = 'dashboard.sync.loadingTitle';
  else if (hasError) titleKey = 'dashboard.sync.errorTitle';
  else if (isWelcome) titleKey = 'dashboard.sync.getStartedTitle';
  else if (isUpToDate) titleKey = 'dashboard.sync.upToDateTitle';
  let descriptionKey = 'dashboard.sync.progressDescription';
  if (isPending) descriptionKey = 'dashboard.sync.loadingDescription';
  else if (hasError) descriptionKey = 'dashboard.sync.errorDescription';
  else if (isWelcome) descriptionKey = 'dashboard.sync.welcomeDescription';
  else if (isUpToDate) descriptionKey = 'dashboard.sync.upToDateDescription';
  let headingIcon: IconSymbolName = 'firework';
  if (isUpToDate) headingIcon = 'checkCircle';
  else if (isWelcome) headingIcon = 'lotus';
  return { titleKey, descriptionKey, headingIcon };
}

const categoryIcons = { training: 'trainingRunning', nutrition: 'carbs', other: 'lotus' } as const;

function SummaryAction({
  icon,
  title,
  description,
  onPress,
}: Readonly<{
  icon: IconSymbolName;
  title: string;
  description?: string;
  onPress: () => void;
}>) {
  const { colors } = useTheme();
  const palette = colors.dashboardSync;
  return (
    <Pressable
      testID="dashboard-summary-action"
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      onPress={onPress}
      style={[styles.manualLink, { borderColor: palette.innerBorder, backgroundColor: palette.linkBackground }]}
    >
      <View style={[styles.iconCircle, { backgroundColor: palette.iconBackground }]}>
        <IconSymbol name={icon} size={29} color={palette.accent} />
      </View>
      <View style={styles.manualText}>
        <ThemedText type="defaultSemiBold" style={{ color: palette.text }}>
          {title}
        </ThemedText>
        {description && <ThemedText style={[styles.manualDescription, { color: palette.text }]}>{description}</ThemedText>}
      </View>
      <IconSymbol name="chevron.right" size={20} color={palette.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: '90%', marginTop: 30, marginBottom: 12, padding: 13, borderWidth: 1.5, borderRadius: 16, gap: 14 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  countdown: { alignItems: 'center', paddingVertical: 4 },
  headingText: { flex: 1, gap: 4 },
  progressInformation: { gap: 4, minHeight: 44 },
  title: { fontSize: 21, lineHeight: 27, fontWeight: '700' },
  description: { fontSize: 14, lineHeight: 20 },
  iconCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  manualLink: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, borderWidth: 1 },
  manualText: { flex: 1, gap: 3 },
  manualDescription: { fontSize: 13, lineHeight: 19 },
});
