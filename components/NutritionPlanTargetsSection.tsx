import React from 'react';
import { View } from 'react-native';

import { ThemedText } from './ThemedText';
import AppButton from './ui/AppButton';
import { Card } from './ui/Card';
import DiscreetButton from './ui/DiscreetButton';

// Types for props
export type NutritionPlanTargetsSectionProps = {
  t: any;
  colors: any;
  styles: any;
  router: any;
  fulfilledTipsSectionYRef: any;
  periodSectionYRef: any;
  nutritionPlanTipProgressByPeriod: any;
  renderTipProgressList: any;
};

const NutritionPlanTargetsSection: React.FC<NutritionPlanTargetsSectionProps> = ({
  t,
  colors,
  styles,
  router,
  fulfilledTipsSectionYRef,
  periodSectionYRef,
  nutritionPlanTipProgressByPeriod,
  renderTipProgressList,
}) => (
  <View
    onLayout={event => {
      fulfilledTipsSectionYRef.current = event.nativeEvent.layout.y;
    }}
  >
    <Card style={{ borderRadius: styles?.borders?.borderRadius || 16 }}>
      {nutritionPlanTipProgressByPeriod.daily.length === 0 && nutritionPlanTipProgressByPeriod.weekly.length === 0 ? (
        <View style={styles.emptyTargetsContainer}>
          <ThemedText type="title3" style={styles.emptyTargetsHeading}>
            {t('nutritionLogger.targetsTitle')}
          </ThemedText>
          <ThemedText type="caption" style={[styles.emptyTargetsText, { color: colors.textLight }]}>\
            {t('nutritionLogger.targetsEmptyDescription')}
          </ThemedText>
          <AppButton
            title={t('nutritionLogger.addFirstTarget')}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/search',
                params: {
                  targetPeriods: 'daily,weekly',
                },
              });
            }}
            glow
            style={styles.addFirstTargetButton}
          />
        </View>
      ) : (
        <>
          <View
            style={styles.periodSection}
            onLayout={event => {
              periodSectionYRef.current.daily = event.nativeEvent.layout.y;
            }}
          >
            <ThemedText type="title3" style={styles.periodSectionHeading}>
              {t('nutritionLogger.periodDaily')}
            </ThemedText>
            {nutritionPlanTipProgressByPeriod.daily.length > 0 ? (
              renderTipProgressList(nutritionPlanTipProgressByPeriod.daily)
            ) : (
              <ThemedText type="explainer" style={styles.noFulfilledTipsText}>
                {t('nutritionLogger.noPlanTipsWithTargets')}
              </ThemedText>
            )}
            <View style={styles.addTargetButton}>
              <DiscreetButton
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/search',
                    params: {
                      targetPeriods: 'daily',
                    },
                  });
                }}
                title={t('nutritionLogger.addDailyTarget')}
              />
            </View>
          </View>
          <View
            style={styles.periodSection}
            onLayout={event => {
              periodSectionYRef.current.weekly = event.nativeEvent.layout.y;
            }}
          >
            <ThemedText type="title3" style={styles.periodSectionHeading}>
              {t('nutritionLogger.periodWeekly')}
            </ThemedText>
            {nutritionPlanTipProgressByPeriod.weekly.length > 0 ? (
              renderTipProgressList(nutritionPlanTipProgressByPeriod.weekly)
            ) : (
              <ThemedText type="explainer" style={styles.noFulfilledTipsText}>
                {t('nutritionLogger.noPlanTipsWithTargets')}
              </ThemedText>
            )}
            <View style={styles.addTargetButton}>
              <DiscreetButton
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/search',
                    params: {
                      targetPeriods: 'weekly',
                    },
                  });
                }}
                title={t('nutritionLogger.addWeeklyTarget')}
              />
            </View>
          </View>
        </>
      )}
    </Card>
  </View>
);

export default NutritionPlanTargetsSection;
