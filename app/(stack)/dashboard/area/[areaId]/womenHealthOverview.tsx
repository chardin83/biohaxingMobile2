import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { RecoveryStatusMetric } from '@/components/metrics/RecoveryStatusMetric';
import { RecoveryTrendChart } from '@/components/metrics/RecoveryTrendChart';
import { TodaysActivityCharts } from '@/components/metrics/TodaysActivityCharts';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import type { IconSymbolName } from '@/components/ui/icon-symbol-map';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import TipsList from '@/components/ui/TipsList';

const adviceIcons: Record<string, IconSymbolName> = {
  training: 'trainingGym',
  diet: 'meal',
  recovery: 'moon',
  checkups: 'healthCheck',
  lifestyle: 'trainingGym',
  breastfeeding: 'heart',
};

export default function WomenHealthOverview({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation('areas');
  const [showRecovery, setShowRecovery] = React.useState(false);
  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.womenHealth }}>
        {t('womenHealth.title')}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('womenHealth.description')}
      </ThemedText>
      <Card>
        <View style={styles.metricRow}>
          <RecoveryStatusMetric isSelected={showRecovery} onPress={() => setShowRecovery(current => !current)} />
        </View>
        {showRecovery && <RecoveryTrendChart />}
      </Card>
      <TodaysActivityCharts />
      <InformationCardLink
        iconName="hormones"
        iconColor={colors.area.womenHealth}
        snapPoints={['70%', '90%']}
        rows={[
          { key: 'fertility', items: ['pcos', 'endometriosis'] },
          { key: 'perimenopause', items: ['transition'] },
          { key: 'menopause', items: ['menopause'] },
        ].map(section => ({
          key: section.key,
          title: t(`womenHealth.lifeStages.${section.key}.title`),
          subtitle: t(`womenHealth.lifeStages.${section.key}.subtitle`),
          content: section.items.map(key => (
            <View key={key} style={styles.condition}>
              <ThemedText type="title3">{t(`womenHealth.lifeStages.${section.key}.items.${key}.title`)}</ThemedText>
              <ThemedText>{t(`womenHealth.lifeStages.${section.key}.items.${key}.description`)}</ThemedText>
              <InformationCardLink
                title={t('womenHealth.healthAdviceLink')}
                sheetTitle={t(`womenHealth.lifeStages.${section.key}.items.${key}.title`)}
                iconName="heart"
                iconColor={colors.area.womenHealth}
                snapPoints={['70%', '90%']}
                items={['training', 'diet', 'recovery', 'checkups'].map(adviceKey => ({
                  key: adviceKey,
                  iconName: adviceIcons[adviceKey],
                  title: t(`womenHealth.lifeStages.${section.key}.items.${key}.healthAdvice.${adviceKey}.title`),
                  description: t(`womenHealth.lifeStages.${section.key}.items.${key}.healthAdvice.${adviceKey}.description`),
                }))}
              >
                <ThemedText type="subtitle">{t('womenHealth.healthAdviceTitle')}</ThemedText>
              </InformationCardLink>
            </View>
          )),
        }))}
      />
      <InformationCardLink title={t('womenHealth.conditionsTitle')} iconName="healthCheck" iconColor={colors.area.womenHealth} snapPoints={['70%', '90%']}>
        {[
          { key: 'autoimmune', items: ['understanding', 'dailyLife', 'checkups'] },
          { key: 'breastCancer', items: ['lifestyle', 'diet', 'breastfeeding', 'checkups'] },
        ].map(condition => (
          <View key={condition.key} style={styles.condition}>
            <ThemedText type="title3">{t(`womenHealth.conditions.${condition.key}.title`)}</ThemedText>
            <ThemedText>{t(`womenHealth.conditions.${condition.key}.description`)}</ThemedText>
            <InformationCardLink
              title={t('womenHealth.healthAdviceLink')}
              sheetTitle={t(`womenHealth.conditions.${condition.key}.title`)}
              iconName="heart"
              iconColor={colors.area.womenHealth}
              snapPoints={['70%', '90%']}
              items={condition.items.map(key => ({
                key,
                iconName: adviceIcons[key] ?? 'healthCheck',
                title: t(`womenHealth.conditions.${condition.key}.items.${key}.title`),
                description: t(`womenHealth.conditions.${condition.key}.items.${key}.description`),
              }))}
            />
          </View>
        ))}
      </InformationCardLink>
      <TipsList areaId={mainGoalId} />
    </>
  );
}

const styles = StyleSheet.create({
  metricRow: { flexDirection: 'row' },
  condition: { gap: 12 },
});
