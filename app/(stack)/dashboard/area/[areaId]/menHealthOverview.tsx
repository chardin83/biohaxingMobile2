import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/ThemedText';
import type { IconSymbolName } from '@/components/ui/icon-symbol-map';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import TipsList from '@/components/ui/TipsList';

const adviceSections = [
  { key: 'training', iconName: 'trainingGym' },
  { key: 'diet', iconName: 'meal' },
  { key: 'recovery', iconName: 'moon' },
  { key: 'checkups', iconName: 'healthCheck' },
] as const satisfies readonly { key: string; iconName: IconSymbolName }[];

export default function MenHealthOverview({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation('areas');
  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.menHealth }}>
        {t('menHealth.title')}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('menHealth.description')}
      </ThemedText>
      <InformationCardLink
        title={t('menHealth.information.title')}
        sheetTitle={t('menHealth.information.title')}
        iconName="hormones"
        iconColor={colors.area.menHealth}
        snapPoints={['70%', '90%']}
        items={adviceSections.map(section => ({
          key: section.key,
          iconName: section.iconName,
          title: t(`menHealth.information.${section.key}.title`),
          description: t(`menHealth.information.${section.key}.description`),
        }))}
      >
        <ThemedText>{t('menHealth.information.description')}</ThemedText>
        <ThemedText type="subtitle">{t('menHealth.information.subtitle')}</ThemedText>
      </InformationCardLink>
      <TipsList areaId={mainGoalId} />
    </>
  );
}
