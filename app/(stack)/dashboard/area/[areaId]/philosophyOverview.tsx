import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import RelatedAreasList from '@/components/ui/RelatedAreasList';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { useWearable } from '@/wearables/wearableProvider';

export default function PhilosophyOverview({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { status } = useWearable();

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.philosophy }}>{t('philosophyOverview.title')}</ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('philosophyOverview.description')}
      </ThemedText>

      <WearableStatus status={status} />

      <Card title={t('philosophyOverview.principles.title')}>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🎯 {t('philosophyOverview.principles.dichotomy.title')}</ThemedText>
          <ThemedText type="default">{t('philosophyOverview.principles.dichotomy.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🧭 {t('philosophyOverview.principles.values.title')}</ThemedText>
          <ThemedText type="default">{t('philosophyOverview.principles.values.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🤝 {t('philosophyOverview.principles.meaning.title')}</ThemedText>
          <ThemedText type="default">{t('philosophyOverview.principles.meaning.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">📝 {t('philosophyOverview.principles.reflection.title')}</ThemedText>
          <ThemedText type="default">{t('philosophyOverview.principles.reflection.description')}</ThemedText>
        </View>
      </Card>

      <RelatedAreasList areaId="philosophy" />

      <TipsList areaId={mainGoalId} />
    </>
  );
}
