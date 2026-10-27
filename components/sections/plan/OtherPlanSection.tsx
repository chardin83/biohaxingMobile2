import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { PlanTipEntry } from '@/app/context/storage/plans/planTypes';
import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { PlanMeta } from '@/components/sections/plan/PlanMeta';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import DiscreetButton from '@/components/ui/DiscreetButton';
import { IconSymbol } from '@/components/ui/IconSymbol';


type Props = {};

export const OtherPlanSection: React.FC<Props> = () => {
  const { t } = useTranslation(['common', 'areas', 'tips']);
  const { colors } = useTheme();
  const router = useRouter();
  const { plans } = useStorage();

  const otherPlans = plans.other;

  const openPlanDetails = (plan: PlanTipEntry, title?: string | null) => {
    if (!plan.tipId) return;
    const cardData = JSON.stringify({
      comment: plan.comment ?? '',
    });

    router.push({
      pathname: '/plan/[tipId]',
      params: {
        tipId: plan.tipId,
        planId: plan.id,
        title: title ?? t(`tips:${plan.tipId}.title`),
        startedAt: plan.startedAt,
        createdBy: plan.createdBy,
        comment: plan.comment ?? '',
        planCategory: 'other',
        cardData,
      },
    });
  };

  if (!otherPlans.length) {
    return <ThemedText type="default">{t('otherPlanSection.noActiveOther')}</ThemedText>;
  }

  return (
    <>
      {otherPlans.map((plan, index) => {
        const tipTitle = plan.tipId ? t(`tips:${plan.tipId}.title`) : t('plan.untitled');

        return (
          <Card key={plan.tipId ?? `other-${index}`} style={[styles.otherGoalCard, { borderLeftColor: colors.planSectionOtherIcon }]}>
            <View style={styles.otherCardHeaderRow}>
              <TouchableOpacity style={styles.otherCardHeaderMain} onPress={() => openPlanDetails(plan, tipTitle)} activeOpacity={0.85}>
                <IconSymbol name="ellipsis" size={18} color={colors.planSectionOtherIcon} />
                <ThemedText type="title3" style={[styles.otherCardTitle, { color: colors.planSectionOtherIcon }]}>
                  {tipTitle}
                </ThemedText>
                <IconSymbol name="chevron.right" size={16} color={colors.icon} />
              </TouchableOpacity>
            </View>
            <PlanMeta startedAt={plan.startedAt} createdBy={plan.createdBy} />
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
                inPlan: 'no',
                filterRequestId: String(Date.now()),
                fromPlan: '1',
              },
            });
          }}
        />
      </View>
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
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 2,
  },
  otherCardTitle: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    textTransform: 'uppercase',
  },
  commentText: {
    marginBottom: 8,
  },
  addOtherButtonWrap: {
    marginTop: 4,
    alignItems: 'center',
  },
});
