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
import { getPlannedGoalCategories, GOAL_CATEGORIES } from '@/services/targetProgress/plannedGoalCategories';
import { useWearable } from '@/wearables/wearableProvider';

function useDashboardSummary() {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const router = useRouter();
  const { automaticHabitSummary, plans, onboardingStep, setOnboardingStep, healthSyncEnabled, hideHealthSyncPrompt, hasConnectedAppleHealth } = useStorage();
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
  const isPending = !automaticHabitSummary?.isReady;
  const plannedCategories = React.useMemo(() => getPlannedGoalCategories(plans ?? EMPTY_PLANS), [plans]);
  const hasSavedAIPlan =
    [...(plans?.training ?? []), ...(plans?.nutrition ?? []), ...(plans?.other ?? [])].some(entry => entry.createdBy === 'AI') ||
    (plans?.supplements ?? []).some(plan => plan.supplements.some(entry => entry.createdBy === 'AI'));
  const needsHealthSetup = hasSavedAIPlan && !healthSyncEnabled && !hideHealthSyncPrompt && !hasConnectedAppleHealth;
  const missingCategories = GOAL_CATEGORIES.filter(category => !plannedCategories.has(category));
  const isWelcome = !isPending && !syncError && plannedCategories.size === 0;
  const isUpToDate = !isPending && !syncError && !isWelcome && (automaticHabitSummary?.newGoalsCount ?? 0) === 0;
  const { accent, text: foreground, highlight, background: cardBackground, border: cardBorder, innerBorder, iconBackground } = colors.dashboardSync;
  const { titleKey, descriptionKey, headingIcon } = getSummaryHeading(isPending, !!syncError, isWelcome, isUpToDate);
  const title = t(titleKey);
  return {
    t,
    router,
    dismissed,
    dismiss,
    setDismissed,
    showOnboardingWelcome,
    hasAIPlan,
    setOnboardingStep,
    healthSyncEnabled,
    hideHealthSyncPrompt,
    hasConnectedAppleHealth,
    isPending,
    isWelcome,
    isUpToDate,
    missingCategories,
    needsHealthSetup,
    automaticHabitSummary,
    syncError,
    title,
    descriptionKey,
    headingIcon,
    accent,
    foreground,
    highlight,
    cardBackground,
    cardBorder,
    innerBorder,
    iconBackground,
  };
}

type SummaryState = ReturnType<typeof useDashboardSummary>;

export function DashboardSyncSummary() {
  const state = useDashboardSummary();
  if (state.dismissed) return null;
  if (state.showOnboardingWelcome) return <OnboardingSummary state={state} />;
  return <SyncSummary state={state} />;
}

function OnboardingSummary({ state }: Readonly<{ state: SummaryState }>) {
  const {
    t,
    router,
    hasAIPlan,
    setOnboardingStep,
    healthSyncEnabled,
    hideHealthSyncPrompt,
    hasConnectedAppleHealth,
    cardBackground,
    cardBorder,
    iconBackground,
    accent,
    foreground,
    dismiss,
  } = state;

  const platformKey = Platform.OS === 'android' ? 'android' : 'apple';
  const healthIcon = Platform.OS === 'android' ? 'smartphone' : 'applelogo';
  const openNextStep = () => {
    if (hasAIPlan) router.push('/(stack)/settings/health-sync');
    else {
      setOnboardingStep(ONBOARDING_FINISH_STEPS.welcomeDismissed);
      router.push({ pathname: '/(tabs)/search', params: { planCategories: 'other,nutrition,training', targetPeriods: 'daily,weekly' } });
    }
  };
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
      {(!hasAIPlan || (!healthSyncEnabled && !hideHealthSyncPrompt && !hasConnectedAppleHealth)) && (
        <SummaryAction
          icon={hasAIPlan ? healthIcon : 'pencil'}
          title={t(hasAIPlan ? `dashboard.sync.connectHealth.${platformKey}` : 'dashboard.sync.firstTipTitle')}
          description={hasAIPlan ? t('dashboard.sync.connectHealth.description') : undefined}
          onPress={openNextStep}
        />
      )}
    </View>
  );
}

function SyncSummary({ state }: Readonly<{ state: SummaryState }>) {
  const {
    t,
    router,
    cardBackground,
    cardBorder,
    iconBackground,
    accent,
    foreground,
    dismiss,
    isPending,
    headingIcon,
    title,
    descriptionKey,
    isUpToDate,
    missingCategories,
    setDismissed,
    isWelcome,
    needsHealthSetup,
    hideHealthSyncPrompt,
  } = state;

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
          <ThemedText style={[styles.title, { color: foreground }]}>{title}</ThemedText>
          <ThemedText style={[styles.description, { color: foreground }]}>{t(descriptionKey)}</ThemedText>
        </View>
        <CloseButton onPress={dismiss} color={accent} />
      </View>

      {isUpToDate && missingCategories.length === 0 && (
        <View style={styles.countdown}>
          <CountdownCircle onComplete={() => setDismissed(true)} accessibilityLabel={t('dashboard.sync.closingCountdown')} />
        </View>
      )}

      {!isPending && !isUpToDate && !isWelcome && <SummaryStats state={state} />}

      {isWelcome && (
        <SummaryAction
          icon="pencil"
          title={t('dashboard.sync.firstTipTitle')}
          description={t('dashboard.sync.firstTipDescription')}
          onPress={() => router.push({ pathname: '/(tabs)/search', params: { planCategories: 'other,nutrition,training', targetPeriods: 'daily,weekly' } })}
        />
      )}

      {isUpToDate &&
        missingCategories.map(category => (
          <SummaryAction
            key={category}
            icon={categoryIcons[category]}
            title={t(`dashboard.sync.addGoal.${category}`)}
            onPress={() =>
              router.push({ pathname: '/(tabs)/search', params: { planCategories: category, targetPeriods: 'daily,weekly', goalIntro: category } })
            }
          />
        ))}

      {(needsHealthSetup || ((isPending || isUpToDate) && !hideHealthSyncPrompt)) && (
        <SummaryAction
          icon={Platform.OS === 'android' ? 'smartphone' : 'applelogo'}
          title={t(`dashboard.sync.connectHealth.${Platform.OS === 'android' ? 'android' : 'apple'}`)}
          description={t('dashboard.sync.connectHealth.description')}
          onPress={() => router.push('/(stack)/settings/health-sync')}
        />
      )}

      {!isWelcome && !(isUpToDate && missingCategories.length > 0) && (
        <SummaryAction
          icon="calendar"
          title={t('dashboard.sync.manualTitle')}
          description={t('dashboard.sync.manualDescription')}
          onPress={() => router.push('/(tabs)/journal')}
        />
      )}
    </View>
  );
}

function SummaryStats({ state }: Readonly<{ state: SummaryState }>) {
  const { t, syncError, automaticHabitSummary, iconBackground, accent, highlight, foreground, innerBorder } = state;
  return (
    <>
      {syncError && <ThemedText style={styles.error}>{t('dashboard.sync.errorDescription')}</ThemedText>}
      <View style={styles.stats}>
        <View style={styles.stat} accessibilityLabel={t('dashboard.sync.newHabitGoals', { count: automaticHabitSummary?.newGoalsCount ?? 0 })}>
          <View style={[styles.statIcon, { backgroundColor: iconBackground }]}>
            <IconSymbol name="lotus" size={29} color={accent} />
          </View>
          <View style={styles.statText}>
            <ThemedText style={[styles.number, { color: highlight }]}>{automaticHabitSummary?.newGoalsCount ?? 0}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: foreground }]}>{t('dashboard.sync.habitGoalsLabel')}</ThemedText>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: innerBorder }]} />
        <View style={styles.stat}>
          <View style={[styles.statIcon, { backgroundColor: iconBackground }]}>
            <IconSymbol name="trainingRunning" size={30} color={accent} />
          </View>
          <View style={styles.statText}>
            <ThemedText style={[styles.number, { color: highlight }]}>0</ThemedText>
            <ThemedText style={[styles.statLabel, { color: foreground }]}>{t('dashboard.sync.trainingGoalsLabel')}</ThemedText>
          </View>
        </View>
      </View>
    </>
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
      accessibilityRole="button"
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
  title: { fontSize: 21, lineHeight: 27, fontWeight: '700' },
  description: { fontSize: 14, lineHeight: 20 },
  iconCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 2 },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  statText: { flex: 1 },
  number: { fontSize: 29, lineHeight: 34, fontWeight: '700' },
  statLabel: { fontSize: 12, lineHeight: 17 },
  divider: { width: 1, alignSelf: 'stretch' },
  manualLink: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, borderWidth: 1 },
  manualText: { flex: 1, gap: 3 },
  manualDescription: { fontSize: 13, lineHeight: 19 },
  error: { fontSize: 13, lineHeight: 19 },
});
