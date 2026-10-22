import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import { CardLinkList } from '@/components/ui/CardLinkList';
import { InformationCardLink } from '@/components/ui/InformationCardLink';
import { type Tip, tips } from '@/locales/tips';

export default function TipGroupSection({ tip, fromPlan }: Readonly<{ tip?: Tip; fromPlan?: string }>) {
  const { t } = useTranslation();
  const router = useRouter();
  const { myLevel } = useStorage();
  const pendingTip = useRef<Tip | null>(null);
  if (!tip?.groupId) return null;

  const groupId = tip.groupId;
  const otherTips = tips.filter(item => item.groupId === groupId && item.id !== tip.id);
  const title = t(`tipGroups:${groupId}.title`);

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle">{t('common:tipGroupSection.title')}</ThemedText>
      <InformationCardLink
        key={`${groupId}:${tip.id}`}
        title={title}
        iconName="link"
        snapPoints={['85%']}
        onDismiss={() => {
          const nextTip = pendingTip.current;
          pendingTip.current = null;
          const areaId = nextTip?.areas[0]?.id;
          if (!nextTip || !areaId) return;
          router.push({
            pathname: '/dashboard/area/[areaId]/details',
            params: { areaId, tipId: nextTip.id, ...(fromPlan === '1' ? { fromPlan: '1' } : {}) },
          });
        }}
      >
        {dismiss => (
          <>
            <ThemedText>{t(`tipGroups:${groupId}.description`)}</ThemedText>
            <ThemedText type="subtitle">{t('common:tipGroupSection.otherTips')}</ThemedText>
            {otherTips.length > 0 ? (
              <CardLinkList rows={otherTips.map(item => {
                const locked = (item.level ?? 1) > myLevel + 1;
                return {
                  key: item.id,
                  title: locked ? t('common:tipGroupSection.locked', { level: item.level }) : t(`tips:${item.title}`),
                  disabled: locked,
                  iconName: 'link',
                  onPress: () => {
                    pendingTip.current = item;
                    dismiss();
                  },
                };
              })} />
            ) : <ThemedText type="explainer">{t('common:tipGroupSection.empty')}</ThemedText>}
          </>
        )}
      </InformationCardLink>
    </View>
  );
}

const styles = StyleSheet.create({ section: { gap: 12, marginBottom: 20 } });
