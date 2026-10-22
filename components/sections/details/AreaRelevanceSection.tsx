import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import ReadConfirmation from '@/components/ui/ReadConfirmation';
import XPBadge from '@/components/ui/XPBadge';
import { getAreaViewXP } from '@/constants/tipXP';
import { XP_FOR_AREA_VIEW } from '@/constants/XP';
import { areas } from '@/locales/areas';
import type { Tip } from '@/locales/tips';

type Props = Readonly<{ tip?: Tip; areaId: string }>;
const NUMBER_OF_LINES_FOR_SUBTITLE = 4;

export default function AreaRelevanceSection({ tip, areaId }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { viewedTips, claimTipAreaXP } = useStorage();
  const viewedAreaIds = viewedTips.find(view => view.tipId === tip?.id)?.viewedAreaIds ?? [];
  const { fromPlan } = useLocalSearchParams<{ fromPlan?: string }>();
  const pendingAreaId = useRef<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  if (!tip?.areas.length) return null;
  const orderedAreas = [...tip.areas].sort((a, b) => Number(b.id === areaId) - Number(a.id === areaId));
  const title = t('common:areaRelevanceSection.relevance');

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <InformationCardLink
        title={title}
        snapPoints={['60%', '85%']}
        onSheetChange={index => setSheetOpen(index >= 0)}
        onDismiss={() => {
          setSheetOpen(false);
          const nextAreaId = pendingAreaId.current;
          if (!nextAreaId) return;
          pendingAreaId.current = null;
          router.replace({
            pathname: '/dashboard/area/[areaId]/details',
            params: { areaId: nextAreaId, prevAreaId: areaId, tipId: tip.id, ...(fromPlan === '1' ? { fromPlan: '1' } : {}) },
          });
        }}
        rows={orderedAreas.map(area => ({
          key: area.id,
          footer: (
            <ReadConfirmation
              key={`${tip.id}:${area.id}`}
              read={viewedAreaIds.includes(area.id)}
              active={sheetOpen}
              xp={XP_FOR_AREA_VIEW}
              onConfirm={() => {
                claimTipAreaXP(tip.id, area.id);
              }}
            />
          ),
          accessory: <XPBadge amount={getAreaViewXP(viewedAreaIds, area.id)} showPlus checked={viewedAreaIds.includes(area.id)} />,
          title: t(`areas:${area.id}.title`),
          subtitle: area.id === areaId ? t(`tips:${area.descriptionKey}`) : undefined,
          subtitleNumberOfLines: NUMBER_OF_LINES_FOR_SUBTITLE,
          icon: <Icon source={areas.find(item => item.id === area.id)?.icon ?? 'information-outline'} size={24} color={colors.primary} />,
          renderContent: dismiss => (
            <>
              <ThemedText>{t(`tips:${area.descriptionKey}`)}</ThemedText>
              {area.id !== areaId && (
                <AppButton
                  title={t('common:areaRelevanceSection.openArea', { area: t(`areas:${area.id}.title`) })}
                  rightIcon="chevron.right"
                  onPress={() => {
                    pendingAreaId.current = area.id;
                    dismiss();
                  }}
                />
              )}
            </>
          ),
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({ section: { gap: 12, marginBottom: 20 } });
