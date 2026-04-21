import BottomSheet from '@gorhom/bottom-sheet';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Portal } from 'react-native-paper';

import { PlanTipEntry, useStorage } from '@/app/context/StorageContext';
import DefaultSettingsModal from '@/components/modals/DefaultSettingsModal';
import { MetricsBottomSheet } from '@/components/sections/MetricsBottomSheet';
import { PlanMeta } from '@/components/sections/PlanMeta';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';

import { PlanHeaderActions } from './PlanHeaderActions';

type Props = {
  formatDate: (isoDate: string) => string;
};

export const OtherPlanSection: React.FC<Props> = ({ formatDate }) => {
  const { t } = useTranslation(['common', 'areas', 'tips']);
  const { plans, setPlans } = useStorage();

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

        const editAction = (
          <PlanHeaderActions
            tipId={plan.tipId}
            trainingSettingsKey={plan.tipId ?? ''}
            tipTitle={tipTitle}
            t={t}
            openMetricsSheet={openMetricsSheet}
            openTrainingSettingsModal={() => handleEditOther(plan)}
            styles={styles}
          />
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
