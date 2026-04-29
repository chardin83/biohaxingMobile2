import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';

export type TimingInfoSectionProps = {
  tip: any;
};

export default function TimingInfoSection({ tip }: Readonly<TimingInfoSectionProps>) {
  const { t } = useTranslation();
  const trainingRelationLabel = tip?.trainingRelation
    ? t(`timingInfoSection.trainingRelation.${tip.trainingRelation}`)
    : null;
  const preferredDayPartLabels = React.useMemo(() => {
    if (!tip?.preferredDayParts?.length) return [] as string[];
    return tip.preferredDayParts.map((part: string) => t(`timingInfoSection.preferredDayParts.${part}`));
  }, [tip?.preferredDayParts, t]);
  const timeRuleLabel = tip?.timeRule ? t(`timingInfoSection.timeRules.${tip.timeRule}`) : null;

  return (
    <AppBox title={t('timingInfoSection.title')}>
      <View style={globalStyles.marginBottom16}>
        <ThemedText type="label">{t('timingInfoSection.trainingRelation.title')}</ThemedText>
        <ThemedText type="defaultLarge">{trainingRelationLabel || '-'}</ThemedText>
      </View>
      <View style={globalStyles.marginBottom16}>
        <ThemedText type="label">{t('timingInfoSection.preferredDayParts.title')}</ThemedText>
        {preferredDayPartLabels.length > 0
          ? preferredDayPartLabels.map((label: string) => (
              <ThemedText key={label} type="defaultLarge">
                {label}
              </ThemedText>
            ))
          : <ThemedText type="defaultLarge" >-</ThemedText>
        }
      </View>
      <View style={globalStyles.marginBottom16}>
        <ThemedText type="label">{t('timingInfoSection.timeRules.title')}</ThemedText>
        <ThemedText type="defaultLarge" >{timeRuleLabel || '-'}</ThemedText>
      </View>
    </AppBox>
  );
}
