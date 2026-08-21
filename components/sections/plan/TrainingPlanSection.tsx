import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-paper';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import TrainingSettingsModal from '@/components/modals/TrainingSettingsModal';
import { PlanMeta } from '@/components/sections/plan/PlanMeta';
import { ThemedText } from '@/components/ThemedText';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import DiscreetButton from '@/components/ui/DiscreetButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  type TrainingActivityFilter,
  type TrainingBadgeItem,
  type TrainingIntensityFilter,
} from '@/types/training';

import { PlanHeaderActions } from './PlanHeaderActions';

type Props = {
  colors: any;
};

const toLabelSuffix = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

export const TrainingPlanSection: React.FC<Props> = ({ colors }) => {
  const { t } = useTranslation(['common', 'areas', 'tips']);
  const router = useRouter();
  const { plans, trainingPlanSettings, setTrainingPlanSettings } = useStorage();

  const trainingPlanGoals = plans.training;

  const [trainingSettingsVisible, setTrainingSettingsVisible] = useState(false);
  const [trainingSettingsTipId, setTrainingSettingsTipId] = useState<string | null>(null);
  const [trainingSettingsTitle, setTrainingSettingsTitle] = useState<string | null>(null);
  const [trainingSessionsInput, setTrainingSessionsInput] = useState('');
  const [trainingDurationInput, setTrainingDurationInput] = useState('');
  const [trainingActivityTypeInput, setTrainingActivityTypeInput] = useState('any' as TrainingActivityFilter);
  const [trainingMinimumIntensityInput, setTrainingMinimumIntensityInput] = useState('any' as TrainingIntensityFilter);

  const buildTrainingBadges = (
    trainingSettingsKey: string,
    userSettings: (typeof trainingPlanSettings)[string]
  ): TrainingBadgeItem[] => {
    const badges: TrainingBadgeItem[] = [];

    if (typeof userSettings.sessionsPerWeek === 'number' && !Number.isNaN(userSettings.sessionsPerWeek)) {
      badges.push({
        key: `${trainingSettingsKey}-sessions`,
        label: t('plan.trainingSessionsPerWeek', {
          count: userSettings.sessionsPerWeek,
        }),
        icon: 'calendar',
      });
    }

    if (typeof userSettings.sessionDurationMinutes === 'number' && !Number.isNaN(userSettings.sessionDurationMinutes)) {
      badges.push({
        key: `${trainingSettingsKey}-duration`,
        label: t('plan.trainingDurationMinutes', {
          minutes: userSettings.sessionDurationMinutes,
        }),
        icon: 'clock',
      });
    }

    if (userSettings.activityType && userSettings.activityType !== 'any') {
      badges.push({
        key: `${trainingSettingsKey}-activity`,
        label: t(`training:trainingType${toLabelSuffix(userSettings.activityType)}`),
        icon: 'trainingRunning',
      });
    }

    if (userSettings.minimumIntensity && userSettings.minimumIntensity !== 'any') {
      badges.push({
        key: `${trainingSettingsKey}-intensity`,
        label: t(`training:trainingIntensity${toLabelSuffix(userSettings.minimumIntensity)}`),
        icon: 'flame',
      });
    }

    return badges;
  };

  const openTrainingSettingsModal = (tipId: string, trainingTitle?: string | null) => {
    const existing = trainingPlanSettings[tipId];
    setTrainingSessionsInput(existing?.sessionsPerWeek === undefined ? '' : existing.sessionsPerWeek.toString());
    setTrainingDurationInput(
      typeof existing?.sessionDurationMinutes === 'number' ? existing.sessionDurationMinutes.toString() : ''
    );
    setTrainingActivityTypeInput(existing?.activityType ?? 'any');
    setTrainingMinimumIntensityInput(existing?.minimumIntensity ?? 'any');
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
    setTrainingActivityTypeInput('any');
    setTrainingMinimumIntensityInput('any');
  };

  const openPlanDetails = (goal: (typeof trainingPlanGoals)[number], badges: TrainingBadgeItem[]) => {
    if (!goal.tipId) return;
    const title = t(`tips:${goal.tipId}.title`);
    const cardData = JSON.stringify({
      badges: badges.map(badge => ({ label: badge.label, icon: badge.icon })),
      comment: goal.comment ?? '',
    });

    router.push({
      pathname: '/plan/[tipId]',
      params: {
        tipId: goal.tipId,
        title,
        startedAt: goal.startedAt,
        createdBy: goal.createdBy,
        comment: goal.comment ?? '',
        planCategory: 'training',
        cardData,
      },
    });
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
    const activityTypeValue = trainingActivityTypeInput === 'any' ? undefined : trainingActivityTypeInput;
    const minimumIntensityValue =
      trainingMinimumIntensityInput === 'any' ? undefined : trainingMinimumIntensityInput;

    setTrainingPlanSettings(prev => {
      const next = { ...prev };
      if (
        sessionsValue === undefined &&
        durationValue === undefined &&
        activityTypeValue === undefined &&
        minimumIntensityValue === undefined
      ) {
        delete next[trainingSettingsTipId];
      } else {
        next[trainingSettingsTipId] = {
          sessionsPerWeek: sessionsValue,
          sessionDurationMinutes: durationValue,
          activityType: activityTypeValue,
          minimumIntensity: minimumIntensityValue,
        };
      }
      return next;
    });

    closeTrainingSettingsModal();
  };

  if (!trainingPlanGoals.length) {
    return (
      <ThemedText type="default">
        {t('plan.noActiveTraining')}
      </ThemedText>
    );
  }

  return (
    <>
      {trainingPlanGoals.map(goal => {
        const tipTitle = goal.tipId ? t(`tips:${goal.tipId}.title`) : null;
        const trainingSettingsKey = goal.tipId ?? 'unknown';
        const userSettings = trainingPlanSettings[trainingSettingsKey] ?? {};
        const trainingBadges = buildTrainingBadges(trainingSettingsKey, userSettings);

        const editAction = (
          <PlanHeaderActions
            trainingSettingsKey={trainingSettingsKey}
            tipTitle={tipTitle}
            t={t}
            openTrainingSettingsModal={openTrainingSettingsModal}
            styles={styles}
          />
        );

        return (
          <Card
            key={goal.tipId}
            style={[
              styles.trainingGoalCard,
              { borderLeftColor: colors.planSectionIcon },
            ]}
          >
            <View style={styles.trainingCardHeaderRow}>
              <TouchableOpacity
                style={styles.trainingCardHeaderMain}
                onPress={() => openPlanDetails(goal, trainingBadges)}
                activeOpacity={0.85}
              >
                <IconSymbol name="trainingGym" size={18} color={colors.planSectionIcon} />
                <ThemedText type="title3" style={[styles.trainingCardTitle, { color: colors.planSectionIcon }]}>
                  {tipTitle ?? t('plan.untitled')}
                </ThemedText>
                <IconSymbol name="chevron.right" size={16} color={colors.icon} />
              </TouchableOpacity>
              <View style={styles.trainingCardHeaderRight}>{editAction}</View>
            </View>
            <PlanMeta startedAt={goal.startedAt} createdBy={goal.createdBy} />
            <View style={styles.trainingSettingsContainer}>
              {trainingBadges.length ? (
                <View style={styles.trainingBadgesRow}>
                  {trainingBadges.map(({ key, label, icon }) => (
                    <Badge key={key} variant="overlay" style={styles.trainingBadge}>
                      <IconSymbol name={icon} size={14} color={colors.icon} style={styles.trainingBadgeIcon} />
                      <ThemedText type="caption">
                        {label}
                      </ThemedText>
                    </Badge>
                  ))}
                </View>
              ) : (
                <ThemedText type="default" style={styles.trainingSettingsText}>
                  {t('plan.trainingTargetsUnset')}
                </ThemedText>
              )}
            </View>
          </Card>
        );
      })}
      <View style={styles.addTrainingButtonWrap}>
        <DiscreetButton
          title={`+ ${t('general.add', { defaultValue: 'Lagg till' })}`}
          onPress={() => {
            router.push({
              pathname: '/(tabs)/search',
              params: {
                planCategories: 'training',
              },
            });
          }}
        />
      </View>
      <Portal>
        <TrainingSettingsModal
          visible={trainingSettingsVisible}
          title={t('plan.trainingTargetsTitle')}
          trainingTitle={trainingSettingsTitle}
          sessionsPlaceholder={t('plan.trainingSessionsPlaceholder')}
          durationPlaceholder={t('plan.trainingDurationPlaceholder')}
          sessionsLabel={t('plan.trainingSessionsPlaceholder')}
          durationLabel={t('plan.trainingDurationPlaceholder')}
          sessionsValue={trainingSessionsInput}
          durationValue={trainingDurationInput}
          activityTypeValue={trainingActivityTypeInput}
          minimumIntensityValue={trainingMinimumIntensityInput}
          onChangeSessions={setTrainingSessionsInput}
          onChangeDuration={setTrainingDurationInput}
          onChangeActivityType={setTrainingActivityTypeInput}
          onChangeMinimumIntensity={setTrainingMinimumIntensityInput}
          onSave={handleSaveTrainingSettings}
          onClose={closeTrainingSettingsModal}
          saveLabel={t('general.save')}
          cancelLabel={t('general.cancel')}
        />
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  trainingGoalCard: {
    borderWidth: 0,
    borderLeftWidth: 6,
    borderRadius: globalStyles.borders.borderRadius,
    paddingLeft: 12,
  },
  trainingCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  trainingCardHeaderMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 2,
  },
  trainingCardTitle: {
    textTransform: 'uppercase',
  },
  trainingCardHeaderRight: {
    marginLeft: 12,
  },
  planHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainingSettingsContainer: {
    marginTop: 12,
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
  trainingSettingsText: {
    flex: 1,
  },
  headerActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartButton: {
    padding: 4,
  },
  chartEmoji: {
    fontSize: 20,
  },
  chartEmojiDisabled: {
    opacity: 0.4,
  },
  addTrainingButtonWrap: {
    marginTop: 4,
    alignItems: 'center',
  },
});
