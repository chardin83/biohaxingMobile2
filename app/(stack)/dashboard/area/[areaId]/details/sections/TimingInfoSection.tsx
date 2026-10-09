import React from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import { InformationCard } from '@/components/ui/InformationCard';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import ReadConfirmation from '@/components/ui/ReadConfirmation';
import XPBadge from '@/components/ui/XPBadge';
import { XP_FOR_TIMING_READ } from '@/constants/XP';

export type TimingInfoSectionProps = {
  tip: any;
};

export default function TimingInfoSection({ tip }: Readonly<TimingInfoSectionProps>) {
  const { t } = useTranslation();
  const { viewedTips, claimTipReadingXP } = useStorage();
  const isRead = viewedTips.find(view => view.tipId === tip?.id)?.timingRead === true;
  const [sheetOpen, setSheetOpen] = React.useState(false);
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
      accessory={<XPBadge amount={XP_FOR_TIMING_READ} showPlus checked={isRead} />}
      onSheetChange={index => setSheetOpen(index >= 0)}
      onDismiss={() => setSheetOpen(false)}
      footer={tip && <ReadConfirmation key={tip.id} read={isRead} active={sheetOpen} xp={XP_FOR_TIMING_READ} onConfirm={() => { claimTipReadingXP(tip.id, 'timing'); }} />}
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
