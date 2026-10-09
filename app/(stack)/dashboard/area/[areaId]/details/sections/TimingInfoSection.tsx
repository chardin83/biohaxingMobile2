import React from 'react';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/ThemedText';
import { InformationCard } from '@/components/ui/InformationCard';
import { InformationCardLink } from '@/components/ui/InformationCardLink';

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
    <InformationCardLink
      title={t('timingInfoSection.title')}
      subtitle={t('timingInfoSection.subtitle')}
      iconName="bullseyeArrow"
    >
      <InformationCard title={t('timingInfoSection.trainingRelation.title')} iconName="trainingGym" variant="primary">
        <ThemedText type="defaultLarge">{trainingRelationLabel || '-'}</ThemedText>
      </InformationCard>
      <InformationCard title={t('timingInfoSection.preferredDayParts.title')} iconName="sunny" variant="info">
        {preferredDayPartLabels.length > 0
          ? preferredDayPartLabels.map((label: string) => (
              <ThemedText key={label} type="defaultLarge">
                {label}
              </ThemedText>
            ))
          : <ThemedText type="defaultLarge" >-</ThemedText>
        }
      </InformationCard>
      <InformationCard title={t('timingInfoSection.timeRules.title')} iconName="clock" variant="warm">
        <ThemedText type="defaultLarge" >{timeRuleLabel || '-'}</ThemedText>
      </InformationCard>
    </InformationCardLink>
  );
}
