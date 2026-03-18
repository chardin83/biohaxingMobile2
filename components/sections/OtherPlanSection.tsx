import BottomSheet from '@gorhom/bottom-sheet';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-paper';

import { PlanTipEntry, useStorage } from '@/app/context/StorageContext';
import DefaultSettingsModal from '@/components/modals/DefaultSettingsModal';
import { MetricsBottomSheet } from '@/components/sections/MetricsBottomSheet';
import { PlanMeta } from '@/components/sections/PlanMeta';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';
import PlanEditActions from '@/components/ui/PlanEditActions';

type Props = {
  formatDate: (isoDate: string) => string;
};

export const OtherPlanSection: React.FC<Props> = ({ formatDate }) => {
  const { t } = useTranslation(['common', 'areas', 'tips']);
  const { plans, setPlans, getMetricsForPlanTip } = useStorage();

  const otherPlans = plans.other;

  const [otherSettingsVisible, setOtherSettingsVisible] = useState(false);
  const [otherSettingsTitle, setOtherSettingsTitle] = useState<string | null>(null);
  const [otherCommentInput, setOtherCommentInput] = useState('');
  const [otherEditTipId, setOtherEditTipId] = useState<string | null>(null);
  const [selectedMetricsTipId, setSelectedMetricsTipId] = useState<string | null>(null);
  const metricsBottomSheetRef = useRef<BottomSheet>(null);

  const openOtherSettingsModal = (tipId: string, otherTitle?: string | null) => {
    setOtherEditTipId(tipId);
    setOtherSettingsTitle(otherTitle ?? null);
    const plan = otherPlans.find(g => g.tipId === tipId);
    setOtherCommentInput(plan?.comment ?? '');
    setOtherSettingsVisible(true);
  };

  const closeOtherSettingsModal = () => {
    setOtherSettingsVisible(false);
    setOtherSettingsTitle(null);
    setOtherCommentInput('');
    setOtherEditTipId(null);
  };

  const handleSaveOtherSettings = () => {
    if (!otherEditTipId) {
      closeOtherSettingsModal();
      return;
    }
    setPlans(prev => ({
      ...prev,
      other: prev.other.map(plan =>
        plan.tipId === otherEditTipId
          ? { ...plan, comment: otherCommentInput, editedAt: new Date().toISOString(), editedBy: 'you' }
          : plan
      ),
    }));
    closeOtherSettingsModal();
  };

  const handleDeleteOther = () => {
    if (!otherEditTipId) {
      closeOtherSettingsModal();
      return;
    }
    setPlans(prev => ({
      ...prev,
      other: prev.other.filter(plan => plan.tipId !== otherEditTipId),
    }));
    closeOtherSettingsModal();
  };

  const handleEditOther = (plan: PlanTipEntry): void => {
    if (!plan.tipId) return;
    const title = plan.tipId
      ? t(`tips:${plan.tipId}.title`)
      : t('plan.untitled');
    openOtherSettingsModal(plan.tipId, title);
  };

  const openMetricsSheet = (tipId: string) => {
    setSelectedMetricsTipId(tipId);
    setTimeout(() => {
      metricsBottomSheetRef.current?.snapToIndex(1);
    }, 100);
  };

  if (!otherPlans.length) {
    return (
      <ThemedText type="default">
        {t('otherPlanSection.noActiveOther')}
      </ThemedText>
    );
  }

  return (
    <>
      {otherPlans.map((plan, index) => {
        const tipTitle = plan.tipId
          ? t(`tips:${plan.tipId}.title`)
          : t('plan.untitled');
        const metricCount = plan.tipId ? getMetricsForPlanTip(plan.tipId).length : 0;
        const hasTipId = Boolean(plan.tipId);
        const metricsLabel = metricCount > 0 ? `📊 ${metricCount}` : '📊';

        const editAction = (
          <View style={styles.headerActionsContainer}>
            {hasTipId && (
              <TouchableOpacity
                onPress={() => openMetricsSheet(plan.tipId)}
                style={styles.chartButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ThemedText style={[styles.chartEmoji, metricCount === 0 && styles.chartEmojiDisabled]}>
                  {metricsLabel}
                </ThemedText>
              </TouchableOpacity>
            )}
            <PlanEditActions
              onEdit={() => handleEditOther(plan)}
              editLabel={t('otherPlanSection.editOtherSettings')}
              style={styles.planHeaderActions}
            />
          </View>
        );

        return (
          <AppBox
            key={plan.tipId ?? `other-${index}`}
            title={tipTitle}
            headerRight={editAction}
          >
            <PlanMeta
              startedAt={plan.startedAt}
              createdBy={plan.createdBy}
              t={t}
              formatDate={formatDate}
            />
            {plan.comment ? (
              <ThemedText type="default" style={styles.commentText}>
                {plan.comment}
              </ThemedText>
            ) : null}
          </AppBox>
        );
      })}
      <Portal>
        <DefaultSettingsModal
          visible={otherSettingsVisible}
          title={t('otherPlanSection.otherSettingsTitle')}
          nutritionTitle={otherSettingsTitle}
          commentPlaceholder={t('otherPlanSection.otherCommentPlaceholder')}
          commentLabel={t('otherPlanSection.otherCommentLabel')}
          commentValue={otherCommentInput}
          onChangeComment={setOtherCommentInput}
          onSave={handleSaveOtherSettings}
          onClose={closeOtherSettingsModal}
          onDelete={handleDeleteOther}
          saveLabel={t('general.save')}
          cancelLabel={t('general.cancel')}
          deleteLabel={t('general.delete')}
        />
        <MetricsBottomSheet bottomSheetRef={metricsBottomSheetRef} tipId={selectedMetricsTipId} planTipId={selectedMetricsTipId ?? undefined} />
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  headerActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartButton: {
    marginRight: 6,
  },
  chartEmoji: {
    fontSize: 16,
  },
  chartEmojiDisabled: {
    opacity: 0.55,
  },
  commentText: {
    marginBottom: 8,
  },
});
