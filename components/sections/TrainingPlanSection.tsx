import BottomSheet from '@gorhom/bottom-sheet';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-paper';

import { useStorage } from '@/app/context/StorageContext';
import TrainingSettingsModal from '@/components/modals/TrainingSettingsModal';
import { MetricsBottomSheet } from '@/components/sections/MetricsBottomSheet';
import { PlanMeta } from '@/components/sections/PlanMeta';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';
import Badge from '@/components/ui/Badge';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PlanEditActions from '@/components/ui/PlanEditActions';

type Props = {
  colors: any;
  formatDate: (isoDate: string) => string;
};

export const TrainingPlanSection: React.FC<Props> = ({ colors, formatDate }) => {
  const { t } = useTranslation(['common', 'areas', 'tips']);
  const { plans, trainingPlanSettings, setTrainingPlanSettings, getMetricsForPlanTip } = useStorage();

  const trainingPlanGoals = plans.training;

  const [trainingSettingsVisible, setTrainingSettingsVisible] = useState(false);
  const [trainingSettingsTipId, setTrainingSettingsTipId] = useState<string | null>(null);
  const [trainingSettingsTitle, setTrainingSettingsTitle] = useState<string | null>(null);
  const [trainingSessionsInput, setTrainingSessionsInput] = useState('');
  const [trainingDurationInput, setTrainingDurationInput] = useState('');
  const [selectedMetricsTipId, setSelectedMetricsTipId] = useState<string | null>(null);
  const metricsBottomSheetRef = useRef<BottomSheet>(null);

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

  const openMetricsSheet = (tipId: string) => {
    console.log('[TrainingPlanSection] openMetricsSheet called with tipId:', tipId);
    setSelectedMetricsTipId(tipId);
    setTimeout(() => {
      console.log('[TrainingPlanSection] calling snapToIndex');
      metricsBottomSheetRef.current?.snapToIndex(1);
    }, 100);
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
            }),
            icon: 'clock',
          });
        }

        // Count metric registrations for this planTipId
        const metricCount = getMetricsForPlanTip(trainingSettingsKey).length;

        const editAction = (
          <View style={styles.headerActionsContainer}>
            <TouchableOpacity
              onPress={() => openMetricsSheet(trainingSettingsKey)}
              style={styles.chartButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ThemedText style={[styles.chartEmoji, metricCount === 0 && styles.chartEmojiDisabled]}>📊{metricCount > 0 ? ` ${metricCount}` : ''}</ThemedText>
            </TouchableOpacity>
            <PlanEditActions
              onEdit={() => openTrainingSettingsModal(trainingSettingsKey, tipTitle)}
              editLabel={t('plan.editTrainingSettings')}
              style={styles.planHeaderActions}
            />
          </View>
        );

        return (
          <AppBox
            key={goal.tipId}
            title={tipTitle ?? t('plan.untitled')}
            headerRight={editAction}
          >
            <PlanMeta startedAt={goal.startedAt} createdBy={goal.createdBy} t={t} formatDate={formatDate} />
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
                  {t('plan.trainingSettingsUnset')}
                </ThemedText>
              )}
            </View>
          </AppBox>
        );
      })}
      <Portal>
        <TrainingSettingsModal
          visible={trainingSettingsVisible}
          title={t('plan.trainingSettingsTitle')}
          trainingTitle={trainingSettingsTitle}
          sessionsPlaceholder={t('plan.trainingSessionsPlaceholder')}
          durationPlaceholder={t('plan.trainingDurationPlaceholder')}
          sessionsLabel={t('plan.trainingSessionsPlaceholder')}
          durationLabel={t('plan.trainingDurationPlaceholder')}
          sessionsValue={trainingSessionsInput}
          durationValue={trainingDurationInput}
          onChangeSessions={setTrainingSessionsInput}
          onChangeDuration={setTrainingDurationInput}
          onSave={handleSaveTrainingSettings}
          onClose={closeTrainingSettingsModal}
          saveLabel={t('general.save')}
          cancelLabel={t('general.cancel')}
        />
        <MetricsBottomSheet bottomSheetRef={metricsBottomSheetRef} tipId={selectedMetricsTipId} planTipId={selectedMetricsTipId} />
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
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
});
