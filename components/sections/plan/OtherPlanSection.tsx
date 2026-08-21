import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-paper';

import { PlanTipEntry, useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import DefaultSettingsModal from '@/components/modals/DefaultSettingsModal';
import { PlanMeta } from '@/components/sections/plan/PlanMeta';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import DiscreetButton from '@/components/ui/DiscreetButton';
import { IconSymbol } from '@/components/ui/IconSymbol';

import { PlanHeaderActions } from './PlanHeaderActions';

type Props = {};

export const OtherPlanSection: React.FC<Props> = () => {
  const { t } = useTranslation(['common', 'areas', 'tips']);
  const { colors } = useTheme();
  const router = useRouter();
  const { plans, setPlans } = useStorage();

  const otherPlans = plans.other;

  const [otherSettingsVisible, setOtherSettingsVisible] = useState(false);
  const [otherSettingsTitle, setOtherSettingsTitle] = useState<string | null>(null);
  const [otherCommentInput, setOtherCommentInput] = useState('');
  const [otherEditTipId, setOtherEditTipId] = useState<string | null>(null);

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

  const openPlanDetails = (plan: PlanTipEntry, title?: string | null) => {
    if (!plan.tipId) return;
    const cardData = JSON.stringify({
      comment: plan.comment ?? '',
    });

    router.push({
      pathname: '/plan/[tipId]',
      params: {
        tipId: plan.tipId,
        title: title ?? t(`tips:${plan.tipId}.title`),
        startedAt: plan.startedAt,
        createdBy: plan.createdBy,
        comment: plan.comment ?? '',
        planCategory: 'other',
        cardData,
      },
    });
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
            trainingSettingsKey={plan.tipId ?? ''}
            tipTitle={tipTitle}
            t={t}
            openTrainingSettingsModal={() => handleEditOther(plan)}
            styles={styles}
          />
        );

        return (
          <Card
            key={plan.tipId ?? `other-${index}`}
            style={[
              styles.otherGoalCard,
              { borderLeftColor: colors.planSectionOtherIcon },
            ]}
          >
            <View style={styles.otherCardHeaderRow}>
              <TouchableOpacity
                style={styles.otherCardHeaderMain}
                onPress={() => openPlanDetails(plan, tipTitle)}
                activeOpacity={0.85}
              >
                <IconSymbol name="ellipsis" size={18} color={colors.planSectionOtherIcon} />
                <ThemedText type="title3" style={[styles.otherCardTitle, { color: colors.planSectionOtherIcon }]}>
                  {tipTitle}
                </ThemedText>
                <IconSymbol name="chevron.right" size={16} color={colors.icon} />
              </TouchableOpacity>
              <View style={styles.otherCardHeaderRight}>{editAction}</View>
            </View>
            <PlanMeta
              startedAt={plan.startedAt}
              createdBy={plan.createdBy}
            />
            {plan.comment ? (
              <ThemedText type="default" style={styles.commentText}>
                {plan.comment}
              </ThemedText>
            ) : null}
          </Card>
        );
      })}
      <View style={styles.addOtherButtonWrap}>
        <DiscreetButton
          title={`+ ${t('general.add')}`}
          onPress={() => {
            router.push({
              pathname: '/(tabs)/search',
              params: {
                planCategories: 'other',
              },
            });
          }}
        />
      </View>
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
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  otherGoalCard: {
    borderWidth: 0,
    borderLeftWidth: 6,
    borderRadius: globalStyles.borders.borderRadius,
    paddingLeft: 12,
  },
  otherCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  otherCardHeaderMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 2,
  },
  otherCardTitle: {
    textTransform: 'uppercase',
  },
  otherCardHeaderRight: {
    marginLeft: 12,
  },
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
  addOtherButtonWrap: {
    marginTop: 4,
    alignItems: 'center',
  },
});
